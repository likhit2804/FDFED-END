import express from "express";
import {
    listLeaves,
    getLeaveById,
    approveLeave,
    rejectLeave,
} from "../controllers/manager.js";

const leaveManagerRouter = express.Router();

// Manager: list community leaves (GET /?status=pending etc.)
leaveManagerRouter.get("/", listLeaves);

// Manager: get leave by ID
leaveManagerRouter.get("/:id", getLeaveById);

// Manager: approve
leaveManagerRouter.put("/:id/approve", approveLeave);

// Manager: reject
leaveManagerRouter.put("/:id/reject", rejectLeave);

export default leaveManagerRouter;
