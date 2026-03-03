import express from "express";
import { memoryUpload } from "../../../configs/multer.js";
import { getProfile, updateProfile, changePassword } from "../controllers/security.js";

const profileSecurityRouter = express.Router();

// GET /security/profile
profileSecurityRouter.get("/profile", getProfile);
// POST /security/profile (with optional image upload)
profileSecurityRouter.post("/profile", memoryUpload.single("image"), updateProfile);
// POST /security/change-password
profileSecurityRouter.post("/change-password", changePassword);


export default profileSecurityRouter;
