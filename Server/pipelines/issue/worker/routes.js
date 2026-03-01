import express from 'express';
import { startIssue, resolveIssue, misassignedIssue, getWorkerTasks } from '../shared/issueController.js';
const router = express.Router();
router.get('/', getWorkerTasks);
router.patch('/:id/start', startIssue);
router.patch('/:id/resolve', resolveIssue);
router.patch('/:id/misassigned', misassignedIssue);
export default router;