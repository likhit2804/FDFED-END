import express from "express";
import Issue from "../core/models/issues.js";
import checkSubscriptionStatus from "../core/middleware/subscriptionStatus.js";
import { getWorkerDashboardData } from "../pipelines/dashboard/worker/controller.js";
import {
  getProfile as getWorkerProfile,
  updateProfile as updateWorkerProfile,
  changePassword as changeWorkerPassword,
} from "../pipelines/profile/worker/controller.js";
import {
  startIssue,
  resolveIssue,
  misassignedIssue,
  getWorkerTasks,
} from "../pipelines/issue/shared/issueController.js";
import multer from "multer";

const workerRouter = express.Router();

// Multer memory storage for worker profile images (Cloudinary in handler)
const upload = multer({ storage: multer.memoryStorage() });

// Block access for workers when community subscription is inactive/expired
workerRouter.use(checkSubscriptionStatus);

workerRouter.get("/getDashboardData", getWorkerDashboardData);

workerRouter.get("/history", async (req, res) => {
  try {
    const issues = await Issue.find({
      workerAssigned: req.user.id,
      status: { $nin: ["Assigned", "Pending"] },
    })
      .populate("workerAssigned")
      .populate("resident");

    console.log("Worker history issues:", issues.length);

    return res.json({ success: true, issues });
  } catch (err) {
    console.error(err);
    return res
      .status(500)
      .json({ success: false, message: "Server error while fetching history" });
  }
});

// JSON API endpoint for worker's active tasks (Assigned, In Progress, Reopened)
workerRouter.get("/api/tasks", getWorkerTasks);

workerRouter.post("/issue/start/:id", startIssue);
workerRouter.post("/issue/resolve/:id", resolveIssue);
workerRouter.post("/issue/misassigned/:id", misassignedIssue);

workerRouter.get("/profile", getWorkerProfile);
workerRouter.post("/profile", upload.single("image"), updateWorkerProfile);
workerRouter.post("/change-password", changeWorkerPassword);

export default workerRouter;
