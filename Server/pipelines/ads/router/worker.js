import express from "express";
import { getActiveAds } from "../controllers/shared.js";

const adsWorkerRouter = express.Router();

// GET /worker/ad
adsWorkerRouter.get("/ad", getActiveAds);

export default adsWorkerRouter;
