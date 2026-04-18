import express from "express";
import { getDashboardData } from "../controllers/manager.js";
import { cacheRoute } from "../../../middleware/cacheMiddleware.js";

const dashboardManagerRouter = express.Router();

dashboardManagerRouter.get("/api/dashboard", cacheRoute(30), getDashboardData);

export default dashboardManagerRouter;
