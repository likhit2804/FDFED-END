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



/**
 * @swagger
 * /admin/api/dashboard:
 *   get:
 *     summary: Get admin dashboard summary
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats (users, communities, payments, recent activity)
 */
AdminRouter.get('/api/dashboard', getDashboard);

/**
 * @swagger
 * /admin/api/communities/overview:
 *   get:
 *     summary: Get communities overview stats
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Communities count, distribution, status breakdown
 */
AdminRouter.get('/api/communities/overview', getCommunitiesOverview);

// Community registration + subscription plans (delegated to pipeline)
AdminRouter.use('/', communityRegistrationRouter);

/**
 * @swagger
 * /admin/api/admin/activity:
 *   get:
 *     summary: Get admin activity log
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *     responses:
 *       200:
 *         description: List of recent admin actions
 *       403:
 *         description: Insufficient permissions
 */
AdminRouter.get('/api/admin/activity', requirePermission('read:analytics'), getAdminActivity);

/**
 * @swagger
 * /admin/api/admin/security/failed-logins:
 *   get:
 *     summary: Get failed login attempts
 *     tags: [Admin - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: hours
 *         schema:
 *           type: integer
 *           default: 24
 *     responses:
 *       200:
 *         description: List of failed login attempts
 */
AdminRouter.get('/api/admin/security/failed-logins', requirePermission('read:analytics'), getFailedLogins);

/**
 * @swagger
 * /admin/api/profile:
 *   get:
 *     summary: Get admin profile
 *     tags: [Admin - Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin profile data
 */
AdminRouter.get('/api/profile', getProfile);

/**
 * @swagger
 * /admin/api/profile/update:
 *   post:
 *     summary: Update admin profile
 *     tags: [Admin - Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated
 */
AdminRouter.post('/api/profile/update', memoryUpload.single('image'), updateProfile);

/**
 * @swagger
 * /admin/api/profile/change-password:
 *   post:
 *     summary: Change admin password
 *     tags: [Admin - Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 *       401:
 *         description: Current password incorrect
 */
AdminRouter.post('/api/profile/change-password', validatePasswordChange, changePassword);

/**
 * @swagger
 * /admin/api/settings:
 *   get:
 *     summary: Get system settings
 *     tags: [Admin - Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current system settings
 */
AdminRouter.get('/api/settings', getSettings);

/**
 * @swagger
 * /admin/api/settings/update:
 *   post:
 *     summary: Update system settings
 *     tags: [Admin - Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Settings updated
 */
AdminRouter.post('/api/settings/update', updateSettings);


export default AdminRouter;
