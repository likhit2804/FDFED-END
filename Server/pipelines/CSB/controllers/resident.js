import CommonSpaces from "../../../models/commonSpaces.js";
import Amenity from "../../../models/Amenities.js";
import Community from "../../../models/communities.js";
import Resident from "../../../models/resident.js";
import Payment from "../../../models/payment.js";
import {
  createPaymentRecord,
  resolveReceiver,
} from "../../payment/services/paymentService.js";
import {
  pushNotification,
  emitToRoom,
} from "../../notifications/services/notificationService.js";
import {
  generateCustomID,
  generateRefundId,
} from "../../../utils/idGenerator.js";

import CommunityManager from "../../../models/cManager.js";
import mongoose from "mongoose";
import { getIO } from "../../../utils/socket.js";
import { sendSuccess, sendError } from "./manager.js";
import { validateBookingPayload } from "../utils/csbValidation.js";



// --------------------------------------------------
// RESIDENT: Get Common Spaces (bookings + spaces list)
// --------------------------------------------------
export const getResidentCommonSpaces = async (req, res) => {
  try {
    const [bookings, spaces] = await Promise.all([
      CommonSpaces.find({ bookedBy: req.user.id })
        .populate("payment")
        .sort({ createdAt: -1 }),
      Amenity.find({ community: req.user.community })
    ]);

    return res.json({ success: true, bookings, spaces });
  } catch (err) {
    console.log(err);
    return sendError(res, 500, "Internal server error", err);
  }
};

// --------------------------------------------------
// RESIDENT: Get Single Booking Details
// --------------------------------------------------
export const getBookingById = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const commonspace =
      await CommonSpaces.findById(bookingId).populate("payment");

    if (!commonspace) {
      return sendError(res, 404, "Booking not found");
    }

    if (commonspace.bookedBy.toString() !== req.user.id) {
      return sendError(res, 403, "Unauthorized access");
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

    const { amount } = req.body.data;

    const Space = await Amenity.findById(fid);
    if (!Space) return sendError(res, 404, "Selected amenity not found");
    if (!Space.bookable) return sendError(res, 400, "This amenity is not bookable");

    const validation = validateBookingPayload(req.body.newBooking);
    if (!validation.valid)
      return sendError(res, validation.status, validation.message);
    const bookingDate = validation.bookingDate;
    const bookingAmount = Number(amount) || 0;

    const b = await CommonSpaces.create({
      name: facility || Space.name,
      description: purpose || "No purpose specified",
      Date: new Date(dateString),
      from,
      to,
      Type,
      amount: bookingAmount,
      status: Type === "Slot" ? "Booked" : "Active",
      paymentStatus: bookingAmount > 0 ? "Pending" : "Success",
      availability: null,
      bookedBy: uid,
      community: new mongoose.Types.ObjectId(req.user.community),
    });

    let uniqueId = generateCustomID(b._id.toString(), "CS", null);
    b.ID = uniqueId;
    await b.save();

    if (Type === "Slot") {
      const bookingDateStr = bookingDate.toISOString().split("T")[0];
      const requestTimeSlots = validation.timeSlots;

      const spaceDoc = await Amenity.findById(Space._id);
      let existingBookingIndex = spaceDoc.bookedSlots.findIndex(
        (b) => new Date(b.date).toISOString().split("T")[0] === bookingDateStr,
      );

      if (existingBookingIndex !== -1) {
        requestTimeSlots.forEach((slot) => {
          if (!spaceDoc.bookedSlots[existingBookingIndex].slots.includes(slot)) {
            spaceDoc.bookedSlots[existingBookingIndex].slots.push(slot);
          }
        });
      } else {
        spaceDoc.bookedSlots.push({
          date: bookingDate,
          slots: requestTimeSlots,
        });
      }

      await spaceDoc.save();
    }

    uniqueId = generateCustomID(b._id.toString(), "PY", null);

    if (bookingAmount > 0) {
      const receiverId = await resolveReceiver(req.user.community);
      if (!receiverId) {
        return sendError(
          res,
          400,
          "Community manager not found for this booking payment",
        );
      }

      const payment = await createPaymentRecord({
        title: b._id.toString(),
        senderId: b.bookedBy,
        receiverId,
        amount: bookingAmount,
        communityId: req.user.community,
        paymentMethod: "None",
        status: "Pending",
        belongTo: "CommonSpaces",
        belongToId: b._id,
      });
      payment.ID = uniqueId;
      await payment.save();

      b.paymentStatus = payment.status === "Completed" ? "Success" : "Pending";
      b.payment = payment._id;
      await b.save();
    }

    const user = await Resident.findById(uid);
    if (user) {
      user.bookedCommonSpaces.push(b._id);
      await user.save();
    }

    if (b.payment) {
      await b.populate("payment");
    }

    // Emit booking notification to community managers
    try {
      const managers = await CommunityManager.find({
        assignedCommunity: req.user.community,
      });

      if (managers.length > 0) {
        const notif = await pushNotification(
          CommunityManager,
          managers[0]._id,
          {
            type: "CommonSpaceBooking",
            title: "New Common Space Bookings",
            message: "There are new common space bookings",
            referenceId: b._id,
            referenceType: "CommonSpaces",
          },
        );

        emitToRoom(`community_${req.user.community}`, "booking:new", notif);
        console.log(`✅ Booking emission sent successfully`);
      }
    } catch (emitErr) {
      console.error("❌ Failed to emit booking:new:", emitErr);
    }

    return sendSuccess(res, "Booking request submitted successfully!", {
      space: b,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    return sendError(
      res,
      500,
      "Something went wrong. Please try again.",
      error,
    );
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
      return res
        .status(400)
        .json({ error: "Cannot cancel past or ongoing bookings." });
    }

    const diffHours = (bookingDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    const amount = Number(booking?.amount) || 0;
    console.log("booking : ", booking);

    if (isNaN(amount) || amount < 0) {
      return res.status(400).json({ error: "Invalid booking amount." });
    }

    console.log("Difference in hours until booking:", diffHours);

    let refundAmount = amount;
    if (diffHours >= 48) {
      refundAmount = amount;
      console.log("Refund 100% (>48h)", refundAmount);
    } else if (diffHours >= 24) {
      refundAmount = amount * 0.75;
      console.log("Refund 75% (>24h)", refundAmount);
    } else if (diffHours >= 4) {
      refundAmount = amount * 0.25;
      console.log("Refund 25% (>4h)", refundAmount);
    } else {
      refundAmount = 0;
      console.log("Refund 0% (<4h)", refundAmount);
    }

    const refundId = generateRefundId(String(booking._id));
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
    return sendError(res, 500, "Internal Server Error", error);
  }
};

// --------------------------------------------------
// RESIDENT: Get Facilities
// --------------------------------------------------
export const getFacilities = async (req, res) => {
  try {
    const community = await Community.findById(req.user.community).select(
      "commonSpaces",
    );
    const facilities = community.commonSpaces || [];

    console.log("Raw facilities from database fetched successfully.");

    res.json({ success: true, facilities });
  } catch (error) {
    console.error("Error fetching facilities:", error);
    return sendError(res, 500, "Failed to fetch facilities data", error);
  }
};
