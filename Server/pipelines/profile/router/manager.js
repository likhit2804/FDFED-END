import express from "express";
import { memoryUpload } from "../../../configs/multer.js";
import {
    getManagerProfile,
    getProfileWithCommunity,
    updateManagerProfile,
    changePassword,
} from "../controllers/manager.js";

const profileManagerRouter = express.Router();

profileManagerRouter.get("/profile/api", getProfileWithCommunity);
profileManagerRouter.post("/profile", memoryUpload.single("image"), updateManagerProfile);
profileManagerRouter.post("/profile/changePassword", changePassword);

export default profileManagerRouter;
