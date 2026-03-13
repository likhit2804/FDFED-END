import express from "express";
import { getDashboardData } from "../controllers/manager.js";

const dashboardManagerRouter = express.Router();

dashboardManagerRouter.get("/api/dashboard", getDashboardData);

export default dashboardManagerRouter;
