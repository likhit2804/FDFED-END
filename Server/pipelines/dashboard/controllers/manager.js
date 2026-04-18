import Resident from "../../../models/resident.js";
import Worker from "../../../models/workers.js";
import Issue from "../../../models/issues.js";
import CommonSpaces from "../../../models/commonSpaces.js";
import Payment from "../../../models/payment.js";
import visitor from "../../../models/visitors.js";
import CommunityManager from "../../../models/cManager.js";
import mongoose from "mongoose";
import { sendError } from "../../shared/helpers.js";

export const getDashboardData = async (req, res) => {
    try {
        const communityId = req.user.community;
        const communityMatchId =
            typeof communityId === "string" && mongoose.Types.ObjectId.isValid(communityId)
                ? new mongoose.Types.ObjectId(communityId)
                : communityId;

        const [
            totalResidents,
            totalWorkers,
            totalAdvisitorsCount,
            issueDashboardData,
            bookingDashboardData,
            paymentDashboardData,
            notificationsDoc,
        ] = await Promise.all([
            Resident.countDocuments({ community: communityMatchId }),
            Worker.countDocuments({ community: communityMatchId }),
            visitor.countDocuments({ community: communityMatchId }),
            Issue.aggregate([
                { $match: { community: communityMatchId } },
                {
                    $facet: {
                        counts: [
                            {
                                $group: {
                                    _id: null,
                                    pending: {
                                        $sum: {
                                            $cond: [
                                                { $in: ["$status", ["Pending", "Assigned"]] },
                                                1,
                                                0,
                                            ],
                                        },
                                    },
                                    resolved: {
                                        $sum: {
                                            $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0],
                                        },
                                    },
                                    urgent: {
                                        $sum: {
                                            $cond: [
                                                {
                                                    $and: [
                                                        { $eq: ["$priority", "High"] },
                                                        { $ne: ["$status", "Resolved"] },
                                                    ],
                                                },
                                                1,
                                                0,
                                            ],
                                        },
                                    },
                                },
                            },
                        ],
                        recent: [
                            { $sort: { createdAt: -1 } },
                            { $limit: 5 },
                            {
                                $lookup: {
                                    from: "residents",
                                    localField: "resident",
                                    foreignField: "_id",
                                    as: "residentDoc",
                                },
                            },
                            {
                                $unwind: {
                                    path: "$residentDoc",
                                    preserveNullAndEmptyArrays: true,
                                },
                            },
                            {
                                $project: {
                                    _id: 1,
                                    title: 1,
                                    status: 1,
                                    priority: 1,
                                    createdAt: 1,
                                    residentFirstname: "$residentDoc.residentFirstname",
                                    residentLastname: "$residentDoc.residentLastname",
                                },
                            },
                        ],
                    },
                },
            ]),
            CommonSpaces.aggregate([
                { $match: { community: communityMatchId } },
                {
                    $facet: {
                        counts: [
                            {
                                $group: {
                                    _id: null,
                                    total: { $sum: 1 },
                                    pending: {
                                        $sum: {
                                            $cond: [{ $eq: ["$status", "Pending"] }, 1, 0],
                                        },
                                    },
                                    approved: {
                                        $sum: {
                                            $cond: [{ $eq: ["$status", "Approved"] }, 1, 0],
                                        },
                                    },
                                },
                            },
                        ],
                        recent: [
                            { $sort: { createdAt: -1 } },
                            { $limit: 5 },
                            {
                                $lookup: {
                                    from: "residents",
                                    localField: "bookedBy",
                                    foreignField: "_id",
                                    as: "bookedByDoc",
                                },
                            },
                            {
                                $unwind: {
                                    path: "$bookedByDoc",
                                    preserveNullAndEmptyArrays: true,
                                },
                            },
                            {
                                $project: {
                                    _id: 1,
                                    name: 1,
                                    status: 1,
                                    Date: 1,
                                    createdAt: 1,
                                    residentFirstname: "$bookedByDoc.residentFirstname",
                                    residentLastname: "$bookedByDoc.residentLastname",
                                },
                            },
                        ],
                    },
                },
            ]),
            Payment.aggregate([
                { $match: { community: communityMatchId } },
                {
                    $project: {
                        statusLower: { $toLower: { $ifNull: ["$status", ""] } },
                        amount: { $ifNull: ["$amount", 0] },
                    },
                },
                {
                    $group: {
                        _id: null,
                        total: { $sum: 1 },
                        paidCount: {
                            $sum: {
                                $cond: [{ $in: ["$statusLower", ["completed", "complete"]] }, 1, 0],
                            },
                        },
                        pendingCount: {
                            $sum: {
                                $cond: [{ $eq: ["$statusLower", "pending"] }, 1, 0],
                            },
                        },
                        overdueCount: {
                            $sum: {
                                $cond: [{ $eq: ["$statusLower", "overdue"] }, 1, 0],
                            },
                        },
                        paidAmount: {
                            $sum: {
                                $cond: [
                                    { $in: ["$statusLower", ["completed", "complete"]] },
                                    "$amount",
                                    0,
                                ],
                            },
                        },
                        pendingAmount: {
                            $sum: {
                                $cond: [{ $eq: ["$statusLower", "pending"] }, "$amount", 0],
                            },
                        },
                        overdueAmount: {
                            $sum: {
                                $cond: [{ $eq: ["$statusLower", "overdue"] }, "$amount", 0],
                            },
                        },
                    },
                },
            ]),
            CommunityManager.findById(req.user.id)
                .select("notifications")
                .populate({
                    path: "notifications",
                    select: "type title message read referenceId referenceType createdAt",
                    options: { sort: { createdAt: -1 } },
                })
                .lean(),
        ]);

        const issueCounts = issueDashboardData?.[0]?.counts?.[0] || {};
        const bookingCounts = bookingDashboardData?.[0]?.counts?.[0] || {};
        const paymentCounts = paymentDashboardData?.[0] || {};
        const recentIssuesRaw = issueDashboardData?.[0]?.recent || [];
        const recentBookingsRaw = bookingDashboardData?.[0]?.recent || [];

        const paidPayments = paymentCounts.paidCount || 0;
        const pendingPayments = paymentCounts.pendingCount || 0;
        const overduePayments = paymentCounts.overdueCount || 0;
        const paidAmount = paymentCounts.paidAmount || 0;
        const pendingAmount = paymentCounts.pendingAmount || 0;
        const overdueAmount = paymentCounts.overdueAmount || 0;

        const recentIssues = recentIssuesRaw.map((issue) => ({
                _id: issue._id,
                title: issue.title || "No Title",
                status: issue.status,
                priority: issue.priority,
                resident:
                    issue.residentFirstname || issue.residentLastname
                        ? `${issue.residentFirstname || ""} ${issue.residentLastname || ""}`.trim()
                    : "Unknown",
                createdAt: issue.createdAt,
            }));

        const recentBookings = recentBookingsRaw.map((booking) => ({
                _id: booking._id,
                name: booking.name || "No Name",
                status: booking.status,
                date: booking.Date,
                bookedBy:
                    booking.residentFirstname || booking.residentLastname
                        ? `${booking.residentFirstname || ""} ${booking.residentLastname || ""}`.trim()
                    : "Unknown",
                createdAt: booking.createdAt,
            }));

        const revenueData = [
            { name: "Paid", value: paidAmount, count: paidPayments },
            { name: "Pending", value: pendingAmount, count: pendingPayments },
            { name: "Overdue", value: overdueAmount, count: overduePayments },
        ];

        // Prepare response
        res.status(200).json({
            success: true,
            data: {
                notifications: notificationsDoc?.notifications || [],
                summary: {
                    totalResidents,
                    totalWorkers,
                    totalVisitors: totalAdvisitorsCount,
                    totalActiveBookings: bookingCounts.total || 0,
                },
                issues: {
                    pending: issueCounts.pending || 0,
                    resolved: issueCounts.resolved || 0,
                    urgent: issueCounts.urgent || 0,
                    recent: recentIssues,
                },
                bookings: {
                    total: bookingCounts.total || 0,
                    pending: bookingCounts.pending || 0,
                    approved: bookingCounts.approved || 0,
                    recent: recentBookings,
                },
                payments: {
                    total: paymentCounts.total || 0,
                    paid: paidPayments,
                    pending: pendingPayments,
                    overdue: overduePayments,
                    revenueData,
                    amounts: {
                        paid: paidAmount,
                        pending: pendingAmount,
                        overdue: overdueAmount,
                    },
                },
                visitors: {
                    today: totalAdvisitorsCount,
                },
            },
            message: "Dashboard data fetched successfully",
        });
    } catch (error) {
        console.error("Error fetching dashboard data:", error);
        return sendError(res, 500, "Failed to fetch dashboard data", error);
    }
};
