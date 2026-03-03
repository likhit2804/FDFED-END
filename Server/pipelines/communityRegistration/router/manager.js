import express from "express";
import multer from "multer";
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
    completeOnboardingPayment,
    interestUploadRouter,
} from "../controllers/manager.js";

const communityRegistrationRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// --------------------------------------------------
// Interest Form / Admin Approval
// --------------------------------------------------
communityRegistrationRouter.get("/api/interests", getAllApplications);
communityRegistrationRouter.get("/interests", getAllApplications);
communityRegistrationRouter.post("/interests/:id/approve", approveApplication);
communityRegistrationRouter.post("/interests/:id/reject", rejectApplication);
communityRegistrationRouter.post("/interests/:id/resend-link", resendPaymentLink);

// Public: onboarding flow
communityRegistrationRouter.get("/onboarding/:token", getOnboardingDetails);
communityRegistrationRouter.post("/onboarding/complete", completeOnboardingPayment);
communityRegistrationRouter.post("/photo-upload", upload.single("photo"), uploadPhoto);
communityRegistrationRouter.use("/interest", interestUploadRouter);

// --------------------------------------------------
// Communities CRUD
// --------------------------------------------------
communityRegistrationRouter.get("/api/communities", requirePermission("read:communities"), getAllCommunities);
communityRegistrationRouter.get("/api/communities/stats", requirePermission("read:communities"), (req, res, next) => next());
communityRegistrationRouter.get("/api/communities/:id/detail", requirePermission("read:communities"), getCommunityDetail);
communityRegistrationRouter.get("/api/communities/:id/delete-preview", requirePermission("write:communities"), getDeletePreview);
communityRegistrationRouter.get("/api/communities/:id", requirePermission("read:communities"), getCommunityById);
communityRegistrationRouter.post("/api/communities", requirePermission("write:communities"), createCommunity);
communityRegistrationRouter.put("/api/communities/:id", requirePermission("write:communities"), updateCommunity);
communityRegistrationRouter.delete("/api/communities/:id", requirePermission("write:communities"), deleteCommunity);

// Community restore
communityRegistrationRouter.post("/api/communities/:backupId/restore", requirePermission("delete:critical"), restoreCommunity);

// Managers list
communityRegistrationRouter.get("/api/managers", requirePermission("read:users"), getManagersList);

// Bulk operations
communityRegistrationRouter.post("/api/communities/bulk-update", requirePermission("write:communities"), bulkUpdateStatus);

// --------------------------------------------------
// Subscription Plans
// --------------------------------------------------
communityRegistrationRouter.get("/api/subscription-plans", getAllPlans);
communityRegistrationRouter.get("/api/subscription-plans/:id", getPlanById);
communityRegistrationRouter.post("/api/subscription-plans", createPlan);
communityRegistrationRouter.put("/api/subscription-plans/:id", updatePlan);
communityRegistrationRouter.delete("/api/subscription-plans/:id", deletePlan);

export default communityRegistrationRouter;
