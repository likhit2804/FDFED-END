import express from "express";
import { getActiveAds } from "../controllers/shared.js";

const adsSecurityRouter = express.Router();

// GET /security/ad
adsSecurityRouter.get("/ad", getActiveAds);

export default adsSecurityRouter;
