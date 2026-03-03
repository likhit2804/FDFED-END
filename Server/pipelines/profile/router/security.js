import express from "express";
import multer from "multer";
import { getProfile, updateProfile, changePassword } from "../controllers/security.js";

const profileSecurityRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /security/profile
profileSecurityRouter.get("/profile", getProfile);
// POST /security/profile (with optional image upload)
profileSecurityRouter.post("/profile", upload.single("image"), updateProfile);
// POST /security/change-password
profileSecurityRouter.post("/change-password", changePassword);


export default profileSecurityRouter;
