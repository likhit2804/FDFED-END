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

