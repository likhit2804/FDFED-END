import Leave from "../../../models/leave.js";
import Worker from "../../../models/workers.js";
import CommunityManager from "../../../models/cManager.js";
import { getIO } from "../../../utils/socket.js";
import emailService from "../../../utils/emailService.js";
import { pushNotification } from "../../notifications/services/notificationService.js";

// --------------------------------------------------
// MANAGER: List leaves for the community (with optional status filter)
// --------------------------------------------------
export const listLeaves = async (req, res) => {
    try {
        const filter = { community: req.user.community };
        if (req.query.status) filter.status = req.query.status;
        const leaves = await Leave.find(filter).populate("worker").sort({ createdAt: -1 });
        return res.json({ success: true, leaves });
    } catch (err) {
        console.error("listLeaves error", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// --------------------------------------------------
// MANAGER: Get a single leave by ID
// --------------------------------------------------
export const getLeaveById = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id).populate("worker");
        if (!leave) return res.status(404).json({ success: false, message: "Leave not found" });

        if (leave.community.toString() !== req.user.community) {
            return res.status(403).json({ success: false, message: "Forbidden" });
        }

        return res.json({ success: true, leave });
    } catch (err) {
        console.error("getLeaveById error", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// --------------------------------------------------
// MANAGER: Approve a leave
// --------------------------------------------------
export const approveLeave = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);
        if (!leave) return res.status(404).json({ success: false, message: "Leave not found" });
        if (leave.community.toString() !== req.user.community)
            return res.status(403).json({ success: false, message: "Forbidden" });

        leave.status = "approved";
        leave.manager = req.user.id;
        leave.decisionAt = new Date();
        leave.notes = req.body.notes || leave.notes;
        await leave.save();

        await pushNotification(Worker, leave.worker, {
            type: "Leave",
            title: "Leave Approved",
            message: `Your leave from ${leave.startDate.toISOString().slice(0, 10)} to ${leave.endDate.toISOString().slice(0, 10)} has been approved.`,
            referenceId: leave._id,
            referenceType: "Leave",
        }).catch(() => null);

        try {
            const w = await Worker.findById(leave.worker);
            if (w?.email) {
                await emailService.sendNotificationEmail(
                    w.email,
                    "Leave Approved",
                    `Your leave from ${leave.startDate.toISOString().slice(0, 10)} to ${leave.endDate.toISOString().slice(0, 10)} has been approved by the manager.`
                ).catch(() => null);
            }
        } catch (e) {
            console.warn("Failed to email worker on approve", e.message);
        }

        const io = getIO();
        if (io) io.to(`worker_${leave.worker}`).emit("leave:updated", { leaveId: leave._id, status: "approved" });

        return res.json({ success: true, leave });
    } catch (err) {
        console.error("approveLeave error", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// --------------------------------------------------
// MANAGER: Reject a leave
// --------------------------------------------------
export const rejectLeave = async (req, res) => {
    try {
        const leave = await Leave.findById(req.params.id);
        if (!leave) return res.status(404).json({ success: false, message: "Leave not found" });
        if (leave.community.toString() !== req.user.community)
            return res.status(403).json({ success: false, message: "Forbidden" });

        leave.status = "rejected";
        leave.manager = req.user.id;
        leave.decisionAt = new Date();
        leave.notes = req.body.notes || leave.notes;
        await leave.save();

        await pushNotification(Worker, leave.worker, {
            type: "Leave",
            title: "Leave Rejected",
            message: `Your leave from ${leave.startDate.toISOString().slice(0, 10)} to ${leave.endDate.toISOString().slice(0, 10)} was rejected.`,
            referenceId: leave._id,
            referenceType: "Leave",
        }).catch(() => null);

        try {
            const w = await Worker.findById(leave.worker);
            if (w?.email) {
                await emailService.sendNotificationEmail(
                    w.email,
                    "Leave Rejected",
                    `Your leave from ${leave.startDate.toISOString().slice(0, 10)} to ${leave.endDate.toISOString().slice(0, 10)} has been rejected by the manager. Reason: ${leave.notes || "N/A"}`
                ).catch(() => null);
            }
        } catch (e) {
            console.warn("Failed to email worker on reject", e.message);
        }

        const io = getIO();
        if (io) io.to(`worker_${leave.worker}`).emit("leave:updated", { leaveId: leave._id, status: "rejected" });

        return res.json({ success: true, leave });
    } catch (err) {
        console.error("rejectLeave error", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
