import express from "express";
import multer from "multer";
import { getProfile, updateProfile, changePassword } from "../controllers/worker.js";

const profileWorkerRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /worker/profile
profileWorkerRouter.get("/profile", getProfile);
// POST /worker/profile (with optional image upload)
profileWorkerRouter.post("/profile", upload.single("image"), updateProfile);
// POST /worker/change-password
profileWorkerRouter.post("/change-password", changePassword);

export default profileWorkerRouter;
