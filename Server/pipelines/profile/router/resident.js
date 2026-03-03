import express from "express";
import multer from "multer";
import { getResidentProfile, updateProfile, changePassword } from "../controllers/resident.js";

const profileResidentRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET /resident/profile
profileResidentRouter.get("/profile", getResidentProfile);
// POST /resident/profile  (with optional image upload)
profileResidentRouter.post("/profile", upload.single("image"), updateProfile);
// POST /resident/change-password
profileResidentRouter.post("/change-password", changePassword);


export default profileResidentRouter;
