import express from 'express';
import { createSpace, updateSpace, deleteSpace, getAllBookings } from './controller.js';
const router = express.Router();
router.post('/', createSpace);
router.put('/:id', updateSpace);
router.delete('/:id', deleteSpace);
router.get('/bookings', getAllBookings);
export default router;
