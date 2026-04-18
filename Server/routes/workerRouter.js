import express from "express";
import checkSubscriptionStatus from "../middleware/subcriptionStatus.js";

const workerRouter = express.Router();

workerRouter.use(checkSubscriptionStatus);

// --------------------------------------------------
// Pipelines
// --------------------------------------------------
import issueWorkerRouter from "../pipelines/issue/router/worker.js";
workerRouter.use("/", issueWorkerRouter);

import profileWorkerRouter from "../pipelines/profile/router/worker.js";
workerRouter.use("/", profileWorkerRouter);

import notificationWorkerRouter from "../pipelines/notifications/router/worker.js";
workerRouter.use("/", notificationWorkerRouter);


// --------------------------------------------------
// Dashboard & History
// --------------------------------------------------
import dashboardWorkerRouter from "../pipelines/dashboard/router/worker.js";
workerRouter.use("/", dashboardWorkerRouter);

export default workerRouter;

