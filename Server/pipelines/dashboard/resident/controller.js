import Issue from "../../../core/models/issues.js";
import Resident from "../../../core/models/resident.js";
import CommonSpaces from "../../../core/models/commonSpaces.js";
import Payment from "../../../core/models/payment.js";
import Visitor from "../../../core/models/visitors.js";
import Ad from "../../../core/models/Ad.js";
import {
  getTimeAgo,
  getPaymentRemainders,
  setPenalties,
} from "../../../core/utils/residentHelpers.js";

export const getResidentDashboardData = async (req, res) => {
  try {
    const recents = [];

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

    recents.sort((a, b) => new Date(b.date) - new Date(a.date));

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

    const overdues = pendingPayments.filter((p) => p.status === "Overdue");
    setPenalties(overdues);

    getPaymentRemainders(pendingPayments, resident.notifications);

    resident.notifications.forEach((n) => {
      n.timeAgo = getTimeAgo(n.createdAt);
    });

    resident.notifications.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const trimmedNotifications = resident.notifications.filter((n) => {
      return new Date(n.createdAt) >= oneDayAgo;
    });

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
};

export const getDashboardData = getResidentDashboardData;
