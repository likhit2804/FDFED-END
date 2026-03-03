import Issue from "../../../models/issues.js";
import Worker from "../../../models/workers.js";
import Resident from "../../../models/resident.js";
import CommunityManager from "../../../models/cManager.js";
import Payment from "../../../models/payment.js";
import { createPaymentRecord } from "../../payment/services/paymentService.js";
import { pushNotification } from "../../notifications/services/notificationService.js";
import { getIO } from "../../../utils/socket.js";
import {
    autoAssignResidentIssue,
    autoAssignCommunityIssue,
    checkDuplicateIssue,
    checkDuplicateCommunityIssue,
} from "../../../utils/issueAutomation.js";

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

function determineIssuePriority(category, categoryType, description = "", title = "") {
    const now = new Date();
    const hour = now.getHours();
    const isOffHours = hour < 8 || hour > 18 || now.getDay() === 0 || now.getDay() === 6;

    const content = `${title} ${description}`.toLowerCase();

    if (/(flood|sewage|major water leak|power outage|no electricity|electrical sparks|stuck in elevator|can't get out)/.test(content)) {
        return "Urgent";
    }

    if (category === "Security") {
        return isOffHours ? "Urgent" : "High";
    }

    if (category === "Elevator" && /stuck|not working/.test(content)) {
        return "Urgent";
    }

    if (/(broken|not working|overflow|infestation|mold|rodents|health|safety)/.test(content)) {
        return "High";
    }

    if (isOffHours && /(streetlight|dark|security)/.test(content)) {
        return "High";
    }

    return "Normal";
}

// --------------------------------------------------
// RESIDENT: Raise Issue
// --------------------------------------------------
export const raiseIssue = async (req, res) => {
    try {
        const { title, category, categoryType, description, location, otherCategory } = req.body;

        if (!category || !categoryType || !description) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const resident = await Resident.findById({ _id: req.user.id, community: req.user.community });
        if (!resident) return res.status(404).json({ success: false, message: "Resident not found" });

        const finalPriority = determineIssuePriority(category, categoryType, description, title);

        let finalLocation = "";
        if (categoryType === "Resident") {
            finalLocation = location && location.trim() ? location.trim() : resident.uCode;
        } else {
            if (!location || !location.trim()) {
                return res.status(400).json({
                    success: false,
                    message: "Location is required for Community issues",
                });
            }
            finalLocation = location.trim();
        }

        if (!finalLocation) {
            return res.status(400).json({
                success: false,
                message: "Unable to determine location for this issue",
            });
        }

        let duplicate;
        if (categoryType === "Resident") {
            duplicate = await checkDuplicateIssue(resident._id, category, finalLocation);
        } else {
            duplicate = await checkDuplicateCommunityIssue(category, finalLocation);
        }

        if (duplicate) {
            return res.status(409).json({
                success: false,
                message: `Similar issue already exists: ${duplicate.title || duplicate.category}`,
                existingIssue: {
                    id: duplicate._id,
                    title: duplicate.title,
                    status: duplicate.status,
                    createdAt: duplicate.createdAt,
                },
            });
        }

        const issue = new Issue({
            title,
            category,
            categoryType,
            description,
            location: finalLocation,
            priority: finalPriority,
            resident: resident._id,
            community: resident.community,
            otherCategory,
            status: "Pending Assignment",
        });
        await issue.save();

        console.log(
            `Issue created: ${issue._id}, Category: ${issue.category}, Type: ${issue.categoryType}, Priority: ${issue.priority}`
        );

        try {
            if (categoryType === "Community") {
                console.log("Attempting to auto-assign community issue...");
                const result = await autoAssignCommunityIssue(issue);
                console.log("Community auto-assign result:", result);
            } else if (categoryType === "Resident") {
                console.log("Attempting to auto-assign resident issue...");
                const result = await autoAssignResidentIssue(issue);
                console.log("Resident auto-assign result:", result);
            }
        } catch (autoAssignError) {
            console.error("Auto-assignment failed:", autoAssignError);
        }

        const updatedIssue = await Issue.findById({
            _id: issue._id,
            community: req.user.community,
        }).populate("workerAssigned");

        if (updatedIssue?.workerAssigned) {
            await pushNotification(Worker, updatedIssue.workerAssigned._id, {
                type: "Issue",
                title: "New Issue Assigned",
                message: `A new issue (${updatedIssue.issueID || updatedIssue._id}) has been assigned to you.`,
                referenceId: updatedIssue._id,
                referenceType: "Issue",
            });
        } else {
            const manager = await getCommunityManagerForCommunity(updatedIssue.community);
            if (manager) {
                await pushNotification(CommunityManager, manager._id, {
                    type: "Issue",
                    title: "Issue Needs Assignment",
                    message: `A new issue (${updatedIssue.issueID || updatedIssue._id}) needs assignment.`,
                    referenceId: updatedIssue._id,
                    referenceType: "Issue",
                });
            }
        }

        emitIssueUpdate(updatedIssue, "created");

        res.status(201).json({ success: true, issue: updatedIssue });
    } catch (error) {
        console.error("Raise Issue Error:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// --------------------------------------------------
// RESIDENT: Confirm Issue
// --------------------------------------------------
export const confirmIssue = async (req, res) => {
    try {
        const issue = await Issue.findById({ _id: req.params.id, community: req.user.community });

        if (!issue)
            return res.status(404).json({ success: false, message: "Issue not found" });

        if (issue.categoryType !== "Resident") {
            return res.status(400).json({
                success: false,
                message: "Community issues do not require resident confirmation.",
            });
        }

        if (issue.status !== "Resolved (Awaiting Confirmation)") {
            return res.status(400).json({ success: false, message: "Cannot confirm this issue" });
        }

        issue.status = "Payment Pending";
        await issue.save();

        if (issue.workerAssigned) {
            await pushNotification(Worker, issue.workerAssigned, {
                type: "Issue",
                title: "Resident Confirmed",
                message: `Resident confirmed issue ${issue.issueID || issue._id}. Payment is pending.`,
                referenceId: issue._id,
                referenceType: "Issue",
            });
        }

        emitIssueUpdate(issue, "payment_pending");

        res.json({ success: true, message: "Issue confirmed. Payment process initiated." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// --------------------------------------------------
// RESIDENT: Reject Issue Resolution
// --------------------------------------------------
export const rejectIssueResolution = async (req, res) => {
    try {
        const issue = await Issue.findById({ _id: req.params.id, community: req.user.community });

        if (!issue)
            return res.status(404).json({ success: false, message: "Issue not found" });

        if (issue.categoryType !== "Resident") {
            return res.status(400).json({
                success: false,
                message: "Community issues do not require rejection.",
            });
        }

        if (issue.status !== "Resolved (Awaiting Confirmation)") {
            return res.status(400).json({ success: false, message: "Issue cannot be rejected" });
        }

        issue.status = "Reopened";
        issue.autoAssigned = false;
        await issue.save();

        if (issue.workerAssigned) {
            await pushNotification(Worker, issue.workerAssigned, {
                type: "Issue",
                title: "Issue Reopened",
                message: `Resident rejected resolution for issue ${issue.issueID || issue._id}.`,
                referenceId: issue._id,
                referenceType: "Issue",
            });
        }

        emitIssueUpdate(issue, "reopened");

        res.json({ success: true, message: "Issue reopened. Manager will reassign." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// --------------------------------------------------
// RESIDENT: Delete Issue
// --------------------------------------------------
export const deleteIssue = async (req, res) => {
    try {
        const { issueID } = req.params;

        const issue = await Issue.findOneAndDelete({ _id: issueID, community: req.user.community });
        if (!issue)
            return res.status(404).json({ success: false, message: "Issue not found" });

        const resident = await Resident.findById({ _id: req.user.id, community: req.user.community });
        if (!resident)
            return res.status(404).json({ success: false, message: "Resident not found" });

        resident.raisedIssues = resident.raisedIssues.filter(
            (id) => id.toString() !== issueID
        );
        await resident.save();

        res.json({ success: true, message: "Issue deleted successfully" });
    } catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
};

// --------------------------------------------------
// RESIDENT: Get All Issues
// --------------------------------------------------
export const getResidentIssues = async (req, res) => {
    try {
        const issues = await Issue.find({
            resident: req.user.id,
            community: req.user.community,
        })
            .populate("workerAssigned")
            .populate("payment");

        res.status(200).json({ issues });
    } catch (error) {
        console.error("Error fetching issues:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

// --------------------------------------------------
// RESIDENT: Get Issue Data By ID
// --------------------------------------------------
export const getIssueDataById = async (req, res) => {
    try {
        const { issueID } = req.params;
        console.log("Fetching issue data for ID:", issueID);
        const issue = await Issue.findById(issueID, { community: req.user.community })
            .populate("resident")
            .populate("workerAssigned")
            .populate("payment");

        if (!issue) {
            return res.status(404).json({ error: "Issue not found." });
        }
        console.log("Issue data found:", issue);
        res.status(200).json(issue);
    } catch (error) {
        console.error("Error fetching issue data:", error);
        res.status(500).json({ error: "Internal server error." });
    }
};

// --------------------------------------------------
// RESIDENT: Submit Feedback & Trigger Payment
// --------------------------------------------------
export const submitFeedback = async (req, res) => {
    const { id, feedback, rating } = req.body;
    try {
        const issue = await Issue.findById(id).populate({
            path: "community",
            select: "communityManager",
        });

        if (!issue) {
            return res.status(404).json({ success: false, message: "Issue not found." });
        }

        if (issue.categoryType !== "Resident" || issue.status !== "Payment Pending") {
            return res.status(400).json({
                success: false,
                message:
                    "Feedback can only be submitted for confirmed Resident issues awaiting payment.",
            });
        }

        if (issue.feedback) {
            return res
                .status(400)
                .json({ success: false, message: "Feedback already submitted for this issue." });
        }

        issue.feedback = feedback;
        issue.rating = rating;

        const communityManagerId = issue.community?.communityManager;
        if (!communityManagerId) {
            return res.status(400).json({
                success: false,
                message: "Community manager not found for this issue.",
            });
        }

        const payment = await createPaymentRecord({
            title: issue.title,
            senderId: issue.resident,
            receiverId: communityManagerId,
            amount: issue.estimatedCost || 0,
            communityId: issue.community?._id || issue.community,
            status: "Pending",
            belongTo: "Issue",
            belongToId: issue._id,
        });

        issue.payment = payment._id;
        await issue.save();

        const manager = await getCommunityManagerForCommunity(
            issue.community?._id || issue.community
        );
        if (manager) {
            await pushNotification(CommunityManager, manager._id, {
                type: "Payment",
                title: "Payment Initiated",
                message: `Payment initiated for issue ${issue.issueID || issue._id}.`,
                referenceId: payment._id,
                referenceType: "Payment",
            });
        }

        emitIssueUpdate(issue, "payment_initiated");

        res.json({ success: true, message: "Feedback submitted and payment initiated." });
    } catch (error) {
        console.error("Error submitting feedback:", error);
        res.status(500).json({ success: false, message: error.message || "Server error" });
    }
};
