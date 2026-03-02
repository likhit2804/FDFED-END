import express from "express";
import auth from "../controllers/auth.js";
import { authorizeW, authorizeC } from "../controllers/authorization.js";
import leaveController from "../controllers/leaveController.js";

const router = express.Router();

// Worker applies for leave
router.post("/", auth, authorizeW, leaveController.applyLeave);

// List leaves (worker -> own, manager -> community)
router.get("/", auth, leaveController.listLeaves);

// Get leave by id
router.get("/:id", auth, leaveController.getLeaveById);

// Manager approves
router.put("/:id/approve", auth, authorizeC, leaveController.approveLeave);

// Manager rejects
router.put("/:id/reject", auth, authorizeC, leaveController.rejectLeave);

export default router;
