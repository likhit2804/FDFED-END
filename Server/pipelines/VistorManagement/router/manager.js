import express from "express";
import {
    getVisitorManagementPage,
    getVisitorsApi,
    updateVisitorStatus,
} from "../controllers/manager.js";

const visitorManagementSecurityRouter = express.Router();

// Visitor management page (initial load)
visitorManagementSecurityRouter.get("/visitorManagement", getVisitorManagementPage);

// API: auto-refresh visitor list + stats
visitorManagementSecurityRouter.get("/visitorManagement/api/visitors", getVisitorsApi);

// Check-in / check-out action
visitorManagementSecurityRouter.get("/visitorManagement/:action/:id", updateVisitorStatus);

export default visitorManagementSecurityRouter;
