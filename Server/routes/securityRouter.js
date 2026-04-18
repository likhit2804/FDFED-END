import express from "express";
import checkSubscriptionStatus from "../middleware/subcriptionStatus.js";

const securityRouter = express.Router();

securityRouter.use(checkSubscriptionStatus);

// --------------------------------------------------
// Pipelines
// --------------------------------------------------
import preapprovalSecurityRouter from "../pipelines/Preapproval/router/security.js";
securityRouter.use("/", preapprovalSecurityRouter);

import visitorManagementSecurityRouter from "../pipelines/VistorManagement/router/manager.js";
securityRouter.use("/", visitorManagementSecurityRouter);

import profileSecurityRouter from "../pipelines/profile/router/security.js";
securityRouter.use("/", profileSecurityRouter);

import notificationSecurityRouter from "../pipelines/notifications/router/security.js";
securityRouter.use("/", notificationSecurityRouter);


// --------------------------------------------------
// Dashboard
// --------------------------------------------------
import dashboardSecurityRouter from "../pipelines/dashboard/router/security.js";
securityRouter.use("/", dashboardSecurityRouter);

export default securityRouter;

