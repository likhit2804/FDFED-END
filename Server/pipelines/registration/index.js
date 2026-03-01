import express from 'express';
import residentRoutes from './resident/routes.js';
const router = express.Router();
router.use('/', residentRoutes);
export * from './interest/index.js';
export { router as registrationRouter };
export default router;
