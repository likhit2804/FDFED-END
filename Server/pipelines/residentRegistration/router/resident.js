import express from "express";
import { requestOtp, verifyOtp, completeRegistration } from "../controllers/resident.js";

const registrationResidentRouter = express.Router();

// POST /resident/register/request-otp
registrationResidentRouter.post("/register/request-otp", requestOtp);
// POST /resident/register/verify-otp
registrationResidentRouter.post("/register/verify-otp", verifyOtp);
// POST /resident/register/complete
registrationResidentRouter.post("/register/complete", completeRegistration);

export default registrationResidentRouter;
