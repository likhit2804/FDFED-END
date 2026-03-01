import express from 'express';
import { createPreApproval, getMyPreApprovals, deletePreApproval } from './controller.js';
const router = express.Router();
router.post('/', createPreApproval);
router.get('/', getMyPreApprovals);
router.delete('/:id', deletePreApproval);
export default router;