import express from "express";
import { getDashboardData, getHistory } from "../controllers/worker.js";

const dashboardWorkerRouter = express.Router();

dashboardWorkerRouter.get("/getDashboardData", getDashboardData);
dashboardWorkerRouter.get("/history", getHistory);

export default dashboardWorkerRouter;
