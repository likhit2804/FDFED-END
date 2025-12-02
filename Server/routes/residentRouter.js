import express from "express";
const residentRouter = express.Router();
import bcrypt from "bcrypt";
import mongoose from "mongoose";
// move them to controller when requried as they are serving only post of preapproval
import QRCode from "qrcode";
import jwt from "jsonwebtoken";

import Issue from "../models/issues.js";
import Resident from "../models/resident.js";
import CommonSpaces from "../models/commonSpaces.js";
import Payment from "../models/payment.js";
import Visitor from "../models/visitors.js";
import Community from "../models/communities.js";
import auth from "../controllers/auth.js";
import { authorizeR } from "../controllers/authorization.js";
import Ad from "../models/Ad.js";
import PaymentController from "../controllers/payments.js";
import { OTP } from "../controllers/OTP.js";
import {
  getPreApprovals,
  getCommonSpace,
  getIssueData,
  getPaymentData,
  getQRcode,
} from "../controllers/Resident.js";
import { getTimeAgo, getPaymentRemainders, setPenalties } from "../utils/residentHelpers.js";

import multer from "multer";
import cron from "node-cron";
import checkSubscriptionStatus from "../middleware/subcriptionStatus.js";
import Amenity from "../models/Amenities.js";

residentRouter.use(checkSubscriptionStatus);

function generateCustomID(userEmail, facility, countOrRandom = null) {
  console.log("userEmail:", userEmail);
  
  // Clean the userEmail (remove spaces)
  const code = userEmail.toUpperCase().trim();
  
  const facilityCode = facility.toUpperCase().slice(0, 2);
  
  const suffix = countOrRandom
    ? String(countOrRandom).padStart(4, "0")
    : String(Math.floor(1000 + Math.random() * 9000));

  return `${code}-${facilityCode}-${suffix}`;
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "=profImg.png";
    cb(null, uniqueName);
  },
});
const upload = multer({ storage: storage });

residentRouter.get("/payment/community", async (req, res) => {
  try {
    const user = await Community.findById(req.user.community);

    if (!user) {
      return res.status(404).json({ message: "community not found" });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching current user:", error);
    return res
      .status(500)
      .json({ message: "Error fetching user data", error: error.message });
  }
});

residentRouter.get("/ad", async (req, res) => {
  const ads = await Ad.find({
    community: req.user?.community,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
  });

  res.render("resident/Advertisement", { path: "ad", ads });
});

residentRouter.get("/commonSpace", async (req, res) => {
  try {
    const bookings = await CommonSpaces.find({
      bookedBy: req.user.id, // Fixed: use req.user.id instead of hardcoded
    })
      .populate("payment")
      .sort({ createdAt: -1 });
    const spaces = await Amenity.find({
      community: req.user.community, // Fixed: use req.user.community instead of hardcoded
    });

    return res.json({
      success: true,
      bookings: bookings,
      spaces: spaces,
    });
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

residentRouter.post("/commonSpace/:id", async (req, res) => {
  try {
    const bookingId = req.params.id;

    const commonspace = await CommonSpaces.findById(bookingId).populate(
      "payment"
    );
    if (!commonspace) {
      return res.status(404).json({ error: "Booking not found" });
    }

    if (commonspace.bookedBy.toString() !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized access" });
    }

    console.log("Commonspace Data:", commonspace);
    res.status(200).json({ commonspace: commonspace });
  } catch (error) {
    console.error("Error fetching booking details:", error);
    res.status(500).json({ error: "Server error" });
  }
});

residentRouter.post("/commonSpace", async (req, res) => {
  try {
    const uid = req.user.id; // Fixed: use req.user.id instead of hardcoded
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

    // Use the new variable name here
    const bookingDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      return res.json({
        success: false,
        message: "Cannot book for past dates.",
      });
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if ((!timeRegex.test(from) || !timeRegex.test(to)) && Type === 'Slot' ) {
      console.log("invalid time format");

      return res.json({ success: false, message: "Invalid time format." });
    }

    const [fromHour, fromMin] = from.split(":").map(Number);
    const [toHour, toMin] = to.split(":").map(Number);
    const fromMinutes = fromHour * 60 + fromMin;
    const toMinutes = toHour * 60 + toMin;

    if (toMinutes && fromMinutes && toMinutes <= fromMinutes) {
      return res.json({
        success: false,
        message: "End time must be after start time.",
      });
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
      community: new mongoose.Types.ObjectId(req.user.community), // Fixed: use req.user.community
    });

    let uniqueId = generateCustomID(b._id.toString(), "CS", null);
    b.ID = uniqueId;
    await b.save();

    if (Type === "Slot") {
      const bookingDateStr = new Date(dateString).toISOString().split("T")[0];
      const requestTimeSlots = req.body.newBooking.timeSlots;

      if (requestTimeSlots.length === 0) {
        return res.json({
          success: false,
          message: "Selected time range is invalid.",
        });
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
        // Use the new variable name here
        Space.bookedSlots.push({
          date: new Date(dateString),
          slots: requestTimeSlots,
        });
      }

      await Space.save();
    }

    uniqueId = generateCustomID(b._id.toString(), "PY", null);

    const payment = await Payment.create({
      title: b._id,
      sender: b.bookedBy._id,
      receiver: new mongoose.Types.ObjectId(req.user.community), // Fixed: use req.user.community
      amount: amount,
      paymentDate: new Date(),
      paymentMethod: paymentMethod,
      status: "Completed",
      remarks: null,
      ID: uniqueId,
      belongTo: "CommonSpaces",
      community: new mongoose.Types.ObjectId(req.user.community), // Fixed: use req.user.community
      belongToId: b._id,
    });

    b.paymentstatus = "Paid";
    b.payment = payment._id;
    await b.save();

    const user = await Resident.findById(uid);
    if (user) {
      user.bookedCommonSpaces.push(b._id);
      await user.save();
    }

    await b.populate("payment");

    return res.json({
      success: true,
      message: "Booking request submitted successfully!",
      space: b,
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
});

residentRouter.put("/booking/cancel/:id", async (req, res) => {
  try {
    const bookingId = req.params.id;
    const residentId = req.user.id; // Fixed: use req.user.id instead of hardcoded

    const booking = await CommonSpaces.findOne({
      _id: bookingId,
      bookedBy: residentId,
    });

    if (!booking) {
      return res.status(404).json({ error: "Booking not found or unauthorized cancellation." });
    }

    const bookingDate = new Date(booking.Date);
    const now = new Date();

    if (bookingDate < now) {
      return res.status(400).json({ error: "Cannot cancel past or ongoing bookings." });
    }

    const diffHours = Math.abs((bookingDate - now) / (1000 * 60 * 60));
    const amount = Number(booking?.amount || 0);
    console.log("booking : ",booking);
    

    if (isNaN(amount)) {
      return res.status(400).json({ error: "Invalid booking amount." });
    }

    console.log(diffHours);
    


    let refundAmount = booking?.amount;
    if (diffHours >= 48){ 
     refundAmount = amount;console.log("greater than 48",refundAmount);}
    else if (diffHours >= 24) {refundAmount = amount * 0.75;console.log("greater than 24",refundAmount);}
    else if (diffHours >= 4) {refundAmount = amount * 0.25;console.log("greater than 4",refundAmount);}
    else {console.log("greater than 0");refundAmount = 0;}

    const refundId = generateCustomID(String(booking._id), "RF", null);
    console.log("After block : ",refundAmount);
    

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
});

residentRouter.get("/api/facilities", async (req, res) => {
  try {
    const community = await Community.findById(req.user.community).select("commonSpaces"); // Fixed: use req.user.community
    const facilities = community.commonSpaces || [];

    console.log("Raw facilities from database:", facilities);

    res.json({
      success: true,
      facilities: facilities,
    });
  } catch (error) {
    console.error("Error fetching facilities:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch facilities data",
    });
  }
});

residentRouter.get("/api/bookings", async (req, res) => {
  try {
    const bookings = await CommonSpaces.find({ bookedBy: req.user.id });
    return res.json({ success: true, bookings });
  } catch (err) {
    console.log(err);
  }
});

const formatDate = (rawDate) => {
  return new Date(rawDate).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
};

residentRouter.get("/api/dashboard", async (req, res) => {
  try {
    const recents = [];

    // Fetch base data
    const ads = await Ad.find({
      community: req.user.community,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    const issues = await Issue.find({ resident: req.user.id });
    const commonSpaces = await CommonSpaces.find({ bookedBy: req.user.id });
    const payments = await Payment.find({ sender: req.user.id });
    const preApp = await Visitor.find({ approvedBy: req.user.id });

    const resident = await Resident.findById(req.user.id);

    // Build recents list
    recents.push(
      ...issues.map(issue => ({
        type: "Issue",
        title: issue.issueID,
        date: issue.createdAt
      })),
      ...preApp.map(i => ({
        type: "PreApproval",
        title: i._id,
        date: i.createdAt
      })),
      ...commonSpaces.map(space => ({
        type: "CommonSpace",
        title: space.name,
        date: space.createdAt
      })),
      ...payments.map(payment => ({
        type: "Payment",
        title: payment.title,
        date: payment.paymentDate
      }))
    );

    // Sort by newest
    recents.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Handle pending/overdue payments
    const pendingPayments = await Payment.find({
      sender: req.user.id,
      status: { $in: ["Pending", "Overdue"] }
    });

    for (const p of pendingPayments) {
      if (new Date(p.paymentDeadline) < new Date()) {
        p.status = "Overdue";
        await p.save();
      }
    }

    // Penalties
    const overdues = pendingPayments.filter(p => p.status === "Overdue");
    setPenalties(overdues);

    // Apply payment reminders
    getPaymentRemainders(pendingPayments, resident.notifications);

    // Add timeAgo to notifications
    resident.notifications.forEach(n => {
      n.timeAgo = getTimeAgo(n.createdAt);
    });

    // Sort newest first
    resident.notifications.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Keep only last 24 hours notifications
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const trimmedNotifications = resident.notifications.filter(n => {
      return new Date(n.createdAt) >= oneDayAgo;
    });

    // Save final trimmed notifications
    resident.notifications = trimmedNotifications;
    await resident.save();

    return res.json({
      success: true,
      ads,
      recents,
      notifications: trimmedNotifications,
      pendingPayments
    });

  } catch (err) {
    console.error("Dashboard JSON API Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

residentRouter.get("/", (req, res) => {
  res.redirect("dashboard");
});

import { confirmIssue, rejectIssueResolution, raiseIssue, deleteIssue, getResidentIssues, getIssueDataById, submitFeedback} from "../controllers/issueController.js";

residentRouter.post("/issue/confirmIssue/:id", confirmIssue);
residentRouter.post("/issue/rejectIssueResolution/:id", rejectIssueResolution);
residentRouter.post("/issue/raise", raiseIssue);
residentRouter.delete("/issue/delete/:issueID", deleteIssue);
residentRouter.get("/issue/data", getResidentIssues);
residentRouter.get("/issue/data/:id", getIssueDataById);
residentRouter.post("/issue/submitFeedback", submitFeedback);

// Payment routes - corrected version
residentRouter.get("/payments", getPaymentData);

residentRouter.get("/payment/receipt/:id", async (req, res) => {
  const Id = req.params.id;
  console.log("Payment ID:", Id);

  const payment = await Payment.findById(Id)
    .populate("receiver")
    .populate("sender");

  console.log("Payment Details:", payment);

  res.render("resident/receipt", { path: "p", payment });
});

residentRouter.get("/payment/:paymentId", async (req, res) => {
  try {
    const userId = req.user.id;
    const paymentId = req.params.paymentId;

    const payment = await Payment.findOne({
      _id: paymentId,
      sender: userId,
    })
      .populate("receiver")
      .populate("sender");

    if (!payment) {
      return res.status(404).json({ error: "Payment receipt not found" });
    }
    res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("Error fetching receipt:", error);
    res.status(500).json({ error: "Failed to fetch receipt" });
  }
});

residentRouter.get("/preApprovals", auth, authorizeR, getPreApprovals);

residentRouter.post("/preapproval", auth, authorizeR, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { visitorName, contactNumber, dateOfVisit, timeOfVisit, purpose } =
      req.body;

    if (
      !visitorName ||
      !contactNumber ||
      !dateOfVisit ||
      !timeOfVisit ||
      !purpose
    ) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const resident = await Resident.findById(req.user.id).populate("community");
    if (!resident)
      return res.status(404).json({ message: "Resident not found" });

    const date = formatDate(dateOfVisit);
    const scheduledAt = new Date(`${dateOfVisit}T${timeOfVisit}`);
    const tempId = new mongoose.Types.ObjectId();
    const uniqueId = generateCustomID(tempId.toString(), "PA", null);

    // Create Visitor instance (unsaved)
    const newVisitor = new Visitor({
      _id: tempId,
      ID: uniqueId,
      name: visitorName,
      contactNumber,
      purpose,
      scheduledAt,
      approvedBy: resident._id,
      community: resident.community._id,
      otp: OTP(), // if needed
    });

    // Generate JWT and QR
    const payload = {
      visitorId: newVisitor._id.toString(),
      name: visitorName,
      contactNumber,
      purpose,
      scheduledAt,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: "24h",
    });
    newVisitor.qrToken = token;
    newVisitor.qrCode = await QRCode.toDataURL(token);

    // Save visitor and update resident in a transaction
    await newVisitor.save({ session });
    resident.preApprovedVisitors.push(newVisitor._id);
    await resident.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({
      success: true,
      preapproval: {
        _id: newVisitor._id,
        ID: uniqueId,
        visitorName,
        contactNumber,
        dateOfVisit: date,
        timeOfVisit,
        purpose,
        status: "approved",
        qrToken: newVisitor.qrToken,
        qrCode: newVisitor.qrCode,
      },
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error("Error in pre-approving visitor:", err);
    return res
      .status(500)
      .json({ message: "Internal server error", error: err.message });
  }
});

residentRouter.delete("/preapproval/cancel/:id", async (req, res) => {
  const requestId = req.params.id;
  console.log("Canceling request with ID:", requestId);

  try {
    const result = await Visitor.findByIdAndDelete(requestId);
    if (!result) {
      console.log("Request not found for ID:", requestId);
      return res.status(404).json({ error: "Request not found" });
    }

    res
      .status(200)
      .json({ message: "Request canceled successfully", ok: true });
  } catch (error) {
    console.error("Error canceling request:", error);
    return res.status(500).json({ error: "Failed to cancel request" });
  }
});

residentRouter.get("/preapproval/qr/:id", auth, authorizeR, getQRcode);

residentRouter.get("/profile", async (req, res) => {
  const ads = await Ad.find({
    community: req.user.community,
    startDate: { $lte: new Date() },
    endDate: { $gte: new Date() },
  });

  const r = await Resident.findById(req.user.id);

  res.render("resident/Profile", { path: "pr", ads, r });
});

residentRouter.post("/profile", upload.single("image"), async (req, res) => {
  const { firstName, lastName, contact, email, address } = req.body;

  console.log("Profile update data:", req.body);

  const r = await Resident.findById(req.user.id);

  const image = req.file?.path;

  r.residentFirstname = firstName;
  r.residentLastname = lastName;
  r.email = email;
  r.contact = contact;
  const blockNo = address.split(" ")[1] + " " + address.split(" ")[2];
  const flatNo = address.split(" ")[3];

  if (image) {
    r.image = image;
  }

  r.blockNo = blockNo;
  r.flatNo = flatNo;

  await r.save();

  return res.json({
    success: true,
    message: "Profile updated successfully",
    r,
  });
});

residentRouter.post("/change-password", async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const resident = await Resident.findById(req.user.id);

  if (!resident) {
    return res.json({ success: false, message: "Resident not found." });
  }

  const isMatch = await bcrypt.compare(currentPassword, resident.password);
  if (!isMatch) {
    return res.json({
      success: false,
      message: "Current password does not match.",
    });
  }

  const salt = await bcrypt.genSalt(10);
  resident.password = await bcrypt.hash(newPassword, salt);
  await resident.save();

  res.json({ ok: true, message: "Password changed successfully." });
});

residentRouter.get("/clearNotification", async (req, res) => {
  const resi = await Resident.updateOne(
    { _id: req.user.id },
    { $set: { notifications: [] } }
  );

  console.log(resi.notifications);

  res.json({ ok: true });
});

export default residentRouter;
