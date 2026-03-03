import express from "express";
import path from 'path';
import { memoryUpload } from '../configs/multer.js';
import { requirePermission } from '../middleware/rbac.js';
import { validateCommunity, validateObjectId, validatePasswordChange } from '../middleware/validation.js';

import {
  getDashboard,
  getCommunitiesOverview,
  getCommunityManagers,
  getPayments,
  getProfile,
  updateProfile,
  changePassword,
  getAllCommunities,
  getCommunityById,
  createCommunity,
  updateCommunity,
  deleteCommunity,
  getDeletePreview,
  getManagersList,
  getCommunityStats,
  bulkUpdateStatus,
  restoreCommunity,
  getCommunityDetail,
  getAdminActivity,
  getFailedLogins,
} from '../controllers/admin/index.js';
import communityRegistrationRouter from '../pipelines/communityRegistration/router/manager.js';
import { getSettings, updateSettings } from "../controllers/admin/settingsController.js";

const AdminRouter = express.Router();



// Admin dashboard & overview routes (delegated to controller)
AdminRouter.get('/api/dashboard', getDashboard);
AdminRouter.get('/api/communities/overview', getCommunitiesOverview);
// Community registration + subscription plans (delegated to pipeline)
AdminRouter.use('/', communityRegistrationRouter);

// Admin activity & security monitoring
AdminRouter.get('/api/admin/activity', requirePermission('read:analytics'), getAdminActivity);
AdminRouter.get('/api/admin/security/failed-logins', requirePermission('read:analytics'), getFailedLogins);

// Profile routes
AdminRouter.get('/api/profile', getProfile);
AdminRouter.post('/api/profile/update', memoryUpload.single('image'), updateProfile);
AdminRouter.post('/api/profile/change-password', validatePasswordChange, changePassword);

// System Settings
AdminRouter.get('/api/settings', getSettings);
AdminRouter.post('/api/settings/update', updateSettings);

export default AdminRouter;
