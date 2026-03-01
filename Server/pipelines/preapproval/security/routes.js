import express from 'express';
import { verifyPreApproval, getPreApprovals } from './controller.js';
const router = express.Router();
router.get('/', getPreApprovals);
router.post('/verify', verifyPreApproval);
export default router;