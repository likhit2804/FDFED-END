import Community from "../../models/communities.js";
import CommunityManager from "../../models/cManager.js";
import Payment from "../../models/payment.js";
import { sendError, sendSuccess } from "./helpers.js";
import { createCommunitySubscription } from "../../crud/index.js";

// Helper: plan capacity (max residents); null = unlimited
const PLAN_CAPACITY = {
    basic: 50,
    standard: 200,
    premium: null,
};

// Helper functions for plan pricing
function getPlanPrice(planType) {
    const planPrices = {
        basic: 999,
        standard: 1999,
        premium: 3999,
    };
    return planPrices[planType] || 0;
}

function getSubscriptionPlanName(planType) {
    const planNames = {
        basic: "Basic Plan",
        standard: "Standard Plan",
        premium: "Premium Plan",
    };
    return planNames[planType] || "Unknown Plan";
}

export const getCommunityDetails = async (req, res) => {
    try {
        const managerId = req.user.id;
        const manager = await CommunityManager.findById(managerId);

        if (!manager) {
            return sendError(res, 404, "Community manager not found");
        }

        const community = await Community.findById(
            manager.assignedCommunity
        ).select(
            "name subscriptionPlan subscriptionStatus planStartDate planEndDate subscriptionHistory"
        );

        if (!community) {
            return sendError(res, 404, "Community not found");
        }

        res.json(community);
    } catch (error) {
        console.error("Error fetching community details:", error);
        return sendError(res, 500, "Failed to fetch community details", error);
    }
};

export const processSubscriptionPayment = async (req, res) => {
    try {
        const {
            communityId,
            subscriptionPlan,
            amount,
            paymentMethod,
            planDuration,
            transactionId,
            paymentDate,
            isRenewal,
            cardMeta,
        } = req.body;

        if (!subscriptionPlan || !amount || !paymentMethod) {
            return sendError(res, 400, "Missing required payment information");
        }

        const managerId = req.user.id;
        const manager = await CommunityManager.findById(managerId);

        if (!manager) {
            return sendError(res, 404, "Community manager not found");
        }

        const community = await Community.findById(communityId);
        if (!community) {
            return sendError(res, 404, "Community not found");
        }

        // Enforce resident-based plan capacity
        const capacity = PLAN_CAPACITY[subscriptionPlan];
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

        // Calculate plan end date
        const startDate = new Date(paymentDate);
        const endDate = new Date(startDate);

        if (planDuration === "monthly") {
            endDate.setMonth(endDate.getMonth() + 1);
        } else if (planDuration === "yearly") {
            endDate.setFullYear(endDate.getFullYear() + 1);
        }

        // Create subscription payment record
        const subscriptionPayment = {
            transactionId:
                transactionId ||
                `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            planName: getSubscriptionPlanName(subscriptionPlan),
            planType: subscriptionPlan,
            amount: amount,
            paymentMethod: paymentMethod,
            paymentDate: new Date(paymentDate),
            planStartDate: startDate,
            planEndDate: endDate,
            duration: planDuration,
            status: "completed",
            isRenewal: isRenewal || false,
            processedBy: managerId,
            metadata: {
                userAgent: req.get("User-Agent"),
                ipAddress: req.ip || req.connection.remoteAddress,
                card: paymentMethod === "card" && cardMeta ? {
                    brand: cardMeta.brand,
                    last4: cardMeta.last4,
                    expiry: cardMeta.expiry,
                    name: cardMeta.name,
                } : undefined,
            },
        };

        // Update community subscription details
        community.subscriptionPlan = subscriptionPlan;
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
        const managerId = req.user.id;
        const manager = await CommunityManager.findById(managerId);

        if (!manager) {
            return sendError(res, 404, "Community manager not found");
        }

        const community = await Community.findById(
            manager.assignedCommunity
        ).select("subscriptionHistory");

        if (!community) {
            return sendError(res, 404, "Community not found");
        }

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
        const managerId = req.user.id;
        const manager = await CommunityManager.findById(managerId);

        if (!manager) {
            return sendError(res, 404, "Community manager not found");
        }

        const community = await Community.findById(
            manager.assignedCommunity
        ).select(
            "_id name subscriptionPlan subscriptionStatus planStartDate planEndDate totalMembers"
        );

        if (!community) {
            return sendError(res, 404, "Community not found");
        }

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
            },
        });
    } catch (error) {
        console.error("Error fetching subscription status:", error);
        return sendError(res, 500, "Failed to fetch subscription status", error);
    }
};

export const getPaymentsData = async (req, res) => {
    try {
        const managerId = req.user && req.user.id;
        const manager = await CommunityManager.findById(managerId);

        if (!manager) {
            return sendError(res, 404, "Community manager not found");
        }

        const community = await Community.findById(manager.assignedCommunity)
            .select(
                "name subscriptionPlan subscriptionStatus planStartDate planEndDate subscriptionHistory"
            )
            .lean();

        if (!community) {
            return sendError(res, 404, "Community not found");
        }

        const payments = await Payment.find({ community: community._id })
            .populate("community")
            .populate("sender")
            .populate("receiver")
            .lean();

        const totalTransactions = payments.length;

        const toLower = (v) => (v || "").toString().toLowerCase();

        const paidPayments = payments.filter(
            (p) =>
                toLower(p.status) === "completed" || toLower(p.status) === "complete"
        ).length;
        const pendingPayments = payments.filter(
            (p) => toLower(p.status) === "pending"
        ).length;
        const overduePayments = payments.filter(
            (p) => toLower(p.status) === "overdue"
        ).length;

        const paidAmount = payments
            .filter(
                (p) =>
                    toLower(p.status) === "completed" || toLower(p.status) === "complete"
            )
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        const pendingAmount = payments
            .filter((p) => toLower(p.status) === "pending")
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

        const overdueAmount = payments
            .filter((p) => toLower(p.status) === "overdue")
            .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

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
        const planPrices = {
            basic: 999,
            standard: 1999,
            premium: 3999,
        };

        const planDetails = {
            basic: {
                name: "Basic Plan",
                price: 999,
                maxResidents: PLAN_CAPACITY.basic,
                features: [
                    "Up to 50 residents",
                    "Basic payment tracking",
                    "Email support",
                ],
                duration: "monthly",
            },
            standard: {
                name: "Standard Plan",
                price: 1999,
                maxResidents: PLAN_CAPACITY.standard,
                features: [
                    "Up to 200 residents",
                    "Advanced payment tracking",
                    "SMS notifications",
                    "Priority support",
                ],
                duration: "monthly",
            },
            premium: {
                name: "Premium Plan",
                price: 3999,
                maxResidents: PLAN_CAPACITY.premium,
                features: [
                    "Unlimited residents",
                    "Full payment suite",
                    "SMS + Email notifications",
                    "Dedicated support",
                    "Analytics dashboard",
                ],
                duration: "monthly",
            },
        };

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
        const manager = await CommunityManager.findById(managerId);

        if (!manager) {
            return sendError(res, 404, "Community manager not found");
        }

        const community = await Community.findById(manager.assignedCommunity);
        if (!community) {
            return sendError(res, 404, "Community not found");
        }

        const planPrices = {
            basic: 999,
            standard: 1999,
            premium: 3999,
        };

        const currentPlan = community.subscriptionPlan || "basic";
        const currentPrice = planPrices[currentPlan];
        const newPrice = planPrices[newPlan];

        if (!newPrice) {
            return sendError(res, 400, "Invalid plan selected");
        }

        if (currentPlan === newPlan) {
            return sendError(res, 400, "You are already on this plan");
        }

        const now = new Date();
        const planEndDate = new Date(community.planEndDate);
        const isExpired = planEndDate < now;

        if (changeOption === "immediate") {
            const priceDifference = newPrice - currentPrice;

            if (paymentMethod && priceDifference > 0) {
                const transactionId = `PLAN_CHANGE_${Date.now()}_${Math.random()
                    .toString(36)
                    .substr(2, 9)}`;

                const paymentRecord = {
                    transactionId,
                    planName: `${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)
                        } Plan (Upgrade)`,
                    planType: newPlan,
                    amount: priceDifference,
                    paymentMethod,
                    paymentDate: now,
                    planStartDate: now,
                    planEndDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                    duration: "monthly",
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
                community.planEndDate = new Date(
                    now.getTime() + 30 * 24 * 60 * 60 * 1000
                );

                if (!community.subscriptionHistory) {
                    community.subscriptionHistory = [];
                }
                community.subscriptionHistory.push(paymentRecord);

                await community.save();

                res.json({
                    success: true,
                    message: "Plan changed successfully! Your new plan is now active.",
                    transactionId,
                    newPlan,
                    amountCharged: priceDifference,
                    planEndDate: community.planEndDate,
                });
            } else if (priceDifference <= 0) {
                community.subscriptionPlan = newPlan;
                community.planStartDate = now;
                community.planEndDate = new Date(
                    now.getTime() + 30 * 24 * 60 * 60 * 1000
                );

                if (!community.subscriptionHistory) {
                    community.subscriptionHistory = [];
                }
                community.subscriptionHistory.push({
                    transactionId: `PLAN_CHANGE_${Date.now()}_${Math.random()
                        .toString(36)
                        .substr(2, 9)}`,
                    planName: `${newPlan.charAt(0).toUpperCase() + newPlan.slice(1)
                        } Plan (Downgrade)`,
                    planType: newPlan,
                    amount: 0,
                    paymentMethod: "No Payment Required",
                    paymentDate: now,
                    planStartDate: now,
                    planEndDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
                    duration: "monthly",
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
