import express from "express";
import {
    getCommunityDetails,
    createSubscriptionPaymentOrder,
    processSubscriptionPayment,
    getSubscriptionHistory,
    getSubscriptionStatus,
    getPaymentsData,
    getSubscriptionPlans,
    changePlan,
} from "../controllers/manager.js";

const subscriptionManagerRouter = express.Router();

subscriptionManagerRouter.get("/community-details", getCommunityDetails);
subscriptionManagerRouter.post("/subscription-payment/order", createSubscriptionPaymentOrder);
subscriptionManagerRouter.post("/subscription-payment", processSubscriptionPayment);
subscriptionManagerRouter.get("/subscription-history", getSubscriptionHistory);
subscriptionManagerRouter.get("/subscription-status", getSubscriptionStatus);
subscriptionManagerRouter.get("/api/payments", getPaymentsData);
subscriptionManagerRouter.get("/subscription-plans", getSubscriptionPlans);
subscriptionManagerRouter.post("/change-plan", changePlan);

export default subscriptionManagerRouter;
