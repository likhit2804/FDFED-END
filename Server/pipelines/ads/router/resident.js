import express from "express";
import { getActiveAds } from "../controllers/shared.js";

const adsResidentRouter = express.Router();

// GET /resident/ad
adsResidentRouter.get("/ad", getActiveAds);

export default adsResidentRouter;
