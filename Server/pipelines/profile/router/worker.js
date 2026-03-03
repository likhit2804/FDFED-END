import express from "express";
import { memoryUpload } from "../../../configs/multer.js";
import { getProfile, updateProfile, changePassword } from "../controllers/worker.js";

const profileWorkerRouter = express.Router();

// GET /worker/profile
profileWorkerRouter.get("/profile", getProfile);
// POST /worker/profile (with optional image upload)
profileWorkerRouter.post("/profile", memoryUpload.single("image"), updateProfile);
// POST /worker/change-password
profileWorkerRouter.post("/change-password", changePassword);

export default profileWorkerRouter;
