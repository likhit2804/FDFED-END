import express from 'express';
import { addVisitor, getVisitors, updateVisitorStatus, getVisitorById } from './controller.js';
const router = express.Router();
router.post('/', addVisitor);
router.get('/', getVisitors);
router.get('/:id', getVisitorById);
router.patch('/:id', updateVisitorStatus);
export default router;