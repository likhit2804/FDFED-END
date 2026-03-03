import Issue from "../../../models/issues.js";
import Worker from "../../../models/workers.js";
import Resident from "../../../models/resident.js";
import CommunityManager from "../../../models/cManager.js";
import Notifications from "../../../models/Notifications.js";
import { getIO } from "../../../utils/socket.js";
import { flagMisassigned } from "../../../utils/issueAutomation.js";

// --------------------------------------------------
// Shared helpers
// --------------------------------------------------
const pushNotification = async (userModel, userId, notificationData) => {
    if (!userId) return null;
    const notification = new Notifications(notificationData);
    await notification.save();
    const user = await userModel.findById(userId);
    if (user) {
        user.notifications.push(notification._id);
        await user.save();
    }
    return notification;
};

const getCommunityManagerForCommunity = async (communityId) => {
    if (!communityId) return null;
    return CommunityManager.findOne({ assignedCommunity: communityId });
};

const toId = (value) => (value && value._id ? value._id : value);

const emitIssueUpdate = (issue, action = "updated") => {
    const io = getIO();
    if (!io || !issue) return;

    const payload = {
        action,
        issueId: issue._id,
        status: issue.status,
        categoryType: issue.categoryType,
        community: issue.community,
        workerAssigned: toId(issue.workerAssigned) || null,
        resident: toId(issue.resident) || null,
        updatedAt: new Date().toISOString(),
    };

    const residentId = toId(issue.resident);
    const workerId = toId(issue.workerAssigned);
    const communityId = toId(issue.community);

    if (residentId) io.to(`resident_${residentId}`).emit("issue:updated", payload);
    if (workerId) io.to(`worker_${workerId}`).emit("issue:updated", payload);
    if (communityId) io.to(`community_${communityId}`).emit("issue:updated", payload);
};

// --------------------------------------------------
// WORKER: Start Issue
// --------------------------------------------------
export const startIssue = async (req, res) => {
    try {
        const issue = await Issue.findById({ _id: req.params.id, community: req.user.community });
        if (!issue)
            return res.status(404).json({ success: false, message: "Issue not found" });

        if (issue.status !== "Assigned") {
            return res
                .status(400)
                .json({ success: false, message: "Issue must be Assigned before starting" });
        }

        issue.status = "In Progress";
        await issue.save();

        await pushNotification(Resident, issue.resident, {
            type: "Issue",
            title: "Work Started",
            message: `Work has started on your issue ${issue.issueID || issue._id}.`,
            referenceId: issue._id,
            referenceType: "Issue",
        });

        emitIssueUpdate(issue, "in_progress");

        res.json({ success: true, message: "Issue marked as In Progress" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// --------------------------------------------------
// WORKER: Resolve Issue
// --------------------------------------------------
export const resolveIssue = async (req, res) => {
    const { estimatedCost } = req.body;
    try {
        const issue = await Issue.findById({
            _id: req.params.id,
            community: req.user.community,
        }).populate("resident");

        if (!issue)
            return res.status(404).json({ success: false, message: "Issue not found" });

        if (issue.status !== "In Progress") {
            return res
                .status(400)
                .json({ success: false, message: "Issue must be In Progress to resolve" });
        }

        if (issue.workerAssigned.toString() !== req.user.id) {
            return res
                .status(403)
                .json({ success: false, message: "You are not authorized to resolve this issue" });
        }

        const parsedCost = Number(estimatedCost);
        if (!Number.isFinite(parsedCost) || parsedCost <= 0) {
            return res
                .status(400)
                .json({ success: false, message: "Estimated cost must be a positive number" });
        }

        issue.estimatedCost = parsedCost;

        if (issue.categoryType === "Resident") {
            issue.status = "Resolved (Awaiting Confirmation)";
            issue.resolvedAt = new Date();
            const notification = new Notifications({
                type: "Issue",
                title: "Issue Resolved",
                message: `Your issue ${issue.issueID || issue._id} has been resolved. Please confirm.`,
                referenceId: issue._id,
                referenceType: "Issue",
            });
            await notification.save();
            issue.resident.notifications.push(notification._id);
            await issue.resident.save();
        } else if (issue.categoryType === "Community") {
            issue.status = "Closed";
            issue.resolvedAt = new Date();
            const manager = await getCommunityManagerForCommunity(issue.community);
            if (manager) {
                await pushNotification(CommunityManager, manager._id, {
                    type: "Issue",
                    title: "Community Issue Resolved",
                    message: `Community issue ${issue.issueID || issue._id} has been resolved.`,
                    referenceId: issue._id,
                    referenceType: "Issue",
                });
            }
        }

        await issue.save();

        emitIssueUpdate(issue, "resolved");

        res.json({ success: true, message: "Issue resolved." });
    } catch (error) {
        console.error("Resolve Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// --------------------------------------------------
// WORKER: Flag Misassigned
// --------------------------------------------------
export const misassignedIssue = async (req, res) => {
    try {
        await flagMisassigned(req.params.id);
        res.json({
            success: true,
            message: "Issue flagged as misassigned. Auto reassignment triggered.",
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// --------------------------------------------------
// WORKER: Get Active Tasks
// --------------------------------------------------
export const getWorkerTasks = async (req, res) => {
    try {
        const tasks = await Issue.find({
            workerAssigned: req.user.id,
            status: { $in: ["Assigned", "In Progress", "Reopened"] },
        })
            .populate("workerAssigned")
            .populate("resident");

        res.json({ success: true, tasks });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch tasks" });
    }
};
