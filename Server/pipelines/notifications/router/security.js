import express from "express";
import Security from "../../../models/security.js";
import { makeNotificationHandlers } from "../controllers/index.js";

const h = makeNotificationHandlers(Security);
const router = express.Router();

router.get("/notifications", h.getAll);
router.patch("/notifications/read-all", h.readAll);
router.patch("/notifications/:id/read", h.read);
router.delete("/notifications/:id", h.remove);

export default router;
