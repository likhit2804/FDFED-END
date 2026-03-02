import Leave from "../models/leave.js";
import Worker from "../models/workers.js";
import CommunityManager from "../models/cManager.js";
import Notifications from "../models/Notifications.js";
import { getIO } from "../utils/socket.js";
import emailService from "../utils/emailService.js";

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

export const applyLeave = async (req, res) => {
  try {
    const { type, startDate, endDate, reason } = req.body;

    if (!startDate || !endDate) {
      return res.status(400).json({ success: false, message: "startDate and endDate are required" });
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

    // Notify manager(s) in community via Notifications + socket
    const io = getIO();

    await pushNotification(CommunityManager, req.user.community, {
      type: "Leave",
      title: "New Leave Application",
      message: `Worker applied for leave from ${startDate} to ${endDate}`,
      referenceId: leave._id,
      referenceType: "Leave",
    }).catch(() => null);

    // Send email to manager(s) of the community
    try {
      const managers = await CommunityManager.find({ assignedCommunity: req.user.community });
      for (const m of managers) {
        if (m?.email) {
          await emailService.sendNotificationEmail(
            m.email,
            'New Leave Application',
            `Worker has applied for leave from ${startDate} to ${endDate}. Reason: ${reason || 'N/A'}`
          ).catch(() => null);
        }
      }
    } catch (e) {
      console.warn('Failed to email managers', e.message);
    }

    if (io && req.user.community) {
      io.to(`community_${req.user.community}`).emit("leave:applied", { leaveId: leave._id, worker: req.user.id });
    }

    return res.json({ success: true, leave });
  } catch (err) {
    console.error("applyLeave error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const listLeaves = async (req, res) => {
  try {
    const userType = req.user.userType;

    if (userType === "Worker") {
      const leaves = await Leave.find({ worker: req.user.id }).sort({ createdAt: -1 });
      return res.json({ success: true, leaves });
    }

    if (userType === "CommunityManager") {
      const filter = { community: req.user.community };
      if (req.query.status) filter.status = req.query.status;
      const leaves = await Leave.find(filter).populate("worker").sort({ createdAt: -1 });
      return res.json({ success: true, leaves });
    }

    // Admins can also view all if needed
    if (userType === "admin") {
      const leaves = await Leave.find({}).populate("worker").sort({ createdAt: -1 });
      return res.json({ success: true, leaves });
    }

    return res.status(403).json({ success: false, message: "Forbidden" });
  } catch (err) {
    console.error("listLeaves error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getLeaveById = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id).populate("worker");
    if (!leave) return res.status(404).json({ success: false, message: "Leave not found" });

    // Authorization: worker can view own, manager/admin can view community leaves
    if (req.user.userType === "Worker" && leave.worker._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    if (req.user.userType === "CommunityManager" && leave.community.toString() !== req.user.community) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    return res.json({ success: true, leave });
  } catch (err) {
    console.error("getLeaveById error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const approveLeave = async (req, res) => {
  try {
    if (req.user.userType !== "CommunityManager" && req.user.userType !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ success: false, message: "Leave not found" });
    if (leave.community.toString() !== req.user.community && req.user.userType !== "admin")
      return res.status(403).json({ success: false, message: "Forbidden" });

    leave.status = "approved";
    leave.manager = req.user.id;
    leave.decisionAt = new Date();
    leave.notes = req.body.notes || leave.notes;
    await leave.save();

    // notify worker
    await pushNotification(Worker, leave.worker, {
      type: "Leave",
      title: "Leave Approved",
      message: `Your leave from ${leave.startDate.toISOString().slice(0,10)} to ${leave.endDate.toISOString().slice(0,10)} has been approved.`,
      referenceId: leave._id,
      referenceType: "Leave",
    }).catch(() => null);

    // Email worker
    try {
      const w = await Worker.findById(leave.worker);
      if (w?.email) {
        await emailService.sendNotificationEmail(
          w.email,
          'Leave Approved',
          `Your leave from ${leave.startDate.toISOString().slice(0,10)} to ${leave.endDate.toISOString().slice(0,10)} has been approved by the manager.`
        ).catch(() => null);
      }
    } catch (e) {
      console.warn('Failed to email worker on approve', e.message);
    }

    const io = getIO();
    if (io) io.to(`worker_${leave.worker}`).emit("leave:updated", { leaveId: leave._id, status: "approved" });

    return res.json({ success: true, leave });
  } catch (err) {
    console.error("approveLeave error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const rejectLeave = async (req, res) => {
  try {
    if (req.user.userType !== "CommunityManager" && req.user.userType !== "admin") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ success: false, message: "Leave not found" });
    if (leave.community.toString() !== req.user.community && req.user.userType !== "admin")
      return res.status(403).json({ success: false, message: "Forbidden" });

    leave.status = "rejected";
    leave.manager = req.user.id;
    leave.decisionAt = new Date();
    leave.notes = req.body.notes || leave.notes;
    await leave.save();

    // notify worker
    await pushNotification(Worker, leave.worker, {
      type: "Leave",
      title: "Leave Rejected",
      message: `Your leave from ${leave.startDate.toISOString().slice(0,10)} to ${leave.endDate.toISOString().slice(0,10)} was rejected.`,
      referenceId: leave._id,
      referenceType: "Leave",
    }).catch(() => null);

    // Email worker
    try {
      const w = await Worker.findById(leave.worker);
      if (w?.email) {
        await emailService.sendNotificationEmail(
          w.email,
          'Leave Rejected',
          `Your leave from ${leave.startDate.toISOString().slice(0,10)} to ${leave.endDate.toISOString().slice(0,10)} has been rejected by the manager. Reason: ${leave.notes || 'N/A'}`
        ).catch(() => null);
      }
    } catch (e) {
      console.warn('Failed to email worker on reject', e.message);
    }

    const io = getIO();
    if (io) io.to(`worker_${leave.worker}`).emit("leave:updated", { leaveId: leave._id, status: "rejected" });

    return res.json({ success: true, leave });
  } catch (err) {
    console.error("rejectLeave error", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export default {
  applyLeave,
  listLeaves,
  getLeaveById,
  approveLeave,
  rejectLeave,
};
