/**
 * Notification Service — pure functions for creating and managing notifications.
 * Any pipeline can import these to send notifications without duplicating logic.
 *
 * Usage:
 *   import { pushNotification, emitToRoom } from "../../notifications/services/notificationService.js";
 */

import Notifications from "../../../models/Notifications.js";
import { getIO } from "../../../utils/socket.js";

// ── CREATE & ATTACH ──────────────────────────────────

/**
 * Create a notification record, save it, and push its _id onto the
 * recipient user's `notifications` array.
 *
 * @param {Model}  userModel         – Mongoose model (Resident, Worker, CommunityManager, Security)
 * @param {String} userId            – _id of the recipient
 * @param {Object} notificationData  – { type, title, message, referenceId, referenceType, ... }
 * @param {Object} [opts]            – optional extras
 * @param {Boolean} [opts.emit=true] – also push via socket.io to `user_${userId}`
 * @returns {Document|null}          – the saved Notification document
 */
export const pushNotification = async (userModel, userId, notificationData, opts = {}) => {
    if (!userId) return null;
    const { emit = true } = opts;

    const notification = new Notifications(notificationData);
    await notification.save();

    // Attach to user's notifications array
    const user = await userModel.findById(userId);
    if (user) {
        user.notifications.push(notification._id);
        await user.save();
    }

    // Real-time push
    if (emit) {
        emitToUser(userId, "notification:new", notification);
    }

    return notification;
};

// ── BULK NOTIFY ──────────────────────────────────────

/**
 * Send the same notification to multiple users of the same model.
 * Useful for community-wide announcements.
 */
export const pushNotificationBulk = async (userModel, userIds, notificationData) => {
    const results = [];
    for (const uid of userIds) {
        const n = await pushNotification(userModel, uid, notificationData);
        if (n) results.push(n);
    }
    return results;
};

// ── QUERY ────────────────────────────────────────────

/**
 * Get notifications for a user, newest first.
 */
export const getNotificationsForUser = async (userModel, userId, limit = 50) => {
    const user = await userModel
        .findById(userId)
        .populate({
            path: "notifications",
            options: { sort: { createdAt: -1 }, limit },
        })
        .lean();

    return user?.notifications || [];
};

/**
 * Mark a single notification as read.
 */
export const markAsRead = async (notificationId) => {
    return Notifications.findByIdAndUpdate(notificationId, { read: true }, { new: true });
};

/**
 * Mark all notifications for a user as read.
 */
export const markAllAsRead = async (userModel, userId) => {
    const user = await userModel.findById(userId).populate("notifications");
    if (!user) return 0;

    const unreadIds = user.notifications
        .filter((n) => !n.read)
        .map((n) => n._id);

    if (unreadIds.length === 0) return 0;

    await Notifications.updateMany({ _id: { $in: unreadIds } }, { read: true });
    return unreadIds.length;
};

/**
 * Delete a notification and remove it from the user's array.
 */
export const deleteNotification = async (userModel, userId, notificationId) => {
    await Notifications.findByIdAndDelete(notificationId);

    const user = await userModel.findById(userId);
    if (user) {
        user.notifications = user.notifications.filter(
            (id) => id.toString() !== notificationId.toString()
        );
        await user.save();
    }
};

// ── SOCKET.IO HELPERS ────────────────────────────────

/**
 * Emit an event to a specific user room: `user_${userId}`
 */
export const emitToUser = (userId, event, payload) => {
    const io = getIO();
    if (!io || !userId) return;
    io.to(`user_${userId}`).emit(event, payload);
};

/**
 * Emit an event to a named room, e.g. `community_${communityId}`
 */
export const emitToRoom = (room, event, payload) => {
    const io = getIO();
    if (!io || !room) return;
    io.to(room).emit(event, payload);
};

/**
 * Emit to role-specific rooms: `resident_${id}`, `worker_${id}`, `community_${id}`
 */
export const emitToRoleRooms = (issue, event, payload) => {
    const io = getIO();
    if (!io || !issue) return;

    const toId = (v) => (v && v._id ? v._id : v);
    const residentId = toId(issue.resident);
    const workerId = toId(issue.workerAssigned);
    const communityId = toId(issue.community);

    if (residentId) io.to(`resident_${residentId}`).emit(event, payload);
    if (workerId) io.to(`worker_${workerId}`).emit(event, payload);
    if (communityId) io.to(`community_${communityId}`).emit(event, payload);
};
