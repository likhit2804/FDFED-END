import express from "express";
import Resident from "../../../models/resident.js";
import { makeNotificationHandlers } from "../controllers/index.js";

const h = makeNotificationHandlers(Resident);
const router = express.Router();

router.get("/notifications", h.getAll);
router.patch("/notifications/read-all", h.readAll);
router.patch("/notifications/:id/read", h.read);
router.delete("/notifications/:id", h.remove);

// Clear all notifications (legacy route kept for backward compat)
router.get("/clearNotification", async (req, res) => {
    try {
        await Resident.updateOne({ _id: req.user.id }, { $set: { notifications: [] } });
        return res.json({ ok: true });
    } catch (e) {
        return res.status(500).json({ ok: false, message: e.message });
    }
});

export default router;

