import express from "express";
import multer from "multer";
import {
    getManagerProfile,
    getProfileWithCommunity,
    updateManagerProfile,
    changePassword,
} from "../controllers/manager.js";

const profileManagerRouter = express.Router();
const upload = multer({ dest: "uploads/" });

profileManagerRouter.get("/profile/api", getProfileWithCommunity);
profileManagerRouter.post("/profile", upload.single("image"), updateManagerProfile);
profileManagerRouter.post("/profile/changePassword", changePassword);

export default profileManagerRouter;
