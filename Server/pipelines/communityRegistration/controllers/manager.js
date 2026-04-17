// Community Registration Pipeline — Admin (Manager) Controller
// Sources: controllers/admin/communityController.js + controllers/subscriptionPlanController.js

export {
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
} from "../../../controllers/admin/communityController.js";

// -- Subscription Plans --
export {
    getAllPlans,
    getPlanById,
    createPlan,
    updatePlan,
    deletePlan,
    initializeDefaultPlans,
} from "../../../controllers/admin/subscriptionPlanController.js";


// -- Interest Form / Admin Approval --
export {
    getAllApplications,
    getAllApplicationsJSON,
    approveApplication,
    rejectApplication,
    resendPaymentLink,
    submitInterestForm,
    uploadPhoto,
    getOnboardingDetails,
    createOnboardingPaymentOrder,
    completeOnboardingPayment,
    interestUploadRouter,
} from "../../../controllers/admin/interestForm.js";
