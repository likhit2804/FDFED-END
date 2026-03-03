import Security from "../models/security.js";
import visitor from "../models/visitors.js";
import Ad from "../models/Ad.js";
import Community from "../models/communities.js";
import Visitor from "../models/visitors.js";
import mongoose from "mongoose";

// const getDashboardInfo = async (req, res) => {
//   try {
//     const today = new Date();
//     const startOfDay = new Date(today.setHours(0, 0, 0, 0));
//     const endOfDay = new Date(today.setHours(23, 59, 59, 999));

//     const [visitors, sec, ads, PendingRequests, VisitorToday, ActiveVisitors] =
//       await Promise.all([
//         visitor
//           .find({
//             community: req.user.community,
//             status: { $in: ["Active", "CheckedOut"] },
//           })
//           .sort({ createdAt: -1 }),

//         Security.findById(req.user.id),

//         Ad.find({
//           community: req.user.community,
//           startDate: { $lte: new Date() },
//           endDate: { $gte: new Date() },
//         }),

//         visitor.countDocuments({
//           community: req.user.community,
//           status: "Pending",
//         }),

//         visitor.countDocuments({
//           community: req.user.community,
//           status: "Approved",
//           scheduledAt: { $gte: startOfDay, $lte: endOfDay },
//         }),

//         visitor.countDocuments({
//           community: req.user.community,
//           status: "Approved",
//           isCheckedIn: true,
//           scheduledAt: { $gte: startOfDay, $lte: endOfDay },
//         }),
//       ]);

//     const stats = {
//       Pending: PendingRequests,
//       Visitor: VisitorToday,
//       Active: ActiveVisitors,
//     };

//     return res.json({
//       success: true,
//       stats,
//       visitors,
//       ads,
//       security: sec,
//     });
//   } catch (error) {
//     console.error("Error fetching dashboard info:", error);
//     res.status(500).send("Server error");
//   }
// };
const getDashboardInfo = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const [
      visitors,
      sec,
      ads,
      PendingRequests,
      VisitorToday,
      ActiveVisitors,
    ] = await Promise.all([
      visitor.find({
        community: req.user.community,
        status: { $in: ["Active", "CheckedOut"] },
      }).sort({ createdAt: -1 }),

      Security.findById(req.user.id),

      Ad.find({
        community: req.user.community,
        startDate: { $lte: new Date() },
        endDate: { $gte: new Date() },
      }),

      visitor.countDocuments({
        community: req.user.community,
        status: "Pending",
      }),

      visitor.countDocuments({
        community: req.user.community,
        status: "Approved",
        scheduledAt: { $gte: startOfDay, $lte: endOfDay },
      }),

      visitor.countDocuments({
        community: req.user.community,
        status: "Approved",
        isCheckedIn: true,
        scheduledAt: { $gte: startOfDay, $lte: endOfDay },
      }),
    ]);

    const stats = {
      Pending: PendingRequests,
      Visitor: VisitorToday,
      Active: ActiveVisitors,
    };

    return res.json({
      success: true,
      stats,
      visitors,
      ads,
      security: sec,
    });

  } catch (error) {
    console.error("Error fetching dashboard info:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export { getDashboardInfo };

