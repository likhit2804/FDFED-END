import CommunityManager from "../../../models/cManager.js";
import { getIO } from "../../../utils/socket.js";

export const getCommunityManagerForCommunity = async (communityId) => {
    if (!communityId) return null;
    return CommunityManager.findOne({ assignedCommunity: communityId });
};

export const toId = (value) => (value && value._id ? value._id : value);

export const emitIssueUpdate = async (issue, action = "updated") => {
    const io = getIO();
    if (!io || !issue) return;

    const residentId = toId(issue.resident)?.toString();
    const workerId = toId(issue.workerAssigned)?.toString();
    const communityId = toId(issue.community)?.toString();

    const payload = {
        action,
        issueId: issue._id?.toString(),
        status: issue.status,
        categoryType: issue.categoryType,
        community: communityId,
        workerAssigned: workerId || null,
        resident: residentId || null,
        updatedAt: new Date().toISOString(),
    };

    console.log(`📡 [SOCKET EMIT] issue:updated (${action}) for issue ${issue._id} -> Status: ${issue.status}`);

    // Room-specific broadcasts
    if (residentId) io.to(`resident_${residentId}`).emit("issue:updated", payload);
    if (workerId) io.to(`worker_${workerId}`).emit("issue:updated", payload);
    if (communityId) {
        io.to(`community_${communityId}`).emit("issue:updated", payload);
        try {
            const manager = await getCommunityManagerForCommunity(communityId);
            if (manager) {
                io.to(`manager_${manager._id}`).emit("issue:updated", payload);
            }
        } catch (e) {
            console.error("Error finding manager for socket emit:", e);
        }
    }

    // Global broadcast fallback (ensures guaranteed delivery across all connected browser tabs)
    io.emit("issue:updated", payload);
};

export const logIssueActivity = (issue, action, performedBy, details = "", performedById = null) => {
    if (!issue) return;
    if (!issue.timeline) issue.timeline = [];
    issue.timeline.push({
        action,
        performedBy,
        performedById,
        details,
        timestamp: new Date(),
    });
};

/**
 * Determine issue priority based on category, keywords, and time-of-day.
 * Canonical source — imported by both resident.js and security.js controllers.
 */
export function determineIssuePriority(category, categoryType, description = "", title = "") {
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
