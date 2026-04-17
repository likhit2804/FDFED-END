import CommunityManager from "../../../models/cManager.js";
import { getIO } from "../../../utils/socket.js";

export const getCommunityManagerForCommunity = async (communityId) => {
    if (!communityId) return null;
    return CommunityManager.findOne({ assignedCommunity: communityId });
};

export const toId = (value) => (value && value._id ? value._id : value);

export const emitIssueUpdate = (issue, action = "updated") => {
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
