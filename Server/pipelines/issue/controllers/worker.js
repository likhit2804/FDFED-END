import Issue from "../../../models/issues.js";
import Worker from "../../../models/workers.js";
import Resident from "../../../models/resident.js";
import CommunityManager from "../../../models/cManager.js";
import Notifications from "../../../models/Notifications.js";
import Leave from "../../../models/leave.js";
import { flagMisassigned } from "../../../utils/issueAutomation.js";
import { pushNotification } from "../../notifications/services/notificationService.js";
import { getCommunityManagerForCommunity, emitIssueUpdate, logIssueActivity } from "../utils/issueShared.js";

// --------------------------------------------------
// WORKER: Start Issue
// --------------------------------------------------
export const startIssue = async (req, res) => {
    try {
        const today = new Date();
        const activeLeave = await Leave.findOne({
            worker: req.user.id,
            status: "approved",
            startDate: { $lte: today },
            endDate: { $gte: today },
        });
        if (activeLeave) {
            return res.status(400).json({
                success: false,
                message: "You are currently on approved leave and cannot start tasks.",
            });
        }

        const issue = await Issue.findOne({ _id: req.params.id, community: req.user.community });
        if (!issue)
            return res.status(404).json({ success: false, message: "Issue not found" });

        if (issue.status !== "Assigned") {
            return res
                .status(400)
                .json({ success: false, message: "Issue must be Assigned before starting" });
        }

        issue.status = "In Progress";
        logIssueActivity(issue, "Started", "Worker", "Field technician started work on this issue", req.user.id);
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
        const today = new Date();
        const activeLeave = await Leave.findOne({
            worker: req.user.id,
            status: "approved",
            startDate: { $lte: today },
            endDate: { $gte: today },
        });
        if (activeLeave) {
            return res.status(400).json({
                success: false,
                message: "You are currently on approved leave and cannot resolve tasks.",
            });
        }

        const issue = await Issue.findOne({
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

        const isFreeCategory =
            issue.categoryType === "Community" ||
            issue.category === "Waste Management" ||
            issue.category === "Security";

        const parsedCost = isFreeCategory ? 0 : Math.max(0, Number(estimatedCost) || 0);
        issue.estimatedCost = parsedCost;

        if (issue.categoryType === "Resident") {
            issue.status = "Resolved (Awaiting Confirmation)";
            issue.resolvedAt = new Date();
            const costNote = parsedCost > 0 ? ` Estimated cost: ₹${parsedCost}` : " Free society service.";
            logIssueActivity(issue, "Resolved", "Worker", `Work completed.${costNote}`, req.user.id);
            await pushNotification(Resident, issue.resident._id, {
                type: "Issue",
                title: "Issue Resolved",
                message: `Your issue ${issue.issueID || issue._id} has been resolved.${parsedCost > 0 ? ` Cost: ₹${parsedCost}.` : ""} Please review and confirm.`,
                referenceId: issue._id,
                referenceType: "Issue",
            });
        } else if (issue.categoryType === "Community") {
            issue.status = "Closed";
            issue.resolvedAt = new Date();
            logIssueActivity(issue, "Resolved", "Worker", `Community maintenance resolved by technician.`, req.user.id);
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
            .sort({ createdAt: -1 })
            .populate("workerAssigned")
            .populate("resident");

        res.json({ success: true, tasks });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to fetch tasks" });
    }
};
