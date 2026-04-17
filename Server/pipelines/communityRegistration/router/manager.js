import express from "express";
import { memoryUpload } from "../../../configs/multer.js";
import { requirePermission } from "../../../middleware/rbac.js";
import {
    getAllCommunities,
    getCommunityById,
    getCommunityDetail,
    createCommunity,
    updateCommunity,
    getDeletePreview,
    deleteCommunity,
    getManagersList,
    bulkUpdateStatus,
    restoreCommunity,
    getAllPlans,
    getPlanById,
    createPlan,
    updatePlan,
    deletePlan,
    getAllApplications,
    approveApplication,
    rejectApplication,
    resendPaymentLink,
    uploadPhoto,
    getOnboardingDetails,
    createOnboardingPaymentOrder,
    completeOnboardingPayment,
    interestUploadRouter,
} from "../controllers/manager.js";

const communityRegistrationRouter = express.Router();

// --------------------------------------------------
// Interest Form / Admin Approval
// --------------------------------------------------

/**
 * @swagger
 * /admin/api/interests:
 *   get:
 *     summary: Get all community manager applications
 *     tags: [Admin - Applications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all applications with status
 */
communityRegistrationRouter.get("/api/interests", getAllApplications);

/**
 * @swagger
 * /admin/api/interests/{id}/approve:
 *   post:
 *     summary: Approve an application (sends onboarding payment link)
 *     tags: [Admin - Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Application approved, payment link emailed
 *       500:
 *         description: Error during approval
 */
communityRegistrationRouter.post("/api/interests/:id/approve", approveApplication);

/**
 * @swagger
 * /admin/api/interests/{id}/reject:
 *   post:
 *     summary: Reject an application (with reason)
 *     tags: [Admin - Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [reason]
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Application rejected
 *       400:
 *         description: Missing rejection reason
 */
communityRegistrationRouter.post("/api/interests/:id/reject", rejectApplication);

/**
 * @swagger
 * /admin/api/interests/{id}/resend-link:
 *   post:
 *     summary: Resend payment link to approved applicant
 *     tags: [Admin - Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment link resent
 */
communityRegistrationRouter.post("/api/interests/:id/resend-link", resendPaymentLink);

// Public: onboarding flow
communityRegistrationRouter.get("/onboarding/:token", getOnboardingDetails);
communityRegistrationRouter.post("/onboarding/create-order", createOnboardingPaymentOrder);
communityRegistrationRouter.post("/onboarding/complete", completeOnboardingPayment);
communityRegistrationRouter.post("/photo-upload", memoryUpload.single("photo"), uploadPhoto);
communityRegistrationRouter.use("/interest", interestUploadRouter);

// --------------------------------------------------
// Communities CRUD
// --------------------------------------------------

/**
 * @swagger
 * /admin/api/communities:
 *   get:
 *     summary: Get all communities
 *     tags: [Admin - Communities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of communities
 *   post:
 *     summary: Create a new community
 *     tags: [Admin - Communities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Community created
 */
communityRegistrationRouter.get("/api/communities", requirePermission("read:communities"), getAllCommunities);
communityRegistrationRouter.get("/api/communities/stats", requirePermission("read:communities"), (req, res, next) => next());

/**
 * @swagger
 * /admin/api/communities/{id}/detail:
 *   get:
 *     summary: Get community full details
 *     tags: [Admin - Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Community details with blocks, flats, residents
 */
communityRegistrationRouter.get("/api/communities/:id/detail", requirePermission("read:communities"), getCommunityDetail);
communityRegistrationRouter.get("/api/communities/:id/delete-preview", requirePermission("write:communities"), getDeletePreview);

/**
 * @swagger
 * /admin/api/communities/{id}:
 *   get:
 *     summary: Get community by ID
 *     tags: [Admin - Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Community data
 *   put:
 *     summary: Update a community
 *     tags: [Admin - Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Community updated
 *   delete:
 *     summary: Delete a community
 *     tags: [Admin - Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Community deleted
 */
communityRegistrationRouter.get("/api/communities/:id", requirePermission("read:communities"), getCommunityById);
communityRegistrationRouter.post("/api/communities", requirePermission("write:communities"), createCommunity);
communityRegistrationRouter.put("/api/communities/:id", requirePermission("write:communities"), updateCommunity);
communityRegistrationRouter.delete("/api/communities/:id", requirePermission("write:communities"), deleteCommunity);

/**
 * @swagger
 * /admin/api/communities/{backupId}/restore:
 *   post:
 *     summary: Restore a deleted community from backup
 *     tags: [Admin - Communities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: backupId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Community restored
 */
communityRegistrationRouter.post("/api/communities/:backupId/restore", requirePermission("delete:critical"), restoreCommunity);

/**
 * @swagger
 * /admin/api/managers:
 *   get:
 *     summary: Get list of all community managers
 *     tags: [Admin - Communities]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of managers
 */
communityRegistrationRouter.get("/api/managers", requirePermission("read:users"), getManagersList);

communityRegistrationRouter.post("/api/communities/bulk-update", requirePermission("write:communities"), bulkUpdateStatus);

// --------------------------------------------------
// Subscription Plans
// --------------------------------------------------

/**
 * @swagger
 * /admin/api/subscription-plans:
 *   get:
 *     summary: Get all subscription plans
 *     tags: [Admin - Plans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of plans
 *   post:
 *     summary: Create a new subscription plan
 *     tags: [Admin - Plans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Plan created
 */
communityRegistrationRouter.get("/api/subscription-plans", getAllPlans);
communityRegistrationRouter.get("/api/subscription-plans/:id", getPlanById);
communityRegistrationRouter.post("/api/subscription-plans", createPlan);

/**
 * @swagger
 * /admin/api/subscription-plans/{id}:
 *   put:
 *     summary: Update a subscription plan
 *     tags: [Admin - Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plan updated
 *   delete:
 *     summary: Delete a subscription plan
 *     tags: [Admin - Plans]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plan deleted
 */
communityRegistrationRouter.put("/api/subscription-plans/:id", updatePlan);
communityRegistrationRouter.delete("/api/subscription-plans/:id", deletePlan);

export default communityRegistrationRouter;

