import CommonSpaces from "../../../models/commonSpaces.js";
import Amenity from "../../../models/Amenities.js";
import Community from "../../../models/communities.js";
import mongoose from "mongoose";

// --------------------------------------------------
// Shared helpers (inline to avoid deep relative paths)
// --------------------------------------------------
const sendSuccess = (res, message, data = {}, statusCode = 200) =>
    res.status(statusCode).json({ success: true, message, ...data });

const sendError = (res, statusCode, message, error = null) => {
    if (error) console.error(error);
    return res.status(statusCode).json({ success: false, message });
};

const validateFields = (fields, res) => {
    for (const [key, value] of Object.entries(fields)) {
        if (!value || (typeof value === "string" && !value.trim())) {
            sendError(res, 400, `${key} is required`);
            return false;
        }
    }
    return true;
};

// --------------------------------------------------
// MANAGER: Get Common Spaces + All Bookings
// --------------------------------------------------
export const getCommonSpaces = async (req, res) => {
    try {
        const c = req.user.community;
        const bookings = await CommonSpaces.find({
            community: c,
            status: { $ne: "Rejected" },
        })
            .populate("payment")
            .populate("bookedBy", "residentFirstname residentLastname email")
            .sort({ createdAt: -1 });

        const commonSpaces = await Amenity.find({ community: c });

        res.status(200).json({ bookings, commonSpaces });
    } catch (err) {
        console.error("Error fetching common spaces and bookings:", err);
        return sendError(res, 500, "Failed to fetch common spaces and bookings", err);
    }
};

// --------------------------------------------------
// MANAGER: Get Common Space Bookings (API)
// --------------------------------------------------
export const getCommonSpaceBookings = async (req, res) => {
    try {
        const c = req.user.community;
        const csb = await CommonSpaces.find({ community: c }).sort({ createdAt: -1 });

        res.json({ success: true, bookings: csb });
    } catch (error) {
        console.error("Error fetching bookings:", error);
        return sendError(res, 500, "Failed to fetch bookings", error);
    }
};

// --------------------------------------------------
// MANAGER: Get Booking Details
// --------------------------------------------------
export const getBookingDetails = async (req, res) => {
    try {
        const booking = await CommonSpaces.findById(req.params.id)
            .populate("bookedBy", "residentFirstname residentLastname email")
            .populate("payment")
            .populate("community", "name");

        if (!booking) return sendError(res, 404, "Booking not found");

        res.json({
            success: true,
            name: booking.name,
            description: booking.description,
            date: booking.Date,
            from: booking.from,
            to: booking.to,
            status: booking.status,
            paymentStatus: booking.paymentStatus,
            payment: booking.payment || null,
            availability: booking.availability,
            ID: booking.ID,
            bookedBy: booking.bookedBy
                ? {
                    name:
                        booking.bookedBy.residentFirstname +
                        " " +
                        booking.bookedBy.residentLastname,
                    email: booking.bookedBy.email,
                }
                : null,
            community: booking.community?.name || null,
            feedback: booking.feedback,
        });
    } catch (err) {
        console.error(err);
        return sendError(res, 500, "Server error", err);
    }
};

// --------------------------------------------------
// MANAGER: Reject Booking
// --------------------------------------------------
export const rejectBooking = async (req, res) => {
    const id = req.params.id;
    const { reason } = req.body;
    try {
        const b = await CommonSpaces.findById(id).populate("bookedBy");

        if (!b) return sendError(res, 404, "Booking not found");

        b.availability = "NO";
        b.paymentStatus = null;
        b.status = "Rejected";
        b.feedback = reason;

        b.bookedBy.notifications.push({
            belongs: "CS",
            n: `Your common space booking ${b.ID ? b.ID : b.title} has been cancelled`,
            createdAt: new Date(),
        });

        await b.save();
        return sendSuccess(res, "Booking rejected successfully.");
    } catch (err) {
        console.error(err);
        return sendError(res, 500, "Internal server error", err);
    }
};

// --------------------------------------------------
// MANAGER: Create Space
// --------------------------------------------------
export const createSpace = async (req, res) => {
    try {
        const { spaceType, spaceName, bookingRent, Type } = req.body;

        if (!validateFields({ spaceType, spaceName }, res)) return;

        const existingSpace = await Amenity.find({
            spaceName,
            community: req.user.community,
        });

        if (existingSpace.length > 0) {
            return sendError(res, 400, "A space with this name already exists");
        }

        const newSpace = await Amenity.create({
            type: spaceType.trim(),
            name: spaceName.trim(),
            bookable: req.body.bookable !== undefined ? Boolean(req.body.bookable) : true,
            bookingRules: req.body.bookingRules ? req.body.bookingRules.trim() : "",
            rent: bookingRent,
            community: new mongoose.Types.ObjectId(req.user.community),
            createdAt: new Date(),
            updatedAt: new Date(),
            Type,
        });

        return sendSuccess(res, "Space created successfully", { space: newSpace }, 201);
    } catch (error) {
        console.error("Error creating space:", error);
        return sendError(res, 500, "Internal server error", error);
    }
};

// --------------------------------------------------
// MANAGER: Update Space
// --------------------------------------------------
export const updateSpace = async (req, res) => {
    try {
        const spaceId = req.params.id;
        if (!spaceId) return sendError(res, 400, "Space ID is required");

        const space = await Amenity.findById(spaceId);
        if (!space) return sendError(res, 404, "Space not found");

        const { spaceType, spaceName, bookingRules, bookable, bookingRent, Type } = req.body;

        if (
            (spaceType !== undefined && !spaceType.trim()) ||
            (spaceName !== undefined && !spaceName.trim())
        ) {
            return sendError(res, 400, "Space type and name cannot be empty");
        }

        if (spaceName && spaceName.trim()) {
            const duplicateSpace = await Amenity.find({
                spaceName,
                community: req.user.community,
            });
            if (duplicateSpace.length > 0 && duplicateSpace[0]._id.toString() !== spaceId) {
                return sendError(res, 400, "A space with this name already exists");
            }
        }

        space.name = spaceName;
        space.type = spaceType;
        space.bookingRules = bookingRules;
        space.bookable = bookable;
        space.rent = bookingRent;
        if (Type) space.Type = Type;
        space.updatedAt = new Date();
        await space.save();

        return sendSuccess(res, "Space updated successfully", { space });
    } catch (error) {
        console.error("Error updating space:", error);
        return sendError(res, 500, "Internal server error", error);
    }
};

// --------------------------------------------------
// MANAGER: Delete Space
// --------------------------------------------------
export const deleteSpace = async (req, res) => {
    try {
        const spaceId = req.params.id;
        if (!spaceId) return sendError(res, 400, "Space ID is required");

        const space = await Amenity.findByIdAndDelete(spaceId);
        if (!space) return sendError(res, 404, "Space not found");

        return sendSuccess(res, "Common space deleted successfully", {
            deletedSpace: { id: spaceId },
        });
    } catch (error) {
        console.error("Error deleting common space:", error);
        return sendError(res, 500, "Internal server error", error);
    }
};

// --------------------------------------------------
// MANAGER: Update Booking Rules
// --------------------------------------------------
export const updateBookingRules = async (req, res) => {
    try {
        if (req.body.rules === undefined) {
            return sendError(res, 400, "Booking rules are required");
        }

        const community = await Community.findById(req.user.community);
        if (!community) return sendError(res, 404, "Community not found");

        const sanitizedRules = req.body.rules ? req.body.rules.trim() : "";
        community.bookingRules = sanitizedRules;
        community.updatedAt = new Date();
        await community.save();

        return sendSuccess(res, "Booking rules updated successfully", {
            rules: sanitizedRules,
        });
    } catch (error) {
        console.error("Error updating booking rules:", error);
        return sendError(res, 500, "Internal server error", error);
    }
};

// --------------------------------------------------
// MANAGER: Get Spaces (from community)
// --------------------------------------------------
export const getSpaces = async (req, res) => {
    try {
        const community = await Community.findById(req.user.community);
        if (!community) return sendError(res, 404, "Community not found");

        return sendSuccess(res, "Spaces fetched successfully", {
            spaces: community.commonSpaces,
            totalSpaces: community.commonSpaces.length,
        });
    } catch (error) {
        console.error("Error fetching spaces:", error);
        return sendError(res, 500, "Internal server error", error);
    }
};
