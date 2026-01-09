import express from "express";
import path from 'path';
import multer from 'multer';
import {
  getAllApplications,
  getAllApplicationsJSON,
  approveApplication,
  rejectApplication
} from '../controllers/interestForm.js';
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
  getManagersList,
  getCommunityStats,
  bulkUpdateStatus,
} from '../controllers/adminController.js';

const AdminRouter = express.Router();

// Multer config for admin image uploads (Cloudinary handled in controller)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Interest routes (kept as-is)
AdminRouter.get('/api/interests', getAllApplications);
AdminRouter.get('/interests', getAllApplications);
AdminRouter.post('/interests/:id/approve', approveApplication);
AdminRouter.post('/interests/:id/reject', rejectApplication);

// Admin dashboard & overview routes (delegated to controller)
AdminRouter.get('/api/dashboard', getDashboard);
AdminRouter.get('/api/communities/overview', getCommunitiesOverview);
// Communities CRUD
AdminRouter.get('/api/communities', getAllCommunities);
AdminRouter.get('/api/communities/stats', getCommunityStats);
AdminRouter.get('/api/communities/:id', getCommunityById);
AdminRouter.post('/api/communities', createCommunity);
AdminRouter.put('/api/communities/:id', updateCommunity);
AdminRouter.delete('/api/communities/:id', deleteCommunity);

AdminRouter.get('/api/community-managers', getCommunityManagers);
AdminRouter.get('/api/payments', getPayments);

// Managers list (lightweight)
AdminRouter.get('/api/managers', getManagersList);

// Bulk operations
AdminRouter.post('/api/communities/bulk-update', bulkUpdateStatus);

// Profile routes
AdminRouter.get('/api/profile', getProfile);
AdminRouter.post('/api/profile/update', upload.single('image'), updateProfile);
AdminRouter.post('/api/profile/change-password', changePassword);

export default AdminRouter;