import express from 'express';
import { registerResident, verifyOtp, resendOtp } from './controller.js';
const router = express.Router();
router.post('/register', registerResident);
router.post('/verify-otp', verifyOtp);
router.post('/resend-otp', resendOtp);
export default router;