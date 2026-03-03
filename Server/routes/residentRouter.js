import express from "express";
import checkSubscriptionStatus from "../middleware/subcriptionStatus.js";
import Resident from "../models/resident.js";
import Issue from "../models/issues.js";
import CommonSpaces from "../models/commonSpaces.js";
import Payment from "../models/payment.js";
import Visitor from "../models/visitors.js";
import Ad from "../models/Ad.js";
import { getTimeAgo, getPaymentRemainders, setPenalties } from "../utils/residentHelpers.js";

const residentRouter = express.Router();


residentRouter.use(checkSubscriptionStatus);

// --------------------------------------------------
// Pipelines
// --------------------------------------------------
import registrationResidentRouter from "../pipelines/residentRegistration/router/resident.js";
residentRouter.use("/", registrationResidentRouter);

import adsResidentRouter from "../pipelines/ads/router/resident.js";
residentRouter.use("/", adsResidentRouter);

import csbResidentRouter from "../pipelines/CSB/router/resident.js";
residentRouter.use("/", csbResidentRouter);

import issueResidentRouter from "../pipelines/issue/router/resident.js";
residentRouter.use("/", issueResidentRouter);

import preapprovalResidentRouter from "../pipelines/Preapproval/router/manager.js";
residentRouter.use("/", preapprovalResidentRouter);

import profileResidentRouter from "../pipelines/profile/router/resident.js";
residentRouter.use("/", profileResidentRouter);

import paymentResidentRouter from "../pipelines/payment/router/resident.js";
residentRouter.use("/", paymentResidentRouter);

import notificationResidentRouter from "../pipelines/notifications/router/resident.js";
residentRouter.use("/", notificationResidentRouter);


// --------------------------------------------------
// Dashboard
// --------------------------------------------------
residentRouter.get("/api/dashboard", async (req, res) => {
  try {
    const recents = [];
    const ads = await Ad.find({ community: req.user.community, startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });
    const issues = await Issue.find({ resident: req.user.id });
    const commonSpaces = await CommonSpaces.find({ bookedBy: req.user.id });
    const payments = await Payment.find({ sender: req.user.id });
    const preApp = await Visitor.find({ approvedBy: req.user.id });
    const resident = await Resident.findById(req.user.id);

    recents.push(
      ...issues.map((i) => ({ type: "Issue", title: i.issueID, date: i.createdAt })),
      ...preApp.map((i) => ({ type: "PreApproval", title: i._id, date: i.createdAt })),
      ...commonSpaces.map((s) => ({ type: "CommonSpace", title: s.name, date: s.createdAt })),
      ...payments.map((p) => ({ type: "Payment", title: p.title, date: p.paymentDate }))
    );
    recents.sort((a, b) => new Date(b.date) - new Date(a.date));

    const pendingPayments = await Payment.find({ sender: req.user.id, status: { $in: ["Pending", "Overdue"] } });
    for (const p of pendingPayments) {
      if (new Date(p.paymentDeadline) < new Date()) { p.status = "Overdue"; await p.save(); }
    }
    setPenalties(pendingPayments.filter((p) => p.status === "Overdue"));
    getPaymentRemainders(pendingPayments, resident.notifications);

    resident.notifications.forEach((n) => { n.timeAgo = getTimeAgo(n.createdAt); });
    resident.notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const trimmedNotifications = resident.notifications.filter((n) => new Date(n.createdAt) >= oneDayAgo);
    resident.notifications = trimmedNotifications;
    await resident.save();

    return res.json({ success: true, ads, recents, notifications: trimmedNotifications, pendingPayments });
  } catch (err) {
    console.error("Dashboard error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

residentRouter.get("/", (req, res) => res.redirect("dashboard"));

export default residentRouter;

