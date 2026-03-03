import express from "express";
import Issue from "../models/issues.js";
const workerRouter = express.Router();
import Ad from "../models/Ad.js";
import Worker from "../models/workers.js";
import checkSubscriptionStatus from "../middleware/subcriptionStatus.js";

import { getDashboardData, getHistory } from "../controllers/Worker/dashboard.controller.js";
import { getProfile, updateProfile, changePassword } from "../controllers/Worker/profile.controller.js";

// Block access for workers when community subscription is inactive/expired
workerRouter.use(checkSubscriptionStatus);

workerRouter.get("/getDashboardData", getDashboardData);
workerRouter.get("/history", getHistory);


import issueWorkerRouter from "../pipelines/issue/router/worker.js";
workerRouter.use("/", issueWorkerRouter);

const upload = multer({ storage: multer.memoryStorage() });

workerRouter.get("/profile", getProfile);
workerRouter.post("/profile", upload.single("image"), updateProfile);
workerRouter.post("/change-password", changePassword);

export default workerRouter;
