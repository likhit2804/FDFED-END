import CommonSpaces from "../../../models/commonSpaces.js";
import Amenity from "../../../models/Amenities.js";
import Community from "../../../models/communities.js";
import Resident from "../../../models/resident.js";
import Payment from "../../../models/payment.js";
import { createPaymentRecord } from "../../payment/services/paymentService.js";
import { pushNotification, emitToRoom } from "../../notifications/services/notificationService.js";

import CommunityManager from "../../../models/cManager.js";
import mongoose from "mongoose";
import { getIO } from "../../../utils/socket.js";

// --------------------------------------------------
// Shared helper
// --------------------------------------------------
function generateCustomID(userEmail, facility, countOrRandom = null) {
    const code = userEmail.toUpperCase().trim();
    const facilityCode = facility.toUpperCase().slice(0, 2);
    const suffix = countOrRandom
        ? String(countOrRandom).padStart(4, "0")
        : String(Math.floor(1000 + Math.random() * 9000));
    return `${code}-${facilityCode}-${suffix}`;
}

// --------------------------------------------------
// RESIDENT: Get Common Spaces (bookings + spaces list)
// --------------------------------------------------
export const getResidentCommonSpaces = async (req, res) => {
    try {
        const bookings = await CommonSpaces.find({ bookedBy: req.user.id })
            .populate("payment")
            .sort({ createdAt: -1 });

        const spaces = await Amenity.find({ community: req.user.community });

        return res.json({ success: true, bookings, spaces });
    } catch (err) {
        console.log(err);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// --------------------------------------------------
// RESIDENT: Get Single Booking Details
// --------------------------------------------------
export const getBookingById = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const commonspace = await CommonSpaces.findById(bookingId).populate("payment");

        if (!commonspace) {
            return res.status(404).json({ error: "Booking not found" });
        }

        if (commonspace.bookedBy.toString() !== req.user.id) {
            return res.status(403).json({ error: "Unauthorized access" });
        }

        console.log("Commonspace Data:", commonspace);
        res.status(200).json({ commonspace });
    } catch (error) {
        console.error("Error fetching booking details:", error);
        res.status(500).json({ error: "Server error" });
    }
};

// --------------------------------------------------
// RESIDENT: Create Booking
// --------------------------------------------------
export const createBooking = async (req, res) => {
    try {
        const uid = req.user.id;
        console.log(req.body);

        const {
            facility,
            fid,
            purpose,
            Date: dateString,
            from,
            to,
            Type,
        } = req.body.newBooking;

        const { bill, amount, paymentMethod } = req.body.data;

        const Space = await Amenity.findById(fid);

        if (!facility || !dateString) {
            return res.json({
                success: false,
                message: "Facility, date, and time are required fields.",
            });
        }

        const bookingDate = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (bookingDate < today) {
            return res.json({ success: false, message: "Cannot book for past dates." });
        }

        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if ((!timeRegex.test(from) || !timeRegex.test(to)) && Type === "Slot") {
            console.log("invalid time format");
            return res.json({ success: false, message: "Invalid time format." });
        }

        const [fromHour, fromMin] = from.split(":").map(Number);
        const [toHour, toMin] = to.split(":").map(Number);
        const fromMinutes = fromHour * 60 + fromMin;
        const toMinutes = toHour * 60 + toMin;

        if (toMinutes && fromMinutes && toMinutes <= fromMinutes) {
            return res.json({ success: false, message: "End time must be after start time." });
        }

        const b = await CommonSpaces.create({
            name: facility,
            description: purpose || "No purpose specified",
            Date: new Date(dateString),
            from,
            to,
            Type,
            amount,
            status: Type === "Slot" ? "Booked" : "Active",
            availability: null,
            bookedBy: uid,
            community: new mongoose.Types.ObjectId(req.user.community),
        });

        let uniqueId = generateCustomID(b._id.toString(), "CS", null);
        b.ID = uniqueId;
        await b.save();

        if (Type === "Slot") {
            const bookingDateStr = new Date(dateString).toISOString().split("T")[0];
            const requestTimeSlots = req.body.newBooking.timeSlots;

            if (requestTimeSlots.length === 0) {
                return res.json({ success: false, message: "Selected time range is invalid." });
            }

            let existingBooking = Space.bookedSlots.find(
                (b) => new Date(b.date).toISOString().split("T")[0] === bookingDateStr
            );

            if (existingBooking) {
                const newSlots = requestTimeSlots.filter(
                    (slot) => !existingBooking.slots.includes(slot)
                );
                existingBooking.slots.push(...newSlots);
            } else {
                Space.bookedSlots.push({ date: new Date(dateString), slots: requestTimeSlots });
            }

            await Space.save();
        }

        uniqueId = generateCustomID(b._id.toString(), "PY", null);

        const payment = await createPaymentRecord({
            title: b._id.toString(),
            senderId: b.bookedBy,
            receiverId: new mongoose.Types.ObjectId(req.user.community),
            amount,
            communityId: req.user.community,
            paymentMethod,
            status: "Completed",
            belongTo: "CommonSpaces",
            belongToId: b._id,
        });
        payment.ID = uniqueId;
        await payment.save();

        b.paymentstatus = "Paid";
        b.payment = payment._id;
        await b.save();

        const user = await Resident.findById(uid);
        if (user) {
            user.bookedCommonSpaces.push(b._id);
            await user.save();
        }

        await b.populate("payment");

        // Emit booking notification to community managers
        try {
            const managers = await CommunityManager.find({
                assignedCommunity: req.user.community,
            });

            if (managers.length > 0) {
                const notif = await pushNotification(CommunityManager, managers[0]._id, {
                    type: "CommonSpaceBooking",
                    title: "New Common Space Bookings",
                    message: "There are new common space bookings",
                    referenceId: b._id,
                    referenceType: "CommonSpaces",
                });

                emitToRoom(`community_${req.user.community}`, "booking:new", notif);
                console.log(`✅ Booking emission sent successfully`);
            }
        } catch (emitErr) {
            console.error("❌ Failed to emit booking:new:", emitErr);
        }

        return res.json({
            success: true,
            message: "Booking request submitted successfully!",
            space: b,
        });
    } catch (error) {
        console.error("Error creating booking:", error);
        res.json({ success: false, message: "Something went wrong. Please try again." });
    }
};

// --------------------------------------------------
// RESIDENT: Cancel Booking
// --------------------------------------------------
export const cancelBooking = async (req, res) => {
    try {
        const bookingId = req.params.id;
        const residentId = req.user.id;

        const booking = await CommonSpaces.findOne({
            _id: bookingId,
            bookedBy: residentId,
        });

        if (!booking) {
            return res
                .status(404)
                .json({ error: "Booking not found or unauthorized cancellation." });
        }

        const bookingDate = new Date(booking.Date);
        const now = new Date();

        if (bookingDate < now) {
            return res.status(400).json({ error: "Cannot cancel past or ongoing bookings." });
        }

        const diffHours = Math.abs((bookingDate - now) / (1000 * 60 * 60));
        const amount = Number(booking?.amount || 0);
        console.log("booking : ", booking);

        if (isNaN(amount)) {
            return res.status(400).json({ error: "Invalid booking amount." });
        }

        console.log(diffHours);

        let refundAmount = booking?.amount;
        if (diffHours >= 48) {
            refundAmount = amount;
            console.log("greater than 48", refundAmount);
        } else if (diffHours >= 24) {
            refundAmount = amount * 0.75;
            console.log("greater than 24", refundAmount);
        } else if (diffHours >= 4) {
            refundAmount = amount * 0.25;
            console.log("greater than 4", refundAmount);
        } else {
            console.log("greater than 0");
            refundAmount = 0;
        }

        const refundId = generateCustomID(String(booking._id), "RF", null);
        console.log("After block : ", refundAmount);

        await CommonSpaces.findByIdAndUpdate(bookingId, {
            refundId,
            status: "Cancelled",
            cancelledBy: residentId,
            cancelledAt: new Date(),
            cancellationReason: "Cancelled by resident",
            refundAmount: Math.round(refundAmount),
        });

        await Resident.findByIdAndUpdate(residentId, {
            $pull: { bookedCommonSpaces: bookingId },
        });

        return res.json({
            success: true,
            message: "Booking cancelled successfully",
            refundAmount: Math.round(refundAmount),
            refundId,
        });
    } catch (error) {
        console.error("Error cancelling booking:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
};

// --------------------------------------------------
// RESIDENT: Get Facilities
// --------------------------------------------------
export const getFacilities = async (req, res) => {
    try {
        const community = await Community.findById(req.user.community).select("commonSpaces");
        const facilities = community.commonSpaces || [];

        console.log("Raw facilities from database:", facilities);

        res.json({ success: true, facilities });
    } catch (error) {
        console.error("Error fetching facilities:", error);
        res.status(500).json({ success: false, error: "Failed to fetch facilities data" });
    }
};

// --------------------------------------------------
// RESIDENT: Get All Bookings (simple list)
// --------------------------------------------------
export const getResidentBookings = async (req, res) => {
    try {
        const bookings = await CommonSpaces.find({ bookedBy: req.user.id });
        return res.json({ success: true, bookings });
    } catch (err) {
        console.log(err);
    }
};
