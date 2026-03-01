import express from 'express';
import { getAllIssues, assignIssue, closeIssue } from '../shared/issueController.js';
const router = express.Router();
router.get('/', getAllIssues);
router.patch('/:id/assign', assignIssue);
router.patch('/:id/close', closeIssue);
export default router;