import express from "express";
import { sendPassword } from "../controllers/shared/OTP.js";
import { checkSubscription } from "../pipelines/shared/helpers.js";

const managerRouter = express.Router();

// --------------------------------------------------
// Pipelines (before subscription check)
// --------------------------------------------------
import csbManagerRouter from "../pipelines/CSB/router/manager.js";
managerRouter.use("/", csbManagerRouter);

import paymentManagerRouter from "../pipelines/payment/router/manager.js";
managerRouter.use("/", paymentManagerRouter);

import notificationManagerRouter from "../pipelines/notifications/router/manager.js";
managerRouter.use("/", notificationManagerRouter);

import issueManagerRouter from "../pipelines/issue/router/manager.js";
managerRouter.use("/", issueManagerRouter);

// Apply checkSubscription middleware to all routes except excluded ones
managerRouter.use(checkSubscription);

// --------------------------------------------------
// Pipelines (after subscription check)
// --------------------------------------------------
import subscriptionManagerRouter from "../pipelines/subscription/router/manager.js";
managerRouter.use("/", subscriptionManagerRouter);

import userMgmtManagerRouter from "../pipelines/userManagement/router/manager.js";
managerRouter.use("/", userMgmtManagerRouter);

import dashboardManagerRouter from "../pipelines/dashboard/router/manager.js";
managerRouter.use("/", dashboardManagerRouter);

import profileManagerRouter from "../pipelines/profile/router/manager.js";
managerRouter.use("/", profileManagerRouter);

import communityManagerRouter from "../pipelines/community/router/manager.js";
managerRouter.use("/", communityManagerRouter);

export default managerRouter;
