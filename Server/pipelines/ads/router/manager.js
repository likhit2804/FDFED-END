import express from "express";
import { diskUpload } from "../../../configs/multer.js";
import {
    getAdvertisements,
    createAdvertisement,
    updateAdvertisement,
    deleteAdvertisement,
} from "../controllers/manager.js";

const adsManagerRouter = express.Router();

adsManagerRouter.get("/api/ad", getAdvertisements);
adsManagerRouter.post("/api/ad", diskUpload.single("image"), createAdvertisement);
adsManagerRouter.put("/api/ad/:id", diskUpload.single("image"), updateAdvertisement);
adsManagerRouter.delete("/ad/:id", deleteAdvertisement);

export default adsManagerRouter;
