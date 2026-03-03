import Issue from "../../../models/issues.js";
import Worker from "../../../models/workers.js";
import CommunityManager from "../../../models/cManager.js";
import { pushNotification } from "../../notifications/services/notificationService.js";
import Ad from "../../../models/Ad.js";
import { getIO } from "../../../utils/socket.js";
import { flagMisassigned } from "../../../utils/issueAutomation.js";

// pushNotification is now imported from notifications pipeline

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
// MANAGER: Assign Issue
// --------------------------------------------------
export const assignIssue = async (req, res) => {
    const { worker, deadline, remarks } = req.body;

    try {
        const issue = await Issue.findById({ _id: req.params.id, community: req.user.community });
        if (!issue)
            return res.status(404).json({ success: false, message: "Issue not found" });

        const invalidStatuses = [
            "Resolved (Awaiting Confirmation)",
            "Closed",
            "Auto-Closed",
            "Rejected",
        ];

        if (invalidStatuses.includes(issue.status)) {
            return res.status(400).json({
                success: false,
                message: "Cannot assign a completed or closed issue.",
            });
        }

        const workerData = await Worker.findById({ _id: worker, community: req.user.community });
        if (!workerData)
            return res.status(404).json({ success: false, message: "Worker not found" });

        if (!workerData.isActive) {
            return res.status(400).json({ success: false, message: "Cannot assign to inactive worker" });
        }

        if (issue.autoAssigned && issue.workerAssigned) {
            return res.status(400).json({
                success: false,
                message: "This issue was auto-assigned successfully. Use reassign instead.",
            });
        }

        if (issue.workerAssigned && issue.workerAssigned.toString() !== worker) {
            return res.status(400).json({
                success: false,
                message: "Issue already assigned to a different worker. Use reassign instead.",
            });
        }

        issue.workerAssigned = worker;
        issue.deadline = deadline || null;
        issue.remarks = remarks || null;
        issue.status = "Assigned";
        issue.autoAssigned = false;
        await issue.save();

        // Remove from old worker if reassigning
        if (issue.workerAssigned && issue.workerAssigned.toString() !== worker) {
            const oldWorker = await Worker.findById(issue.workerAssigned);
            if (oldWorker) {
                oldWorker.assignedIssues = oldWorker.assignedIssues.filter(
                    (id) => id.toString() !== issue._id.toString()
                );
                await oldWorker.save();
            }
        }

        if (!workerData.assignedIssues.includes(issue._id)) {
            workerData.assignedIssues.push(issue._id);
            await workerData.save();
        }

        await pushNotification(Worker, workerData._id, {
            type: "Issue",
            title: "Issue Assigned",
            message: `You have been assigned issue ${issue.issueID || issue._id}.`,
            referenceId: issue._id,
            referenceType: "Issue",
        });

        emitIssueUpdate(issue, "assigned");

        const populated = await Issue.findById({ _id: issue._id, community: req.user.community })
            .populate("resident")
            .populate("workerAssigned");

        res.json({
            success: true,
            message: "Worker assigned successfully",
            issue: populated,
        });
    } catch (error) {
        console.error("Assign Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// --------------------------------------------------
// MANAGER: Get all issues in manager community
// --------------------------------------------------
export const getManagerIssues = async (req, res) => {
    try {
        const managerId = req.user.id;
        const manager = await CommunityManager.findById(managerId);

        if (!manager) {
            return res.status(404).json({ success: false, message: "Community manager not found" });
        }

        const community = manager.assignedCommunity;
        if (!community) {
            return res.status(404).json({
                success: false,
                message: "No community assigned to this manager",
            });
        }

        const issues = await Issue.find({ community: req.user.community })
            .populate("resident")
            .populate("workerAssigned")
            .populate("misassignedBy")
            .sort({ createdAt: -1 });

        const residentIssues = issues.filter((i) => i.categoryType === "Resident");
        const communityIssues = issues.filter((i) => i.categoryType === "Community");

        const groupedCommunityIssues = {};
        communityIssues.forEach((issue) => {
            const loc = issue.location || "Unknown";
            if (!groupedCommunityIssues[loc]) groupedCommunityIssues[loc] = [];
            groupedCommunityIssues[loc].push(issue);
        });

        const analytics = {
            total: issues.length,
            resident: residentIssues.length,
            community: communityIssues.length,
            pending: issues.filter((i) =>
                ["Pending Assignment", "Assigned", "In Progress"].includes(i.status)
            ).length,
            resolved: issues.filter((i) =>
                ["Resolved (Awaiting Confirmation)", "Closed"].includes(i.status)
            ).length,
            highPriority: issues.filter(
                (i) => i.priority === "High" || i.priority === "Urgent"
            ).length,
            groupedCommunity: Object.entries(groupedCommunityIssues).map(
                ([location, arr]) => ({ location, count: arr.length })
            ),
        };

        res.json({
            success: true,
            analytics,
            residentIssues,
            communityIssues,
            groupedCommunityIssues,
        });
    } catch (error) {
        console.error("Fetch Issues Error:", error);
        res.status(500).json({ success: false, message: "Server error while fetching issues" });
    }
};

// --------------------------------------------------
// MANAGER: Reassign Issue
// --------------------------------------------------
export const reassignIssue = async (req, res) => {
    try {
        const { newWorker, remarks, deadline } = req.body;

        const issue = await Issue.findById(req.params.id);
        if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });

        const invalidStatuses = [
            "Resolved (Awaiting Confirmation)",
            "Closed",
            "Auto-Closed",
            "Rejected",
        ];

        if (invalidStatuses.includes(issue.status)) {
            return res.status(400).json({
                success: false,
                message: "Cannot reassign a completed/closed issue.",
            });
        }

        if (!issue.workerAssigned) {
            return res.status(400).json({
                success: false,
                message: "Issue has no assigned worker. Use assign instead.",
            });
        }

        if (issue.workerAssigned.toString() === newWorker.toString()) {
            return res.status(400).json({ success: false, message: "Already assigned to this worker." });
        }

        const workerData = await Worker.findById(newWorker);
        if (!workerData)
            return res.status(404).json({ success: false, message: "New worker not found." });

        if (issue.workerAssigned) {
            const oldWorker = await Worker.findById(issue.workerAssigned);
            if (oldWorker) {
                oldWorker.assignedIssues = oldWorker.assignedIssues.filter(
                    (w) => w.toString() !== issue._id.toString()
                );
                await oldWorker.save();
            }
        }

        issue.workerAssigned = newWorker;
        issue.status = "Assigned";
        issue.autoAssigned = false;
        issue.deadline = deadline || issue.deadline;
        issue.remarks = remarks || issue.remarks;
        await issue.save();

        if (!workerData.assignedIssues.map(String).includes(issue._id.toString())) {
            workerData.assignedIssues.push(issue._id);
            await workerData.save();
        }

        emitIssueUpdate(issue, "reassigned");

        const populated = await Issue.findById({ _id: issue._id, community: req.user.community })
            .populate("resident")
            .populate("workerAssigned")
            .populate("payment");

        return res.json({
            success: true,
            message: "Issue successfully reassigned!",
            issue: populated,
        });
    } catch (error) {
        console.error("Reassign Error:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

// --------------------------------------------------
// MANAGER: Close Issue
// --------------------------------------------------
export const closeIssueByManager = async (req, res) => {
    try {
        const issue = await Issue.findById({ _id: req.params.id, community: req.user.community });
        if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });

        issue.status = "Closed";
        await issue.save();

        emitIssueUpdate(issue, "closed");

        res.json({ success: true, message: "Issue closed by manager" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// --------------------------------------------------
// MANAGER: Get issue by ID
// --------------------------------------------------
export const getIssueById = async (req, res) => {
    const id = req.params.id;

    const issue = await Issue.findById({ _id: id, community: req.user.community })
        .populate("resident")
        .populate("workerAssigned")
        .populate("misassignedBy")
        .populate("payment");

    if (!issue) return res.status(404).json({ message: "Issue not found" });

    res.status(200).json({ success: true, issue });
};

// --------------------------------------------------
// MANAGER: Get Rejected Pending Issues
// --------------------------------------------------
export const getRejectedPendingIssues = async (req, res) => {
    try {
        const managerId = req.user.id;
        const manager = await CommunityManager.findById(managerId);

        if (!manager) {
            return res.status(404).json({ success: false, message: "Manager not found" });
        }

        const community = manager.assignedCommunity;

        const rejectedIssues = await Issue.find({
            community,
            status: "Reopened",
            autoAssigned: true,
        })
            .populate("resident")
            .populate("workerAssigned")
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: rejectedIssues.length,
            issues: rejectedIssues,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// --------------------------------------------------
// MANAGER: Get Issue Resolving API Issues
// --------------------------------------------------
export const getIssueResolvingApiIssues = async (req, res) => {
    try {
        const managerId = req.user.id;
        const manager = await CommunityManager.findById(managerId);

        if (!manager) {
            return res
                .status(404)
                .json({ success: false, message: "Community manager not found" });
        }

        const community = manager.assignedCommunity;
        if (!community) {
            return res
                .status(404)
                .json({ success: false, message: "Community not found" });
        }

        const issues = await Issue.find({ community })
            .populate("resident")
            .populate("workerAssigned")
            .sort({ createdAt: -1 });

        res.json({ success: true, issues });
    } catch (error) {
        console.error("Error fetching issues:", error);
        res.status(500).json({ success: false, message: "Failed to fetch issues" });
    }
};

// --------------------------------------------------
// MANAGER: Get Issue Resolving Data (view helper)
// --------------------------------------------------
export const getIssueResolvingData = async (req) => {
    try {
        const managerId = req.user.id;
        const manager = await CommunityManager.findById(managerId);

        const ads = await Ad.find({
            community: req.user.community,
            status: "Active",
        });

        if (!manager) {
            throw new Error("Community manager not found");
        }

        const community = manager.assignedCommunity;
        if (!community) {
            throw new Error("Community not found");
        }

        const workers = await Worker.find({ community });
        const issues = await Issue.find({ community })
            .populate("resident")
            .populate("workerAssigned");

        return { issues, workers, ads };
    } catch (error) {
        console.error(error);
        throw error;
    }
};
