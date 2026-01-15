// controllers/residentController.js
import Resident from "../models/resident.js";
import Visitor from "../models/visitors.js";
import Ad from "../models/Ad.js";
import CommonSpaces from "../models/commonSpaces.js";
import Community from "../models/communities.js";
import Payment from "../models/payment.js";
import Issue from "../models/issues.js";
import QRCode from "qrcode";
import jwt from "jsonwebtoken";
import { getTimeAgo } from "../utils/residentHelpers.js";

// const getPreApprovals = async (req, res) => {

//   try {
//     const resident = await Resident.findById(req.user.id).populate(
//       "preApprovedVisitors"
//     );
//     const ads = await Ad.find({
//       community: req.user.community,
//       startDate: { $lte: new Date() },
//       endDate: { $gte: new Date() },
//     });

//     //// Fetch all visitors this resident pre-approved
//     const visitors = await Visitor.find({ approvedBy: resident._id }).lean();

//     const stats = await Visitor.aggregate([
//       { $match: { approvedBy: resident._id } },
//       { $group: { _id: "$status", count: { $sum: 1 } } },
//     ]);

//     const counts = { Pending: 0, Approved: 0, Rejected: 0 };
//     stats.forEach((s) => {
//       counts[s._id] = s.count;
//     });

//     console.log(resident.preApprovedVisitors);
//     console.log(counts.pending);

//     res.render("resident/preApproval", {
//       path: "pa",
//       visitors,
//       ads,
//       counts,
//     });
//   } catch (err) {
//     console.error("Error loading visitor history:", err);
//     res.render("users/resident/preapproval", { visitors: [] });
//   }
// };
const getPreApprovals = async (req, res) => {
  try {
    const resident = await Resident.findById(req.user.id).populate("preApprovedVisitors");

    if (!resident) {
      return res.status(404).json({ success: false, message: "Resident not found" });
    }

    const ads = await Ad.find({
      community: req.user.community,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    const visitors = await Visitor.find({ approvedBy: resident._id }).lean();

    const stats = await Visitor.aggregate([
      { $match: { approvedBy: resident._id } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);

    const counts = { Pending: 0, Approved: 0, Rejected: 0 };
    stats.forEach((s) => counts[s._id] = s.count);

    return res.json({
      success: true,
      visitors,
      ads,
      counts
    });

  } catch (err) {
    console.error("Error loading visitor history:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch visitor data",
      error: err.message
    });
  }
};


// const getCommonSpace = async (req, res) => {
//   try {
//     const bookings = await CommonSpaces.find({ bookedBy: req.user.id }).sort({
//       createdAt: -1,
//     });

//     const resi = await Resident.findById(req.user.id);

//     resi.notifications.forEach(async (n) => {
//       n.timeAgo = getTimeAgo(resi.notifications[0].createdAt);
//     });
//     await resi.save();

//     const ads = await Ad.find({
//       community: req.user.community,
//       startDate: { $lte: new Date() },
//       endDate: { $gte: new Date() },
//     });

//     const community = await Community.findById(req.user.community);
//     const availableSpaces = community ? community.commonSpaces : [];

//     // Count total bookings by user in their community
//     const pendingBookings = await CommonSpaces.countDocuments({
//       bookedBy: req.user.id,
//       community: req.user.community,
//       status: "Pending",
//     });

//     // Count only approved bookings
//     const allBookings = await CommonSpaces.countDocuments({
//       bookedBy: req.user.id,
//       community: req.user.community,
//     });

//     const ammenities = await Community.findById(req.user.community)
//       .select("ammenities")
//       .countDocuments();

//     res.render("resident/commonSpace", {
//       path: "cbs",
//       bookings: bookings,
//       ads,
//       resi,
//       availableSpaces: availableSpaces,
//       allBookings,
//       pendingBookings,
//       ammenities,
//     });
//   } catch (error) {
//     console.error("Error fetching common space data:", error);
//     req.flash("message", "Error loading common space data.");
//     res.redirect("/resident/dashboard");
//   }
// };
const getCommonSpace = async (req, res) => {
  try {
    const bookings = await CommonSpaces
      .find({ bookedBy: req.user.id })
      .sort({ createdAt: -1 });

    const ads = await Ad.find({
      community: req.user.community,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    const community = await Community.findById(req.user.community);
    const availableSpaces = community ? community.commonSpaces : [];

    const pendingBookings = await CommonSpaces.countDocuments({
      bookedBy: req.user.id,
      community: req.user.community,
      status: "Pending",
    });

    const allBookings = await CommonSpaces.countDocuments({
      bookedBy: req.user.id,
      community: req.user.community,
    });

    return res.json({
      success: true,
      bookings,
      ads,
      availableSpaces,
      stats: {
        pendingBookings,
        allBookings,
      }
    });

  } catch (error) {
    console.error("Error fetching common space data:", error);
    return res.status(500).json({
      success: false,
      message: "Error loading common space data",
      error: error.message,
    });
  }
};

// const getPaymentData = async (req, res) => {
//   try {
//     const userId = req.user.id;

//     const ads = await Ad.find({
//       community: req.user.community,
//       startDate: { $lte: new Date() },
//       endDate: { $gte: new Date() },
//     });

//     console.log(ads);

//     const payments = await Payment.find({ sender: userId }).populate(
//       "receiver",
//       "name"
//     );
//     console.log(payments);
//     // sort the payments  so that object with status overdue at first next with status pending and next with status completed , and in there are multiple objects with same status they should be in ascending order of paymentdeadline
//     payments.sort((a, b) => {
//       const statusOrder = { Overdue: 1, Pending: 2, Completed: 3 };
//       if (statusOrder[a.status] !== statusOrder[b.status]) {
//         return statusOrder[a.status] - statusOrder[b.status];
//       }

//       return new Date(a.paymentDeadline) - new Date(b.paymentDeadline);
//     });

//     payments.forEach((p) => {
//       if (
//         p.status === "Pending" &&
//         p.paymentDeadline &&
//         new Date(p.paymentDeadline) < new Date()
//       ) {
//         p.status = "Overdue";
//       }
//     });

//     const overduePayments = payments.filter((p) => p.status === "Overdue");
//     const pendingPayments = payments.filter((p) => p.status === "Pending");
//     const completedPayments = payments.filter((p) => p.status === "Completed");

//     const stats = {
//       overdueCount: overduePayments.length,
//       pendingCount: pendingPayments.length,
//       completedCount: completedPayments.length,
//       totalBills: payments.length,

//       // sums
//       overdueAmount: overduePayments.reduce((sum, p) => sum + p.amount, 0),
//       pendingAmount: pendingPayments.reduce((sum, p) => sum + p.amount, 0),
//       completedAmount: completedPayments.reduce((sum, p) => sum + p.amount, 0),
//       totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
//     };

//     res.render("resident/payments", { path: "p", payments, ads, stats });
//   } catch (error) {
//     console.error("Error fetching payments:", error);
//     req.flash("message", "Failed to load payment data");
//     res.redirect("/dashboard");
//   }
// };
const getPaymentData = async (req, res) => {
  try {
    const userId = req.user.id;

    const ads = await Ad.find({
      community: req.user.community,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    let payments = await Payment.find({ sender: userId }).populate("receiver", "name");

    payments.sort((a, b) => {
      const order = { Overdue: 1, Pending: 2, Completed: 3 };
      if (order[a.status] !== order[b.status]) {
        return order[a.status] - order[b.status];
      }
      return new Date(a.paymentDeadline) - new Date(b.paymentDeadline);
    });

    payments.forEach(p => {
      if (p.status === "Pending" && p.paymentDeadline < new Date()) {
        p.status = "Overdue";
      }
    });

    const overduePayments = payments.filter(p => p.status === "Overdue");
    const pendingPayments = payments.filter(p => p.status === "Pending");
    const completedPayments = payments.filter(p => p.status === "Completed");

    const stats = {
      overdueCount: overduePayments.length,
      pendingCount: pendingPayments.length,
      completedCount: completedPayments.length,
      totalBills: payments.length,
      overdueAmount: overduePayments.reduce((s, p) => s + p.amount, 0),
      pendingAmount: pendingPayments.reduce((s, p) => s + p.amount, 0),
      completedAmount: completedPayments.reduce((s, p) => s + p.amount, 0),
      totalAmount: payments.reduce((s, p) => s + p.amount, 0),
    };

    return res.json({
      success: true,
      payments,
      ads,
      stats
    });

  } catch (error) {
    console.error("Error fetching payments:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load payment data",
      error: error.message
    });
  }
};


// const getIssueData = async (req, res) => {
//   try {
//     const resident = await Resident.findOne({ email: req.user.email }).populate(
//       {
//         path: "raisedIssues",
//         populate: {
//           path: "workerAssigned",
//         },
//       }
//     );
//     const ads = await Ad.find({
//       community: req.user.community,
//       startDate: { $lte: new Date() },
//       endDate: { $gte: new Date() },
//     });
//     console.log(ads);

//     if (!resident) {
//       return res.status(404).json({ error: "Resident not found." });
//     }

//     const issues = await resident.raisedIssues;

//     const issueCounts = {
//       pending: 0,
//       inProgress: 0,
//       resolved: 0,
//     };

//     issues.forEach((issue) => {
//       const status = issue.status.toLowerCase();
//       if (status === "pending") issueCounts.pending += 1;
//       else if (status === "assigned") issueCounts.inProgress += 1;
//       else if (status === "payment pending" || status === "paid")
//         issueCounts.resolved += 1;
//     });

//     console.log(issueCounts.pending);

//     res.render("resident/issueRaising", {
//       path: "ir",
//       i: issues,
//       ads,
//       issueCounts,
//     });
//   } catch (error) {
//     console.error("Error fetching issues:", error);
//     return res.status(500).json({ error: "Internal server error." });
//   }
// };
const getIssueData = async (req, res) => {
  try {
    const resident = await Resident.findOne({ email: req.user.email })
      .populate({
        path: "raisedIssues",
        populate: { path: "workerAssigned" }
      });

    if (!resident) {
      return res.status(404).json({ success: false, message: "Resident not found" });
    }

    const ads = await Ad.find({
      community: req.user.community,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    const issues = resident.raisedIssues;

    const issueCounts = { pending: 0, inProgress: 0, resolved: 0 };

    issues.forEach((issue) => {
      const s = issue.status.toLowerCase();
      if (s === "pending") issueCounts.pending++;
      else if (s === "assigned") issueCounts.inProgress++;
      else if (s === "payment pending" || s === "paid") issueCounts.resolved++;
    });

    return res.json({
      success: true,
      issues,
      ads,
      issueCounts
    });

  } catch (error) {
    console.error("Error fetching issues:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message
    });
  }
};

// const getQRcode = async (req, res) =>{
//    try {
//     const visitor = await Visitor.findById(req.params.id);
//     if (!visitor) {
//       return res.status(404).json({ message: "Visitor not found" });
//     }
//     if (!visitor.qrCode) {
//       return res.status(400).json({ message: "QR code not generated yet" });
//     }

//     res.json({
//       qrCodeBase64: visitor.qrCode,
//       name: visitor.name,
//       purpose: visitor.purpose,
//       scheduledAt: visitor.scheduledAt,
//       status: visitor.status
//     });
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: "Server error" });
//   }
// }
const getQRcode = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);

    if (!visitor)
      return res.status(404).json({ success: false, message: "Visitor not found" });

    if (!visitor.qrCode)
      return res.status(400).json({ success: false, message: "QR not generated" });

    return res.json({
      success: true,
      qrCodeBase64: visitor.qrCode,
      name: visitor.name,
      purpose: visitor.purpose,
      scheduledAt: visitor.scheduledAt,
      status: visitor.status
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};


export { getPreApprovals, getCommonSpace, getIssueData, getPaymentData, getQRcode };
