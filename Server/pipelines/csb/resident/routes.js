import express from 'express';
import { getSpaces, bookSpace, getMyBookings, cancelBooking } from './controller.js';
const router = express.Router();
router.get('/', getSpaces);
router.post('/book', bookSpace);
router.get('/my-bookings', getMyBookings);
router.delete('/:id', cancelBooking);
export default router;