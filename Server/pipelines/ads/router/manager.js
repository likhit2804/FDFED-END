import express from "express";
import multer from "multer";
import {
    getAdvertisements,
    createAdvertisement,
    updateAdvertisement,
    deleteAdvertisement,
} from "../controllers/manager.js";

const adsManagerRouter = express.Router();

const upload = multer({ dest: "uploads/" });

adsManagerRouter.get("/api/ad", getAdvertisements);
adsManagerRouter.post("/api/ad", upload.single("image"), createAdvertisement);
adsManagerRouter.put("/api/ad/:id", upload.single("image"), updateAdvertisement);
adsManagerRouter.delete("/ad/:id", deleteAdvertisement);

export default adsManagerRouter;
