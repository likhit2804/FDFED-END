import express from "express";
import { getDashboardData, getHistory } from "../controllers/worker.js";
import { cacheRoute } from "../../../middleware/cacheMiddleware.js";

const dashboardWorkerRouter = express.Router();

dashboardWorkerRouter.get("/getDashboardData", cacheRoute(30), getDashboardData);
dashboardWorkerRouter.get("/history", cacheRoute(30), getHistory);

export default dashboardWorkerRouter;
