import express from "express";
import { memoryUpload } from "../../../configs/multer.js";
import { getResidentProfile, updateProfile, changePassword } from "../controllers/resident.js";

const profileResidentRouter = express.Router();

// GET /resident/profile
profileResidentRouter.get("/profile", getResidentProfile);
// POST /resident/profile  (with optional image upload)
profileResidentRouter.post("/profile", memoryUpload.single("image"), updateProfile);
// POST /resident/change-password
profileResidentRouter.post("/change-password", changePassword);


export default profileResidentRouter;
