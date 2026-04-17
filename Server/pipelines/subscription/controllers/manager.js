import Community from "../../../models/communities.js";
import CommunityManager from "../../../models/cManager.js";
import Payment from "../../../models/payment.js";
import SubscriptionPlan from "../../../models/subscriptionPlan.js";
import { sendError, sendSuccess } from "../../shared/helpers.js";
import { createCommunitySubscription } from "../../../crud/index.js";
import { generateTransactionId } from "../../../utils/idGenerator.js";
import { calculatePlanEndDate } from "../utils/helpers.js";
import {
    createRazorpayOrder,
    getRazorpayPublicConfig,
    verifyRazorpaySignature,
} from "../../../services/razorpayService.js";

export const getCommunityDetails = async (req, res) => {
    try {
        const community = req.community;
        res.json({
            name: community.name,
            subscriptionPlan: community.subscriptionPlan,
            subscriptionStatus: community.subscriptionStatus,
            planStartDate: community.planStartDate,
            planEndDate: community.planEndDate,
            subscriptionHistory: community.subscriptionHistory
        });
    } catch (error) {
        console.error("Error fetching community details:", error);
        return sendError(res, 500, "Failed to fetch community details", error);
    }
};

export const createSubscriptionPaymentOrder = async (req, res) => {
    try {
        const { subscriptionPlan } = req.body;

        if (!subscriptionPlan) {
            return sendError(res, 400, "Subscription plan is required");
        }

        const community = req.community;
        const planDoc = await SubscriptionPlan.findOne({
            planKey: subscriptionPlan,
            isActive: true,
        }).lean();

        if (!planDoc) {
            return sendError(res, 400, "Invalid or inactive subscription plan");
        }

        const capacity = planDoc.maxResidents;
        if (capacity !== null && typeof capacity === "number") {
            if (community.totalMembers && community.totalMembers > capacity) {
                return res.status(400).json({
                    success: false,
                    message:
                        "Selected plan cannot support current number of residents. Please choose a higher plan.",
                    code: "PLAN_CAPACITY_EXCEEDED",
                    currentResidents: community.totalMembers,
                    maxAllowed: capacity,
                });
            }
        }

        const order = await createRazorpayOrder({
            amountInPaise: Math.round(planDoc.price * 100),
            receipt: `sub_${community._id}_${Date.now()}`.slice(0, 40),
            notes: {
                flow: "subscription",
                communityId: String(community._id),
                planKey: planDoc.planKey,
                communityName: community.name || "",
            },
        });

        const { keyId } = getRazorpayPublicConfig();

        return res.json({
            success: true,
            data: {
                key: keyId,
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                plan: {
                    key: planDoc.planKey,
                    name: planDoc.name,
                    price: planDoc.price,
                    duration: planDoc.duration,
                },
            },
        });
    } catch (error) {
        console.error("Subscription order error:", error);
        return sendError(res, 500, "Failed to create subscription order", error);
    }
};

export const processSubscriptionPayment = async (req, res) => {
    try {
        const {
            subscriptionPlan,
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            isRenewal,
        } = req.body;

        if (!subscriptionPlan || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
            return sendError(res, 400, "Missing required payment information");
        }

        const managerId = req.user.id;
        const community = req.community;

        // Fetch plan details from database
        const planDoc = await SubscriptionPlan.findOne({
            planKey: subscriptionPlan,
            isActive: true
        });

        if (!planDoc) {
            return sendError(res, 400, "Invalid or inactive subscription plan");
        }

        // Enforce resident-based plan capacity
        const capacity = planDoc.maxResidents;
        if (capacity !== null && typeof capacity === "number") {
            if (community.totalMembers && community.totalMembers > capacity) {
                return res.status(400).json({
                    success: false,
                    message: "Selected plan cannot support current number of residents. Please choose a higher plan.",
                    code: "PLAN_CAPACITY_EXCEEDED",
                    currentResidents: community.totalMembers,
                    maxAllowed: capacity,
                });
            }
        }

        const isSignatureValid = verifyRazorpaySignature({
            orderId: razorpayOrderId,
            paymentId: razorpayPaymentId,
            signature: razorpaySignature,
        });

        if (!isSignatureValid) {
            return sendError(res, 400, "Payment signature verification failed");
        }

        // Calculate plan end date based on plan duration
        const startDate = new Date();
        const endDate = calculatePlanEndDate(startDate, planDoc.duration);

        // Create subscription payment record
        const subscriptionPayment = {
            transactionId: razorpayPaymentId || generateTransactionId("TXN"),
            planName: planDoc.name,
            planType: planDoc.planKey,
            amount: planDoc.price,
            paymentMethod: "razorpay",
            gateway: "razorpay",
            gatewayOrderId: razorpayOrderId,
            gatewayPaymentId: razorpayPaymentId,
            paymentDate: startDate,
            planStartDate: startDate,
            planEndDate: endDate,
            duration: planDoc.duration,
            status: "completed",
            isRenewal: isRenewal || false,
            processedBy: managerId,
            metadata: {
                userAgent: req.get("User-Agent"),
                ipAddress: req.ip || req.connection.remoteAddress,
                receipt: `sub_${community._id}`,
            },
        };

        // Update community subscription details
        community.subscriptionPlan = planDoc.planKey;
        community.subscriptionStatus = "active";
        community.planStartDate = startDate;
        community.planEndDate = endDate;

        if (!community.subscriptionHistory) {
            community.subscriptionHistory = [];
        }
        community.subscriptionHistory.push(subscriptionPayment);

        await community.save();

        // Create a record in CommunitySubscription collection
        const subscriptionRecord = {
            communityId: community._id,
            transactionId: subscriptionPayment.transactionId,
            planName: subscriptionPayment.planName,
            planType: subscriptionPayment.planType,
            amount: subscriptionPayment.amount,
            paymentMethod: subscriptionPayment.paymentMethod,
            paymentDate: subscriptionPayment.paymentDate,
            planStartDate: subscriptionPayment.planStartDate,
            planEndDate: subscriptionPayment.planEndDate,
            duration: subscriptionPayment.duration,
            status: subscriptionPayment.status,
            isRenewal: subscriptionPayment.isRenewal,
            metadata: subscriptionPayment.metadata,
        };

        await createCommunitySubscription(subscriptionRecord);

        res.status(200).json({
            success: true,
            message: "Subscription payment processed successfully",
            transactionId: subscriptionPayment.transactionId,
            planName: subscriptionPayment.planName,
            amount: subscriptionPayment.amount,
            planEndDate: subscriptionPayment.planEndDate,
            subscriptionStatus: community.subscriptionStatus,
        });
    } catch (error) {
        console.error("Subscription payment error:", error);
        return sendError(res, 500, "Payment processing failed", error);
    }
};

export const getSubscriptionHistory = async (req, res) => {
    try {
        const community = req.community;

        const sortedHistory = community.subscriptionHistory
            ? community.subscriptionHistory.sort(
                (a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)
            )
            : [];

        res.json({
            success: true,
            history: sortedHistory,
            totalPayments: sortedHistory.length,
        });
    } catch (error) {
        console.error("Error fetching subscription history:", error);
        return sendError(res, 500, "Failed to fetch subscription history", error);
    }
};

export const getSubscriptionStatus = async (req, res) => {
    try {
        const community = req.community;

        // Check if subscription is expired
        const now = new Date();
        const isExpired =
            community.planEndDate && new Date(community.planEndDate) < now;

        if (isExpired && community.subscriptionStatus === "active") {
            community.subscriptionStatus = "expired";
            await community.save();
        }

        // Calculate days until expiry
        let daysUntilExpiry = null;
        if (community.planEndDate) {
            daysUntilExpiry = Math.ceil(
                (new Date(community.planEndDate) - now) / (1000 * 60 * 60 * 24)
            );
        }

        // Fetch plan details from database
        let planDetails = null;
        if (community.subscriptionPlan) {
            const planDoc = await SubscriptionPlan.findOne({
                planKey: community.subscriptionPlan,
                isActive: true
            }).lean();

            if (planDoc) {
                planDetails = {
                    planName: planDoc.name,
                    planPrice: planDoc.price,
                    planDuration: planDoc.duration,
                    planMaxResidents: planDoc.maxResidents,
                    planFeatures: planDoc.features
                };
            }
        }

        res.json({
            success: true,
            community: {
                _id: community._id,
                name: community.name,
                subscriptionPlan: community.subscriptionPlan,
                subscriptionStatus: community.subscriptionStatus,
                planStartDate: community.planStartDate,
                planEndDate: community.planEndDate,
                totalMembers: community.totalMembers,
                daysUntilExpiry: daysUntilExpiry,
                isExpired: isExpired,
                isExpiringSoon:
                    daysUntilExpiry && daysUntilExpiry <= 7 && daysUntilExpiry > 0,
                ...planDetails
            },
        });
    } catch (error) {
        console.error("Error fetching subscription status:", error);
        return sendError(res, 500, "Failed to fetch subscription status", error);
    }
};

export const getPaymentsData = async (req, res) => {
    try {
        const community = req.community;

        const [payments, paymentSummary] = await Promise.all([
            Payment.find({ community: community._id })
                .select(
                    "title sender receiver amount penalty paymentDeadline paymentDate paymentMethod status remarks ID belongTo belongToId createdAt"
                )
                .populate("sender", "email residentFirstname residentLastname uCode flatNo name")
                .populate("receiver", "email name")
                .sort({ paymentDeadline: -1, createdAt: -1 })
                .lean(),
            Payment.aggregate([
                { $match: { community: community._id } },
                {
                    $project: {
                        normalizedStatus: { $toLower: { $ifNull: ["$status", ""] } },
                        amount: { $ifNull: ["$amount", 0] },
                    },
                },
                {
                    $group: {
                        _id: "$normalizedStatus",
                        count: { $sum: 1 },
                        totalAmount: { $sum: "$amount" },
                    },
                },
            ]),
        ]);

        const paymentSummaryMap = paymentSummary.reduce((acc, item) => {
            acc[item._id] = item;
            return acc;
        }, {});

        const paidPayments =
            (paymentSummaryMap.completed?.count || 0) + (paymentSummaryMap.complete?.count || 0);
        const pendingPayments = paymentSummaryMap.pending?.count || 0;
        const overduePayments = paymentSummaryMap.overdue?.count || 0;

        const paidAmount =
            (paymentSummaryMap.completed?.totalAmount || 0) +
            (paymentSummaryMap.complete?.totalAmount || 0);
        const pendingAmount = paymentSummaryMap.pending?.totalAmount || 0;
        const overdueAmount = paymentSummaryMap.overdue?.totalAmount || 0;

        const totalTransactions = paymentSummary.reduce(
            (sum, entry) => sum + (entry.count || 0),
            0
        );

        return res.json({
            success: true,
            payments,
            community: {
                name: community.name,
                subscriptionPlan: community.subscriptionPlan,
                subscriptionStatus: community.subscriptionStatus,
                planEndDate: community.planEndDate,
            },
            stats: {
                totalTransactions,
                paidCount: paidPayments,
                pendingCount: pendingPayments,
                overdueCount: overduePayments,
                paidAmount,
                pendingAmount,
                overdueAmount,
            },
        });
    } catch (error) {
        console.error("Error fetching payments api:", error);
        return sendError(res, 500, "Failed to fetch payments", error);
    }
};

export const getSubscriptionPlans = async (req, res) => {
    try {
        // Fetch active plans from database
        const activePlans = await SubscriptionPlan.find({ isActive: true })
            .sort({ displayOrder: 1 })
            .lean();

        // Transform to client-friendly format
        const planDetails = activePlans.reduce((acc, plan) => {
            acc[plan.planKey] = {
                name: plan.name,
                price: plan.price,
                maxResidents: plan.maxResidents,
                features: plan.features,
                duration: plan.duration,
            };
            return acc;
        }, {});

        // Also create planPrices map for backward compatibility
        const planPrices = activePlans.reduce((acc, plan) => {
            acc[plan.planKey] = plan.price;
            return acc;
        }, {});

        res.json({
            success: true,
            plans: planDetails,
            planPrices,
        });
    } catch (error) {
        console.error("Error fetching subscription plans:", error);
        return sendError(res, 500, "Failed to fetch subscription plans", error);
    }
};

export const changePlan = async (req, res) => {
    try {
        const { newPlan, changeOption, paymentMethod } = req.body;

        if (!newPlan || !changeOption) {
            return sendError(res, 400, "Missing required fields: newPlan and changeOption");
        }

        const managerId = req.user.id;
        const community = req.community;

        // Fetch plan details from database
        const newPlanDoc = await SubscriptionPlan.findOne({
            planKey: newPlan,
            isActive: true
        });

        if (!newPlanDoc) {
            return sendError(res, 400, "Invalid or inactive plan selected");
        }

        const currentPlan = community.subscriptionPlan || null;

        let currentPlanDoc = null;
        if (currentPlan) {
            currentPlanDoc = await SubscriptionPlan.findOne({
                planKey: currentPlan,
                isActive: true
            });
        }

        const currentPrice = currentPlanDoc ? currentPlanDoc.price : 0;
        const newPrice = newPlanDoc.price;

        if (currentPlan === newPlan) {
            return sendError(res, 400, "You are already on this plan");
        }

        // Validate capacity for new plan
        if (newPlanDoc.maxResidents !== null && community.totalMembers > newPlanDoc.maxResidents) {
            return res.status(400).json({
                success: false,
                message: `Selected plan cannot support ${community.totalMembers} residents. Max allowed: ${newPlanDoc.maxResidents}`,
                code: "PLAN_CAPACITY_EXCEEDED",
            });
        }

        const now = new Date();
        const planEndDate = new Date(community.planEndDate);
        const isExpired = planEndDate < now;

        if (changeOption === "immediate") {
            const priceDifference = newPrice - currentPrice;

            if (paymentMethod && priceDifference > 0) {
                const transactionId = generateTransactionId("PLAN_CHANGE");

                const endDate = calculatePlanEndDate(now, newPlanDoc.duration);

                const paymentRecord = {
                    transactionId,
                    planName: `${newPlanDoc.name} (Upgrade)`,
                    planType: newPlan,
                    amount: priceDifference,
                    paymentMethod,
                    paymentDate: now,
                    planStartDate: now,
                    planEndDate: endDate,
                    duration: newPlanDoc.duration,
                    status: "completed",
                    isRenewal: false,
                    isPlanChange: true,
                    changeType: "immediate",
                    previousPlan: currentPlan,
                    processedBy: managerId,
                    metadata: {
                        userAgent: req.get("User-Agent"),
                        ipAddress: req.ip || req.connection.remoteAddress,
                    },
                };

                community.subscriptionPlan = newPlan;
                community.subscriptionStatus = "active";
                community.planStartDate = now;
                community.planEndDate = endDate;

                if (!community.subscriptionHistory) {
                    community.subscriptionHistory = [];
                }
                community.subscriptionHistory.push(paymentRecord);

                await community.save();

                // Create CommunitySubscription record
                await createCommunitySubscription({
                    communityId: community._id,
                    managerId: managerId,
                    transactionId: paymentRecord.transactionId,
                    planName: paymentRecord.planName,
                    planType: paymentRecord.planType,
                    amount: paymentRecord.amount,
                    paymentMethod: paymentRecord.paymentMethod,
                    paymentDate: paymentRecord.paymentDate,
                    planStartDate: paymentRecord.planStartDate,
                    planEndDate: paymentRecord.planEndDate,
                    duration: paymentRecord.duration,
                    status: paymentRecord.status,
                    isRenewal: paymentRecord.isRenewal,
                    metadata: {
                        ...paymentRecord.metadata,
                        isPlanChange: true,
                        previousPlan: currentPlan,
                    },
                });

                res.json({
                    success: true,
                    message: "Plan changed successfully! Your new plan is now active.",
                    transactionId,
                    newPlan,
                    amountCharged: priceDifference,
                    planEndDate: community.planEndDate,
                });
            } else if (priceDifference <= 0) {
                const endDate = calculatePlanEndDate(now, newPlanDoc.duration);

                community.subscriptionPlan = newPlan;
                community.planStartDate = now;
                community.planEndDate = endDate;

                if (!community.subscriptionHistory) {
                    community.subscriptionHistory = [];
                }
                community.subscriptionHistory.push({
                    transactionId: generateTransactionId("PLAN_CHANGE"),
                    planName: `${newPlanDoc.name} (Downgrade)`,
                    planType: newPlan,
                    amount: 0,
                    paymentMethod: "No Payment Required",
                    paymentDate: now,
                    planStartDate: now,
                    planEndDate: endDate,
                    duration: newPlanDoc.duration,
                    status: "completed",
                    isRenewal: false,
                    isPlanChange: true,
                    changeType: "immediate",
                    previousPlan: currentPlan,
                    processedBy: managerId,
                });

                await community.save();

                res.json({
                    success: true,
                    message: "Plan changed successfully! Your new plan is now active.",
                    newPlan,
                    amountCharged: 0,
                    planEndDate: community.planEndDate,
                });
            } else {
                return sendError(res, 400, "Payment method required for plan upgrade");
            }
        } else if (changeOption === "nextCycle") {
            const nextCycleDate = isExpired ? now : planEndDate;

            community.pendingPlanChange = {
                newPlan,
                effectiveDate: nextCycleDate,
                requestedDate: now,
                requestedBy: managerId,
                status: "pending",
            };

            await community.save();

            res.json({
                success: true,
                message: `Plan change scheduled for ${nextCycleDate.toLocaleDateString()}. Your current plan will remain active until then.`,
                newPlan,
                effectiveDate: nextCycleDate,
                currentPlanEndDate: community.planEndDate,
            });
        } else {
            return sendError(res, 400, "Invalid change option");
        }
    } catch (error) {
        console.error("Plan change error:", error);
        return sendError(res, 500, "Failed to process plan change", error);
    }
};
