import express from 'express';
import { raiseIssue, getMyIssues, getIssueById } from './controller.js';
const router = express.Router();
router.post('/', raiseIssue);
router.get('/', getMyIssues);
router.get('/:id', getIssueById);
export default router;