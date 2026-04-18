import CommonSpaces from "../../../models/commonSpaces.js";
import Amenity from "../../../models/Amenities.js";
import Community from "../../../models/communities.js";
import CommunityManager from "../../../models/cManager.js";
import Payment from "../../../models/payment.js";
import mongoose from "mongoose";
import { generateRefundId } from "../../../utils/idGenerator.js";

export const sendSuccess = (res, message, data = {}, statusCode = 200) =>
  res.status(statusCode).json({ success: true, message, ...data });

export const sendError = (res, statusCode, message, error = null) => {
  if (error) console.error(error);
  return res.status(statusCode).json({ success: false, message });
};

export const validateFields = (fields, res) => {
  for (const [key, value] of Object.entries(fields)) {
    if (!value || (typeof value === "string" && !value.trim())) {
      sendError(res, 400, `${key} is required`);
      return false;
    }
  }
  return true;
};

const normalizeObjectId = (value) => {
  if (!value) return null;
  if (value instanceof mongoose.Types.ObjectId) return value;
  return mongoose.Types.ObjectId.isValid(value)
    ? new mongoose.Types.ObjectId(value)
    : value;
};

const getManagerCommunityId = async (req) => {
  const manager = await CommunityManager.findById(req.user.id)
    .select("assignedCommunity")
    .lean();

  return normalizeObjectId(manager?.assignedCommunity || req.user.community);
};

const normalizeDateOnly = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().split("T")[0];
};

const parseSlotTimeToMinutes = (timeValue) => {
  const match = /^([0-1]?\d|2[0-3]):([0-5]\d)$/.exec(String(timeValue || ""));
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

const buildSlotsFromRange = (from, to) => {
  const fromMinutes = parseSlotTimeToMinutes(from);
  const toMinutes = parseSlotTimeToMinutes(to);
  if (fromMinutes === null || toMinutes === null || toMinutes <= fromMinutes) {
    return [];
  }

  const slots = [];
  for (let minutes = fromMinutes; minutes < toMinutes; minutes += 60) {
    const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
    slots.push(`${hour}:00`);
  }
  return slots;
};

const validateTimeString = (value, fieldName) => {
  const minutes = parseSlotTimeToMinutes(value);
  if (minutes === null) {
    throw new Error(`Invalid ${fieldName}. Expected HH:mm format.`);
  }
  return minutes;
};

const normalizeDateInput = (dateValue, fieldName = "date") => {
  const normalized = normalizeDateOnly(dateValue);
  if (!normalized) {
    throw new Error(`Invalid ${fieldName}.`);
  }
  return normalized;
};

const sanitizeClosedSlots = (closedSlots = []) => {
  if (!Array.isArray(closedSlots)) return [];

  const unique = new Set();
  for (const slot of closedSlots) {
    const normalizedSlot = String(slot || "").trim();
    if (!normalizedSlot) continue;
    const minutes = parseSlotTimeToMinutes(normalizedSlot);
    if (minutes === null) {
      throw new Error(`Invalid slot value "${normalizedSlot}" in closedSlots.`);
    }
    const hh = String(Math.floor(minutes / 60)).padStart(2, "0");
    const mm = String(minutes % 60).padStart(2, "0");
    unique.add(`${hh}:${mm}`);
  }

  return [...unique].sort();
};

const sanitizeAvailabilityControls = (rawControls = {}) => {
  const controls = rawControls || {};
  const rawSlotConfig = controls.slotConfig || {};
  const rawPolicy = controls.bookingPolicy || {};
  const rawBlackouts = Array.isArray(controls.blackoutDates)
    ? controls.blackoutDates
    : [];
  const rawOverrides = Array.isArray(controls.dateSlotOverrides)
    ? controls.dateSlotOverrides
    : [];

  const startTime = String(rawSlotConfig.startTime || "06:00").trim();
  const endTime = String(rawSlotConfig.endTime || "22:00").trim();
  const startMinutes = validateTimeString(startTime, "startTime");
  const endMinutes = validateTimeString(endTime, "endTime");

  if (endMinutes <= startMinutes) {
    throw new Error("endTime must be after startTime.");
  }

  const minAdvanceHours =
    rawPolicy.minAdvanceHours !== undefined && rawPolicy.minAdvanceHours !== null
      ? Number(rawPolicy.minAdvanceHours)
      : 0;
  const maxAdvanceDays =
    rawPolicy.maxAdvanceDays !== undefined && rawPolicy.maxAdvanceDays !== null
      ? Number(rawPolicy.maxAdvanceDays)
      : 90;
  const sameDayCutoffTime = String(
    rawPolicy.sameDayCutoffTime || endTime,
  ).trim();

  if (!Number.isFinite(minAdvanceHours) || minAdvanceHours < 0 || minAdvanceHours > 720) {
    throw new Error("minAdvanceHours must be between 0 and 720.");
  }
  if (!Number.isFinite(maxAdvanceDays) || maxAdvanceDays < 1 || maxAdvanceDays > 365) {
    throw new Error("maxAdvanceDays must be between 1 and 365.");
  }
  validateTimeString(sameDayCutoffTime, "sameDayCutoffTime");

  const blackoutByDate = new Map();
  for (const blackout of rawBlackouts) {
    if (!blackout) continue;
    const dateKey = normalizeDateInput(blackout.date, "blackout date");
    blackoutByDate.set(dateKey, {
      date: new Date(dateKey),
      reason: String(blackout.reason || "").trim(),
    });
  }

  const overridesByDate = new Map();
  for (const override of rawOverrides) {
    if (!override) continue;
    const dateKey = normalizeDateInput(override.date, "date override");
    overridesByDate.set(dateKey, {
      date: new Date(dateKey),
      closedAllDay: Boolean(override.closedAllDay),
      closedSlots: sanitizeClosedSlots(override.closedSlots),
      reason: String(override.reason || "").trim(),
    });
  }

  return {
    slotConfig: {
      startTime,
      endTime,
    },
    bookingPolicy: {
      minAdvanceHours,
      maxAdvanceDays,
      sameDayCutoffTime,
    },
    blackoutDates: [...blackoutByDate.values()].sort((a, b) =>
      a.date.getTime() - b.date.getTime(),
    ),
    dateSlotOverrides: [...overridesByDate.values()].sort((a, b) =>
      a.date.getTime() - b.date.getTime(),
    ),
  };
};

const releaseBookedSlotsForManagerCancellation = async (booking) => {
  if (!booking || booking.Type !== "Slot") return;

  const bookingDateOnly = normalizeDateOnly(booking.Date);
  if (!bookingDateOnly) return;

  const slotsToRelease = buildSlotsFromRange(booking.from, booking.to);
  if (slotsToRelease.length === 0) return;

  const amenity = await Amenity.findOne({
    community: booking.community,
    name: booking.name,
  });
  if (!amenity) return;

  const dateIndex = amenity.bookedSlots.findIndex(
    (entry) => normalizeDateOnly(entry.date) === bookingDateOnly,
  );
  if (dateIndex === -1) return;

  const slotEntry = amenity.bookedSlots[dateIndex];
  slotEntry.slots = (slotEntry.slots || []).filter(
    (slot) => !slotsToRelease.includes(slot),
  );

  if (!slotEntry.slots.length) {
    amenity.bookedSlots.splice(dateIndex, 1);
  }

  await amenity.save();
};

// --------------------------------------------------
// MANAGER: Get Common Spaces + All Bookings
// --------------------------------------------------
export const getCommonSpaces = async (req, res) => {
  try {
    const communityId = await getManagerCommunityId(req);
    if (!communityId) {
      return sendError(res, 404, "Community not found for this manager");
    }

    const [bookings, commonSpaces] = await Promise.all([
      CommonSpaces.find({
        community: communityId,
        status: { $ne: "Rejected" },
      })
        .populate("payment")
        .populate("bookedBy", "residentFirstname residentLastname email")
        .sort({ createdAt: -1 }),
      Amenity.find({ community: communityId }),
    ]);

    res.status(200).json({ bookings, commonSpaces });
  } catch (err) {
    console.error("Error fetching common spaces and bookings:", err);
    return sendError(
      res,
      500,
      "Failed to fetch common spaces and bookings",
      err,
    );
  }
};

// --------------------------------------------------
// MANAGER: Get Common Space Bookings (API)
// --------------------------------------------------
export const getCommonSpaceBookings = async (req, res) => {
  try {
    const communityId = await getManagerCommunityId(req);
    if (!communityId) {
      return sendError(res, 404, "Community not found for this manager");
    }

    const csb = await CommonSpaces.find({ community: communityId }).sort({
      createdAt: -1,
    });

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
    const communityId = await getManagerCommunityId(req);
    const booking = await CommonSpaces.findById(req.params.id)
      .populate("bookedBy", "residentFirstname residentLastname email")
      .populate("payment")
      .populate("community", "name");

    if (!booking) return sendError(res, 404, "Booking not found");
    if (
      communityId &&
      booking.community &&
      booking.community._id.toString() !== communityId.toString()
    ) {
      return sendError(res, 403, "Unauthorized access to this booking");
    }

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
  const {
    reason,
    refundType = "none",
    refundPercentage,
    refundAmount,
  } = req.body;

  try {
    if (!reason || !reason.trim()) {
      return sendError(res, 400, "Cancellation reason is required");
    }

    const normalizedRefundType = String(refundType).toLowerCase();
    if (!["none", "full", "partial"].includes(normalizedRefundType)) {
      return sendError(res, 400, "Invalid refund type");
    }

    const communityId = await getManagerCommunityId(req);
    const booking = await CommonSpaces.findById(id).populate("bookedBy");

    if (!booking) return sendError(res, 404, "Booking not found");
    if (
      communityId &&
      booking.community &&
      booking.community.toString() !== communityId.toString()
    ) {
      return sendError(res, 403, "Unauthorized access to this booking");
    }

    const terminalStatuses = new Set([
      "Rejected",
      "Cancelled",
      "Cancelled By Resident",
      "Cancelled By Manager",
      "Completed",
      "Expired",
    ]);
    if (terminalStatuses.has(booking.status)) {
      return sendError(
        res,
        400,
        `Booking is already in terminal state: ${booking.status}`,
      );
    }

    const totalAmount = Number(booking.amount) || 0;
    let computedRefundAmount = 0;
    let computedRefundPercentage = null;

    if (normalizedRefundType === "full") {
      computedRefundAmount = totalAmount;
      computedRefundPercentage = totalAmount > 0 ? 100 : 0;
    } else if (normalizedRefundType === "partial") {
      if (totalAmount <= 0) {
        return sendError(
          res,
          400,
          "Partial refund is not applicable when booking amount is zero",
        );
      }

      const parsedAmount =
        refundAmount !== undefined && refundAmount !== null && refundAmount !== ""
          ? Number(refundAmount)
          : null;
      const parsedPercentage =
        refundPercentage !== undefined &&
        refundPercentage !== null &&
        refundPercentage !== ""
          ? Number(refundPercentage)
          : null;

      if (
        parsedAmount !== null &&
        Number.isFinite(parsedAmount) &&
        parsedAmount >= 0 &&
        parsedAmount <= totalAmount
      ) {
        computedRefundAmount = parsedAmount;
        computedRefundPercentage =
          totalAmount > 0 ? (parsedAmount / totalAmount) * 100 : 0;
      } else if (
        parsedPercentage !== null &&
        Number.isFinite(parsedPercentage) &&
        parsedPercentage >= 0 &&
        parsedPercentage <= 100
      ) {
        computedRefundPercentage = parsedPercentage;
        computedRefundAmount = (totalAmount * parsedPercentage) / 100;
      } else {
        return sendError(
          res,
          400,
          "For partial refund, provide valid refundAmount or refundPercentage",
        );
      }
    }

    computedRefundAmount = Math.round(computedRefundAmount * 100) / 100;
    if (computedRefundPercentage !== null) {
      computedRefundPercentage =
        Math.round(Number(computedRefundPercentage) * 100) / 100;
    }

    let linkedPayment = null;
    if (booking.payment) {
      linkedPayment = await Payment.findById(booking.payment);
      if (linkedPayment) {
        if (computedRefundAmount > 0) {
          linkedPayment.status = "Refunded";
          linkedPayment.remarks = [
            linkedPayment.remarks,
            `Manager cancellation: ${reason.trim()}. Refund ₹${computedRefundAmount}.`,
          ]
            .filter(Boolean)
            .join(" | ");
        } else if (linkedPayment.status === "Pending") {
          linkedPayment.status = "Failed";
          linkedPayment.remarks = [
            linkedPayment.remarks,
            `Manager cancellation: ${reason.trim()}. No refund.`,
          ]
            .filter(Boolean)
            .join(" | ");
        }
        await linkedPayment.save();
      }
    }

    await releaseBookedSlotsForManagerCancellation(booking);

    booking.availability = "NO";
    booking.status = "Cancelled By Manager";
    booking.feedback = reason.trim();
    booking.cancellationReason = reason.trim();
    booking.cancelledAt = new Date();
    booking.refundAmount = computedRefundAmount;
    booking.refundId =
      computedRefundAmount > 0 ? generateRefundId(String(booking._id)) : null;
    booking.paymentStatus =
      computedRefundAmount > 0
        ? "Refunded"
        : linkedPayment?.status === "Failed"
          ? "Failed"
          : booking.paymentStatus;
    booking.managerCancellation = {
      reason: reason.trim(),
      refundType: normalizedRefundType,
      refundPercentage: computedRefundPercentage,
      refundAmount: computedRefundAmount,
      cancelledBy: req.user.id,
      cancelledAt: new Date(),
    };
    booking.auditTrail.push({
      actionBy: req.user.id,
      role: "Manager",
      action: "Booking cancelled by manager",
      notes: `Reason: ${reason.trim()} | Refund: ${normalizedRefundType} (₹${computedRefundAmount})`,
    });

    if (booking.bookedBy?.notifications) {
      booking.bookedBy.notifications.push({
        belongs: "CS",
        n: `Your common space booking ${booking.ID || booking.name} was cancelled by manager. Refund: ₹${computedRefundAmount}`,
        createdAt: new Date(),
      });
      await booking.bookedBy.save();
    }

    await booking.save();
    await booking.populate("payment");

    return sendSuccess(res, "Booking cancelled successfully.", {
      booking,
      refund: {
        refundType: normalizedRefundType,
        refundAmount: computedRefundAmount,
        refundPercentage: computedRefundPercentage,
      },
    });
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
    const {
      spaceType,
      spaceName,
      bookingRent,
      Type,
      availabilityControls,
    } = req.body;
    const communityId = await getManagerCommunityId(req);

    if (!validateFields({ spaceType, spaceName }, res)) return;
    if (!communityId) {
      return sendError(res, 404, "Community not found for this manager");
    }

    const existingSpace = await Amenity.find({
      name: spaceName.trim(),
      community: communityId,
    });

    if (existingSpace.length > 0) {
      return sendError(res, 400, "A space with this name already exists");
    }

    const sanitizedControls = sanitizeAvailabilityControls(availabilityControls);
    const newSpace = await Amenity.create({
      type: spaceType.trim(),
      name: spaceName.trim(),
      bookable:
        req.body.bookable !== undefined ? Boolean(req.body.bookable) : true,
      bookingRules: req.body.bookingRules ? req.body.bookingRules.trim() : "",
      rent:
        bookingRent !== undefined && bookingRent !== null && bookingRent !== ""
          ? Number(bookingRent)
          : 0,
      community: communityId,
      createdAt: new Date(),
      updatedAt: new Date(),
      Type,
      availabilityControls: sanitizedControls,
    });

    return sendSuccess(
      res,
      "Space created successfully",
      { space: newSpace },
      201,
    );
  } catch (error) {
    console.error("Error creating space:", error);
    return sendError(
      res,
      400,
      error.message || "Failed to create common space",
      error,
    );
  }
};

// --------------------------------------------------
// MANAGER: Update Space
// --------------------------------------------------
export const updateSpace = async (req, res) => {
  try {
    const spaceId = req.params.id;
    const communityId = await getManagerCommunityId(req);

    if (!spaceId) return sendError(res, 400, "Space ID is required");
    if (!communityId) {
      return sendError(res, 404, "Community not found for this manager");
    }

    const space = await Amenity.findById(spaceId);
    if (!space) return sendError(res, 404, "Space not found");
    if (space.community.toString() !== communityId.toString()) {
      return sendError(res, 403, "Unauthorized access to this space");
    }

    const {
      spaceType,
      spaceName,
      bookingRules,
      bookable,
      bookingRent,
      Type,
      availabilityControls,
    } = req.body;

    if (
      (spaceType !== undefined && !spaceType.trim()) ||
      (spaceName !== undefined && !spaceName.trim())
    ) {
      return sendError(res, 400, "Space type and name cannot be empty");
    }

    if (spaceName && spaceName.trim()) {
      const duplicateSpace = await Amenity.find({
        name: spaceName.trim(),
        community: communityId,
      });
      if (
        duplicateSpace.length > 0 &&
        duplicateSpace[0]._id.toString() !== spaceId
      ) {
        return sendError(res, 400, "A space with this name already exists");
      }
    }

    if (spaceName !== undefined) space.name = spaceName.trim();
    if (spaceType !== undefined) space.type = spaceType.trim();
    if (bookingRules !== undefined) {
      space.bookingRules = bookingRules ? bookingRules.trim() : "";
    }
    if (bookable !== undefined) {
      space.bookable = Boolean(bookable);
    }
    if (bookingRent !== undefined) {
      const parsedRent = Number(bookingRent);
      space.rent = Number.isFinite(parsedRent) ? parsedRent : space.rent;
    }
    if (Type !== undefined) space.Type = Type;
    if (availabilityControls !== undefined) {
      space.availabilityControls =
        sanitizeAvailabilityControls(availabilityControls);
    }
    space.updatedAt = new Date();
    await space.save();

    return sendSuccess(res, "Space updated successfully", { space });
  } catch (error) {
    console.error("Error updating space:", error);
    return sendError(
      res,
      400,
      error.message || "Failed to update common space",
      error,
    );
  }
};

// --------------------------------------------------
// MANAGER: Update Space Availability Controls
// --------------------------------------------------
export const updateSpaceAvailabilityControls = async (req, res) => {
  try {
    const spaceId = req.params.id;
    const communityId = await getManagerCommunityId(req);

    if (!spaceId) return sendError(res, 400, "Space ID is required");
    if (!communityId) {
      return sendError(res, 404, "Community not found for this manager");
    }

    const space = await Amenity.findById(spaceId);
    if (!space) return sendError(res, 404, "Space not found");
    if (space.community.toString() !== communityId.toString()) {
      return sendError(res, 403, "Unauthorized access to this space");
    }

    const controlsPayload =
      req.body?.availabilityControls !== undefined
        ? req.body.availabilityControls
        : req.body;

    const sanitizedControls = sanitizeAvailabilityControls(controlsPayload);
    space.availabilityControls = sanitizedControls;
    space.updatedAt = new Date();
    await space.save();

    return sendSuccess(res, "Availability controls updated successfully", {
      space,
      availabilityControls: sanitizedControls,
    });
  } catch (error) {
    console.error("Error updating space availability controls:", error);
    return sendError(
      res,
      400,
      error.message || "Failed to update availability controls",
      error,
    );
  }
};

// --------------------------------------------------
// MANAGER: Delete Space
// --------------------------------------------------
export const deleteSpace = async (req, res) => {
  try {
    const spaceId = req.params.id;
    const communityId = await getManagerCommunityId(req);

    if (!spaceId) return sendError(res, 400, "Space ID is required");
    if (!communityId) {
      return sendError(res, 404, "Community not found for this manager");
    }

    const space = await Amenity.findById(spaceId);
    if (!space) return sendError(res, 404, "Space not found");
    if (space.community.toString() !== communityId.toString()) {
      return sendError(res, 403, "Unauthorized access to this space");
    }

    await space.deleteOne();

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
    const communityId = await getManagerCommunityId(req);

    if (req.body.rules === undefined) {
      return sendError(res, 400, "Booking rules are required");
    }

    const community = await Community.findById(communityId);
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
    const communityId = await getManagerCommunityId(req);
    const community = await Community.findById(communityId);
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
