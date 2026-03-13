import express from "express";
import {
    startIssue,
    resolveIssue,
    misassignedIssue,
    getWorkerTasks,
} from "../controllers/worker.js";

const issueWorkerRouter = express.Router();

// JSON API endpoint for worker's active tasks (Assigned, In Progress, Reopened)
issueWorkerRouter.get("/api/tasks", getWorkerTasks);

issueWorkerRouter.post("/issue/start/:id", startIssue);
issueWorkerRouter.post("/issue/resolve/:id", resolveIssue);
issueWorkerRouter.post("/issue/misassigned/:id", misassignedIssue);

export default issueWorkerRouter;
