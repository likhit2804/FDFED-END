import express from "express";
import { getDashboardInfo } from "../controllers/security.js";
import { cacheRoute } from "../../../middleware/cacheMiddleware.js";

const dashboardSecurityRouter = express.Router();

dashboardSecurityRouter.get("/dashboard", (req, res) => res.json({ success: true, message: "Security dashboard base route OK" }));
dashboardSecurityRouter.get("/dashboard/api", cacheRoute(30), getDashboardInfo);

export default dashboardSecurityRouter;
