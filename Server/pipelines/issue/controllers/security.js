import Issue from "../../../models/issues.js";
import Resident from "../../../models/resident.js";
import Flat from "../../../models/flats.js";
import CommunityManager from "../../../models/cManager.js";
import {
    autoAssignResidentIssue,
    autoAssignCommunityIssue,
} from "../../../utils/issueAutomation.js";
import { getCommunityManagerForCommunity, emitIssueUpdate, logIssueActivity } from "../utils/issueShared.js";
import { pushNotification } from "../../notifications/services/notificationService.js";

function determineIssuePriority(category, categoryType, description = "", title = "") {
    const now = new Date();
    const hour = now.getHours();
    const isOffHours = hour < 8 || hour > 18 || now.getDay() === 0 || now.getDay() === 6;
    const content = `${title} ${description}`.toLowerCase();

    if (/(flood|sewage|major water leak|power outage|no electricity|electric|spark|shock|stuck in elevator|can't get out)/.test(content)) {
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
// SECURITY: Log Issue on Behalf of Resident / Common Area
// --------------------------------------------------
export const logPhoneOrIntercomIssue = async (req, res) => {
    try {
        const {
            title,
            category,
            categoryType = "Resident",
            description,
            uCode,
            location,
            callSource = "Intercom",
        } = req.body;

        if (!title || !category || !description) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const communityId = req.user.community;
        let residentId = null;
        let finalLocation = location;

        if (categoryType === "Resident") {
            if (!uCode) {
                return res.status(400).json({ success: false, message: "Unit/Flat code (uCode) is required for resident complaints" });
            }

            const resident = await Resident.findOne({
                uCode: uCode.toUpperCase().trim(),
                community: communityId,
            });

            if (!resident) {
                return res.status(404).json({ success: false, message: `No active resident found for flat ${uCode}` });
            }

            residentId = resident._id;
            finalLocation = resident.uCode;
        } else {
            if (!location) {
                return res.status(400).json({ success: false, message: "Location is required for community complaints" });
            }
        }

        const finalPriority = determineIssuePriority(category, categoryType, description, title);

        const issue = await Issue.create({
            title: `[${callSource}] ${title}`,
            category,
            categoryType,
            description: `[Logged by Security via ${callSource}]: ${description}`,
            location: finalLocation,
            priority: finalPriority,
            resident: residentId,
            community: communityId,
            status: "Pending Assignment",
            timeline: [
                {
                    action: "Created",
                    performedBy: "Security",
                    performedById: req.user.id,
                    details: `Logged via ${callSource} for ${finalLocation}`,
                    timestamp: new Date(),
                },
            ],
        });

        if (residentId) {
            await Resident.findByIdAndUpdate(residentId, {
                $addToSet: { raisedIssues: issue._id },
            });
        }

        // Auto-assign on-duty worker immediately
        let assignResult = null;
        if (categoryType === "Resident") {
            assignResult = await autoAssignResidentIssue(issue);
        } else {
            assignResult = await autoAssignCommunityIssue(issue);
        }

        const updatedIssue = await Issue.findById(issue._id)
            .populate("resident")
            .populate("workerAssigned");

        // Notify resident if it's a flat issue
        if (residentId) {
            await pushNotification(Resident, residentId, {
                type: "Issue",
                title: "Maintenance Ticket Logged",
                message: `Security logged a ticket (${issue.issueID || issue._id}) on your behalf via ${callSource}.`,
                referenceId: issue._id,
                referenceType: "Issue",
            });
        }

        // Notify manager if no worker was auto-assigned
        if (!assignResult || !assignResult.assigned) {
            const manager = await getCommunityManagerForCommunity(communityId);
            if (manager) {
                await pushNotification(CommunityManager, manager._id, {
                    type: "Issue",
                    title: "Phone-in Issue Needs Assignment",
                    message: `Security logged ticket ${issue.issueID || issue._id} via ${callSource} needing worker assignment.`,
                    referenceId: issue._id,
                    referenceType: "Issue",
                });
            }
        }

        emitIssueUpdate(updatedIssue, "created");

        res.status(201).json({
            success: true,
            message: `Issue successfully logged via ${callSource} and dispatched.`,
            issue: updatedIssue,
        });
    } catch (error) {
        console.error("Security Log Issue Error:", error);
        res.status(500).json({ success: false, message: error.message || "Server error" });
    }
};

// --------------------------------------------------
// SECURITY: Get Flats in Community (Dropdown Helper)
// --------------------------------------------------
export const getCommunityFlatsForSecurity = async (req, res) => {
    try {
        const residents = await Resident.find({ community: req.user.community })
            .select("residentFirstname residentLastname uCode email contact")
            .sort({ uCode: 1 });

        res.json({ success: true, residents });
    } catch (error) {
        console.error("Fetch Flats Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch flats" });
    }
};

// --------------------------------------------------
// SECURITY: Get All Issues (Desk Overview & History)
// --------------------------------------------------
export const getSecurityLoggedIssues = async (req, res) => {
    try {
        const communityId = req.user.community;
        const issues = await Issue.find({ community: communityId })
            .populate("resident", "residentFirstname residentLastname uCode contact")
            .populate("workerAssigned", "name contact jobRole")
            .sort({ createdAt: -1 });

        res.json({ success: true, issues });
    } catch (error) {
        console.error("Fetch Security Issues Error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch issues" });
    }
};

// --------------------------------------------------
// SECURITY: Delete / Cancel Issue
// --------------------------------------------------
export const deleteSecurityIssue = async (req, res) => {
    try {
        const { id } = req.params;
        const communityId = req.user.community;

        const issue = await Issue.findOne({ _id: id, community: communityId });
        if (!issue) {
            return res.status(404).json({ success: false, message: "Issue not found" });
        }

        issue.status = "Deleted";
        logIssueActivity(issue, "Deleted", "Security", "Marked as Deleted by Security Gate Desk", req.user.id);
        await issue.save();

        if (issue.resident) {
            await pushNotification(Resident, issue.resident, {
                type: "Issue",
                title: "Ticket Deleted by Security",
                message: `Ticket (${issue.issueID || issue._id}) was marked as Deleted by Security Gate Desk.`,
                referenceId: issue._id,
                referenceType: "Issue",
            });
        }

        emitIssueUpdate(issue, "deleted");

        res.json({ success: true, message: "Ticket marked as deleted", issue });
    } catch (error) {
        console.error("Delete Security Issue Error:", error);
        res.status(500).json({ success: false, message: "Failed to delete issue" });
    }
};


