import express from 'express';
import { memoryUpload } from '../configs/multer.js';
import {
  submitInterestForm,
  showInterestForm,
} from '../controllers/admin/interestForm.js';

const interestRouter = express.Router();

// Public routes — files go straight to Cloudinary via memoryUpload
interestRouter.get('/', showInterestForm);
interestRouter.post('/submit', memoryUpload.array('photos', 5), submitInterestForm);

export default interestRouter;