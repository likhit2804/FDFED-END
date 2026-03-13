/**
 * Notification HTTP controllers.
 * Each role-router calls these — the service does the heavy lifting.
 */

import {
    getNotificationsForUser,
    markAsRead,
    markAllAsRead,
    deleteNotification,
} from "../services/notificationService.js";

// Factory that returns handlers bound to a specific Mongoose model.
// This way resident / manager / worker / security all share the same logic.
export const makeNotificationHandlers = (UserModel) => ({

    /** GET /notifications */
    getAll: async (req, res) => {
        try {
            const notifications = await getNotificationsForUser(UserModel, req.user.id);
            return res.json({ success: true, notifications });
        } catch (e) {
            console.error("Notification fetch error:", e);
            return res.status(500).json({ success: false, message: "Failed to fetch notifications" });
        }
    },

    /** PATCH /notifications/:id/read */
    read: async (req, res) => {
        try {
            const notification = await markAsRead(req.params.id);
            if (!notification) return res.status(404).json({ success: false, message: "Not found" });
            return res.json({ success: true, notification });
        } catch (e) {
            console.error("Mark-read error:", e);
            return res.status(500).json({ success: false, message: "Failed to mark as read" });
        }
    },

    /** PATCH /notifications/read-all */
    readAll: async (req, res) => {
        try {
            const count = await markAllAsRead(UserModel, req.user.id);
            return res.json({ success: true, message: `${count} notifications marked as read` });
        } catch (e) {
            console.error("Mark-all-read error:", e);
            return res.status(500).json({ success: false, message: "Server error" });
        }
    },

    /** DELETE /notifications/:id */
    remove: async (req, res) => {
        try {
            await deleteNotification(UserModel, req.user.id, req.params.id);
            return res.json({ success: true, message: "Notification deleted" });
        } catch (e) {
            console.error("Notification delete error:", e);
            return res.status(500).json({ success: false, message: "Failed to delete notification" });
        }
    },
});
