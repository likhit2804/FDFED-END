import express from "express";
import { applyLeave, listLeaves, getLeaveById } from "../controllers/resident.js";

const leaveWorkerRouter = express.Router();

// Worker: apply for leave
leaveWorkerRouter.post("/", applyLeave);

// Worker: list own leaves
leaveWorkerRouter.get("/", listLeaves);

// Worker / shared: get leave by ID
leaveWorkerRouter.get("/:id", getLeaveById);

export default leaveWorkerRouter;
