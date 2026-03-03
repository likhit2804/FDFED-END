import Leave from "../../../models/leave.js";
import CommunityManager from "../../../models/cManager.js";
import Notifications from "../../../models/Notifications.js";
import { getIO } from "../../../utils/socket.js";
import emailService from "../../../utils/emailService.js";

// --------------------------------------------------
// Shared helper
// --------------------------------------------------
const pushNotification = async (userModel, userId, notificationData) => {
  if (!userId) return null;
  const notification = new Notifications(notificationData);
  await notification.save();
  const user = await userModel.findById(userId);
  if (user) {
    user.notifications = user.notifications || [];
    user.notifications.push(notification._id);
    await user.save();
  }
  return notification;
};

// --------------------------------------------------
// WORKER: Apply for leave
// --------------------------------------------------
export const applyLeave = async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({
          success: false,
          message: "startDate and endDate are required",
        });
    }

    const leave = new Leave({
      worker: req.user.id,
      community: req.user.community,
      type: type || "other",
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      reason: reason || "",
      status: "pending",
    });

    await leave.save();

    const io = getIO();

    await pushNotification(CommunityManager, req.user.community, {
      type: "Leave",
      title: "New Leave Application",
      message: `Worker applied for leave from ${startDate} to ${endDate}`,
      referenceId: leave._id,
      referenceType: "Leave",
    }).catch(() => null);

    try {
      const managers = await CommunityManager.find({
        assignedCommunity: req.user.community,
      });
      for (const m of managers) {
        if (m?.email) {
          await emailService
            .sendNotificationEmail(
              m.email,
              "New Leave Application",
              `Worker has applied for leave from ${startDate} to ${endDate}. Reason: ${reason || "N/A"}`,
            )
            .catch(() => null);
        }
      }
    } catch (e) {
      console.warn("Failed to email managers", e.message);
    }

    if (io && req.user.community) {
      io.to(`community_${req.user.community}`).emit("leave:applied", {
        leaveId: leave._id,
        worker: req.user.id,
      });
    }

    return res.json({ success: true, leave });
  } catch (err) {
    console.error("applyLeave error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// --------------------------------------------------
// WORKER: List own leaves
// --------------------------------------------------
export const listLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ worker: req.user.id }).sort({
      createdAt: -1,
    });
    return res.json({ success: true, leaves });
  } catch (err) {
    console.error("listLeaves error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

// --------------------------------------------------
// WORKER: Get a single leave by ID
// --------------------------------------------------
export const getLeaveById = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id).populate("worker");
    if (!leave)
      return res
        .status(404)
        .json({ success: false, message: "Leave not found" });

    if (leave.worker._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    return res.json({ success: true, leave });
  } catch (err) {
    console.error("getLeaveById error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
