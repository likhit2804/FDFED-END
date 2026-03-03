import express from "express";
const residentRouter = express.Router();
import bcrypt from "bcrypt";
import mongoose from "mongoose";
// move them to controller when requried as they are serving only post of preapproval
import QRCode from "qrcode";
import jwt from "jsonwebtoken";

import Issue from "../models/issues.js";
import Notifications from "../models/Notifications.js";
import Resident from "../models/resident.js";
import CommonSpaces from "../models/commonSpaces.js";
import Payment from "../models/payment.js";
import Visitor from "../models/visitors.js";
import Community from "../models/communities.js";
import { getIO } from "../utils/socket.js";
import Ad from "../models/Ad.js";
import PaymentController from "../controllers/shared/payments.js";
// import { OTP } from "../controllers/shared/OTP.js";
// import { verify } from "../controllers/shared/OTP.js";
import {
  getCommonSpace,
  getIssueData,
  getPaymentData,
} from "../controllers/Resident/legacy.controller.js";

import * as ResidentController from "../controllers/Resident/index.js";
// The imports are Profile : updateProfile, changePassword, getResidentProfile
// Preapproval : createPreApproval, cancelPreApproval, getPreApprovals, getQRcode
// Registration : requestOtp,verifyOtp,completeRegistration


import {
  getTimeAgo,
  getPaymentRemainders,
  setPenalties,
} from "../utils/residentHelpers.js";

import multer from "multer";
import cloudinary from "../configs/cloudinary.js";
import cron from "node-cron";
import checkSubscriptionStatus from "../middleware/subcriptionStatus.js";
import Amenity from "../models/Amenities.js";

residentRouter.use(checkSubscriptionStatus);
// Resident Self-Registration (OTP + Community Code)
// residentRouter.post("/register/request-otp", async (req, res) => {
//   try {
//     const { email } = req.body;
//     if (!email)
//       return res
//         .status(400)
//         .json({ success: false, message: "Email is required" });

//     const existing = await Resident.findOne({ email });
//     if (existing && existing.password) {
//       return res
//         .status(409)
//         .json({ success: false, message: "Account already exists" });
//     }

//     await OTP(email);
//     return res.json({ success: true, message: "OTP sent to email" });
//   } catch (err) {
//     console.error("OTP request error:", err);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// residentRouter.post("/register/verify-otp", async (req, res) => {
//   try {
//     const { email, otp } = req.body;
//     if (!email || !otp)
//       return res
//         .status(400)
//         .json({ success: false, message: "Email and OTP required" });

//     const isValid = verify(email, otp);
//     if (!isValid)
//       return res.status(401).json({ success: false, message: "Invalid OTP" });

//     return res.json({ success: true, message: "OTP verified" });
//   } catch (err) {
//     console.error("Verify OTP error:", err);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// });

// residentRouter.post("/register/complete", async (req, res) => {
//   try {
//     const {
//       residentFirstname,
//       residentLastname,
//       uCode,
//       contact,
//       email,
//       communityCode,
//     } = req.body;
//     if (
//       !residentFirstname ||
//       !residentLastname ||
//       !uCode ||
//       !email ||
//       !communityCode
//     ) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Missing required fields" });
//     }

//     const community = await Community.findOne({ communityCode });
//     if (!community) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Invalid community code" });
//     }

//     const rotated = await community.rotateCodeIfExpired();
//     if (rotated) {
//       return res.status(400).json({
//         success: false,
//         message:
//           "Community code expired. Please request a new code from the manager.",
//       });
//     }


//     let resident = await Resident.findOne({ email });
//     if (!resident) {
//       resident = new Resident({
//         residentFirstname,
//         residentLastname,
//         uCode,
//         contact,
//         email,
//         community: community._id,
//       });
//     } 

//     await resident.save();
//     return res.json({
//       success: true,
//       message: "Resident registered",
//       residentId: resident._id,
//     });
//   } catch (err) {
//     console.error("Complete registration error:", err);
//     return res.status(500).json({ success: false, message: "Server error" });
//   }
// });
residentRouter.post("/register/request-otp", ResidentController.requestOtp);
residentRouter.post("/register/verify-otp", ResidentController.verifyOtp);
residentRouter.post("/register/complete", ResidentController.completeRegistration);


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

// Multer memory storage for resident profile images (Cloudinary in handler)
const upload = multer({ storage: multer.memoryStorage() });

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
  try {
    const ads = await Ad.find({
      community: req.user?.community,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    return res.json({
      success: true,
      ads,
    });
  } catch (err) {
    console.error("Ads fetch error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch ads",
    });
  }
});

import csbResidentRouter from "../pipelines/CSB/router/resident.js";
residentRouter.use("/", csbResidentRouter);




residentRouter.get("/api/dashboard", async (req, res) => {
  try {
    const recents = [];

    // Fetch base data
    const ads = await Ad.find({
      community: req.user.community,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    const issues = await Issue.find({ resident: req.user.id });
    const commonSpaces = await CommonSpaces.find({ bookedBy: req.user.id });
    const payments = await Payment.find({ sender: req.user.id });
    const preApp = await Visitor.find({ approvedBy: req.user.id });

    const resident = await Resident.findById(req.user.id);

    // Build recents list
    recents.push(
      ...issues.map((issue) => ({
        type: "Issue",
        title: issue.issueID,
        date: issue.createdAt,
      })),
      ...preApp.map((i) => ({
        type: "PreApproval",
        title: i._id,
        date: i.createdAt,
      })),
      ...commonSpaces.map((space) => ({
        type: "CommonSpace",
        title: space.name,
        date: space.createdAt,
      })),
      ...payments.map((payment) => ({
        type: "Payment",
        title: payment.title,
        date: payment.paymentDate,
      }))
    );

    // Sort by newest
    recents.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Handle pending/overdue payments
    const pendingPayments = await Payment.find({
      sender: req.user.id,
      status: { $in: ["Pending", "Overdue"] },
    });

    for (const p of pendingPayments) {
      if (new Date(p.paymentDeadline) < new Date()) {
        p.status = "Overdue";
        await p.save();
      }
    }

    // Penalties
    const overdues = pendingPayments.filter((p) => p.status === "Overdue");
    setPenalties(overdues);

    // Apply payment reminders
    getPaymentRemainders(pendingPayments, resident.notifications);

    // Add timeAgo to notifications
    resident.notifications.forEach((n) => {
      n.timeAgo = getTimeAgo(n.createdAt);
    });

    // Sort newest first
    resident.notifications.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Keep only last 24 hours notifications
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const trimmedNotifications = resident.notifications.filter((n) => {
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
      pendingPayments,
    });
  } catch (err) {
    console.error("Dashboard JSON API Error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

residentRouter.get("/", (req, res) => {
  res.redirect("dashboard");
});
/*---------------------------------------------------------------------------------------------------- */
import issueResidentRouter from "../pipelines/issue/router/resident.js";
residentRouter.use("/", issueResidentRouter);
/*---------------------------------------------------------------------------------------------------- */
// Payment routes - corrected version
residentRouter.get("/payments", getPaymentData);
residentRouter.patch("/payment/:id", PaymentController.updateResidentPayment);

residentRouter.get("/payment/receipt/:id", async (req, res) => {
  const Id = req.params.id;

  try {
    const payment = await Payment.findById(Id)
      .populate("receiver")
      .populate("sender");

    if (!payment) {
      return res
        .status(404)
        .json({ success: false, message: "Payment not found" });
    }

    return res.json({ success: true, payment });
  } catch (err) {
    console.error("Payment receipt fetch error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch payment receipt",
    });
  }
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

//Preapproval routes
import preapprovalResidentRouter from "../pipelines/Preapproval/router/manager.js";
residentRouter.use("/", preapprovalResidentRouter);


// Profile Routes
residentRouter.get("/profile", ResidentController.getResidentProfile);
residentRouter.post("/profile", upload.single("image"), ResidentController.updateProfile);
residentRouter.post("/change-password", ResidentController.changePassword);

residentRouter.get("/clearNotification", async (req, res) => {
  const resi = await Resident.updateOne(
    { _id: req.user.id },
    { $set: { notifications: [] } }
  );

  console.log(resi.notifications);

  res.json({ ok: true });
});

export default residentRouter;
