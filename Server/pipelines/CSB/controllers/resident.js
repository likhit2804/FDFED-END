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

const DEFAULT_SLOT_START_TIME = "06:00";
const DEFAULT_SLOT_END_TIME = "22:00";
const DEFAULT_MAX_ADVANCE_DAYS = 90;

const normalizeDateOnly = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().split("T")[0];
};

const parseTimeToMinutes = (value) => {
  const match = /^([0-1]?\d|2[0-3]):([0-5]\d)$/.exec(String(value || ""));
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

const buildHourlySlots = (startTime, endTime) => {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  if (startMinutes === null || endMinutes === null || endMinutes <= startMinutes) {
    return [];
  }

  const slots = [];
  for (let minutes = startMinutes; minutes < endMinutes; minutes += 60) {
    const hour = String(Math.floor(minutes / 60)).padStart(2, "0");
    slots.push(`${hour}:00`);
  }
  return slots;
};

const getAvailabilityControls = (space) => {
  const controls = space?.availabilityControls || {};
  const slotConfig = controls.slotConfig || {};
  const bookingPolicy = controls.bookingPolicy || {};

  return {
    slotConfig: {
      startTime: slotConfig.startTime || DEFAULT_SLOT_START_TIME,
      endTime: slotConfig.endTime || DEFAULT_SLOT_END_TIME,
    },
    bookingPolicy: {
      minAdvanceHours: Number(bookingPolicy.minAdvanceHours || 0),
      maxAdvanceDays: Number(bookingPolicy.maxAdvanceDays || DEFAULT_MAX_ADVANCE_DAYS),
      sameDayCutoffTime: bookingPolicy.sameDayCutoffTime || DEFAULT_SLOT_END_TIME,
    },
    blackoutDates: Array.isArray(controls.blackoutDates) ? controls.blackoutDates : [],
    dateSlotOverrides: Array.isArray(controls.dateSlotOverrides)
      ? controls.dateSlotOverrides
      : [],
  };
};

const findDateConfigEntry = (entries, dateKey) =>
  entries.find((entry) => normalizeDateOnly(entry?.date) === dateKey);

const validateBookingAgainstAvailability = ({
  space,
  bookingDate,
  bookingType,
  timeSlots = [],
  from,
}) => {
  const dateKey = normalizeDateOnly(bookingDate);
  if (!dateKey) {
    return { valid: false, status: 400, message: "Invalid booking date." };
  }

  const now = new Date();
  const todayKey = normalizeDateOnly(now);
  const controls = getAvailabilityControls(space);
  const { slotConfig, bookingPolicy, blackoutDates, dateSlotOverrides } = controls;

  const blackout = findDateConfigEntry(blackoutDates, dateKey);
  if (blackout) {
    return {
      valid: false,
      status: 400,
      message: blackout.reason
        ? `This facility is closed on ${dateKey}: ${blackout.reason}`
        : `This facility is closed on ${dateKey}.`,
    };
  }

  if (Number.isFinite(bookingPolicy.maxAdvanceDays) && bookingPolicy.maxAdvanceDays > 0) {
    const maxAllowedDate = new Date(now);
    maxAllowedDate.setHours(0, 0, 0, 0);
    maxAllowedDate.setDate(maxAllowedDate.getDate() + bookingPolicy.maxAdvanceDays);
    const maxAllowedKey = normalizeDateOnly(maxAllowedDate);
    if (dateKey > maxAllowedKey) {
      return {
        valid: false,
        status: 400,
        message: `Bookings are open for only next ${bookingPolicy.maxAdvanceDays} days.`,
      };
    }
  }

  if (dateKey === todayKey) {
    const cutoffMinutes = parseTimeToMinutes(bookingPolicy.sameDayCutoffTime);
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    if (cutoffMinutes !== null && nowMinutes > cutoffMinutes) {
      return {
        valid: false,
        status: 400,
        message: `Same-day booking cutoff (${bookingPolicy.sameDayCutoffTime}) has passed.`,
      };
    }
  }

  const override = findDateConfigEntry(dateSlotOverrides, dateKey);

  if (bookingType === "Slot") {
    const slotRange = buildHourlySlots(slotConfig.startTime, slotConfig.endTime);
    if (!slotRange.length) {
      return {
        valid: false,
        status: 400,
        message: "Facility slot configuration is invalid. Contact manager.",
      };
    }

    if (override?.closedAllDay) {
      return {
        valid: false,
        status: 400,
        message: override.reason
          ? `Facility is closed for the selected date: ${override.reason}`
          : "Facility is closed for the selected date.",
      };
    }

    const slotSet = new Set(slotRange);
    const invalidSlots = timeSlots.filter((slot) => !slotSet.has(slot));
    if (invalidSlots.length > 0) {
      return {
        valid: false,
        status: 400,
        message: "Selected slot range is outside allowed booking hours.",
      };
    }

    const blockedSlots = new Set((override?.closedSlots || []).map((slot) => String(slot)));
    const blockedSelectedSlots = timeSlots.filter((slot) => blockedSlots.has(slot));
    if (blockedSelectedSlots.length > 0) {
      return {
        valid: false,
        status: 400,
        message: `Selected slots are unavailable on this date: ${blockedSelectedSlots.join(", ")}`,
      };
    }

    if (Number.isFinite(bookingPolicy.minAdvanceHours) && bookingPolicy.minAdvanceHours > 0) {
      const startTimeMinutes = parseTimeToMinutes(from || timeSlots[0]);
      if (startTimeMinutes === null) {
        return { valid: false, status: 400, message: "Invalid start time." };
      }

      const bookingStart = new Date(bookingDate);
      bookingStart.setHours(
        Math.floor(startTimeMinutes / 60),
        startTimeMinutes % 60,
        0,
        0,
      );
      const minAllowed = new Date(
        now.getTime() + bookingPolicy.minAdvanceHours * 60 * 60 * 1000,
      );
      if (bookingStart < minAllowed) {
        return {
          valid: false,
          status: 400,
          message: `This facility requires at least ${bookingPolicy.minAdvanceHours} hour(s) advance booking.`,
        };
      }
    }
  }

  return { valid: true, dateKey, controls, override };
};



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
    if (Type && Space.Type && Type !== Space.Type) {
      return sendError(res, 400, "Booking type mismatch for selected amenity");
    }
    const bookingType = Space.Type || Type;
    if (!bookingType) {
      return sendError(res, 400, "Booking type is required for this amenity");
    }

    const validation = validateBookingPayload({
      ...req.body.newBooking,
      Type: bookingType,
    });
    if (!validation.valid)
      return sendError(res, validation.status, validation.message);
    const bookingDate = validation.bookingDate;
    const bookingAmount = Number(amount) || 0;
    const requestedSlots = validation.timeSlots || [];

    const policyCheck = validateBookingAgainstAvailability({
      space: Space,
      bookingDate,
      bookingType,
      timeSlots: requestedSlots,
      from,
    });
    if (!policyCheck.valid) {
      return sendError(res, policyCheck.status, policyCheck.message);
    }

    if (bookingType === "Slot") {
      const bookingDateStr = policyCheck.dateKey;
      const bookedForDate = Space.bookedSlots?.find(
        (entry) => normalizeDateOnly(entry.date) === bookingDateStr,
      );
      const alreadyBooked = new Set(bookedForDate?.slots || []);
      const overlappingSlots = requestedSlots.filter((slot) =>
        alreadyBooked.has(slot),
      );
      if (overlappingSlots.length > 0) {
        return sendError(
          res,
          409,
          `Selected slots are already booked: ${overlappingSlots.join(", ")}`,
        );
      }
    }

    const b = await CommonSpaces.create({
      name: facility || Space.name,
      description: purpose || "No purpose specified",
      Date: new Date(dateString),
      from,
      to,
      Type: bookingType,
      amount: bookingAmount,
      status: bookingType === "Slot" ? "Booked" : "Active",
      paymentStatus: bookingAmount > 0 ? "Pending" : "Success",
      availability: null,
      bookedBy: uid,
      community: new mongoose.Types.ObjectId(req.user.community),
    });

    let uniqueId = generateCustomID(b._id.toString(), "CS", null);
    b.ID = uniqueId;
    await b.save();

    if (bookingType === "Slot") {
      const bookingDateStr = normalizeDateOnly(bookingDate);
      const requestTimeSlots = validation.timeSlots;

      const spaceDoc = await Amenity.findById(Space._id);
      let existingBookingIndex = spaceDoc.bookedSlots.findIndex(
        (b) => normalizeDateOnly(b.date) === bookingDateStr,
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
