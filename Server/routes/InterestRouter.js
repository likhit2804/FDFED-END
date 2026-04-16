import express from 'express';
import { memoryUpload } from '../configs/multer.js';
import {
  submitInterestForm,
  showInterestForm,
  getOnboardingDetails,
  createOnboardingPaymentOrder,
  completeOnboardingPayment,
} from '../controllers/admin/interestForm.js';

const interestRouter = express.Router();

// Public routes — files go straight to Cloudinary via memoryUpload
interestRouter.get('/', showInterestForm);
interestRouter.post('/submit', memoryUpload.array('photos', 5), submitInterestForm);

// Public onboarding routes (accessed by applicants, not admins)
interestRouter.get('/onboarding/:token', getOnboardingDetails);
interestRouter.post('/onboarding/create-order', createOnboardingPaymentOrder);
interestRouter.post('/onboarding/complete', completeOnboardingPayment);

export default interestRouter;
