import express from "express";
import Worker from "../../../models/workers.js";
import { makeNotificationHandlers } from "../controllers/index.js";

const h = makeNotificationHandlers(Worker);
const router = express.Router();

router.get("/notifications", h.getAll);
router.patch("/notifications/read-all", h.readAll);
router.patch("/notifications/:id/read", h.read);
router.delete("/notifications/:id", h.remove);

export default router;
