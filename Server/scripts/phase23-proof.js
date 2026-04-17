import mongoose from "mongoose";
import dotenv from "dotenv";
import { performance } from "node:perf_hooks";

import Resident from "../models/resident.js";
import Worker from "../models/workers.js";
import Issue from "../models/issues.js";
import CommonSpaces from "../models/commonSpaces.js";
import Payment from "../models/payment.js";
import Visitor from "../models/visitors.js";
import Ad from "../models/Ad.js";
import CommunityManager from "../models/cManager.js";
import "../models/Notifications.js";
import "../models/communities.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI1 || process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("Missing MONGO_URI1 / MONGO_URI in environment.");
  process.exit(1);
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function summarize(samples) {
  return {
    avg: samples.reduce((a, b) => a + b, 0) / samples.length,
    p50: percentile(samples, 50),
    p95: percentile(samples, 95),
    min: Math.min(...samples),
    max: Math.max(...samples),
  };
}

async function benchmark(label, fn, { warmup = 2, runs = 8 } = {}) {
  for (let i = 0; i < warmup; i += 1) {
    await fn();
  }

  const samples = [];
  for (let i = 0; i < runs; i += 1) {
    const t0 = performance.now();
    await fn();
    samples.push(performance.now() - t0);
  }

  return { label, ...summarize(samples) };
}

function printRow(row) {
  const n = (v) => v.toFixed(2).padStart(9);
  console.log(
    `${row.label.padEnd(30)} avg:${n(row.avg)}  p50:${n(row.p50)}  p95:${n(row.p95)}  min:${n(row.min)}  max:${n(row.max)}`
  );
}

async function dashboardOldFlow(communityId, managerId) {
  const [residents, workers, issues, bookings, payments, visitors, advertisements] =
    await Promise.all([
      Resident.find({ community: communityId }).populate("notifications").lean(),
      Worker.find({ community: communityId }).lean(),
      Issue.find({ community: communityId })
        .populate("resident", "residentFirstname residentLastname email")
        .lean(),
      CommonSpaces.find({ community: communityId })
        .populate("bookedBy", "residentFirstname residentLastname email")
        .lean(),
      Payment.find({ community: communityId }).lean(),
      Visitor.find({ community: communityId }).lean(),
      Ad.find({ community: communityId }).select("title status startDate endDate").lean(),
    ]);

  await CommunityManager.findById(managerId).populate("notifications").lean();

  const paidPayments = payments.filter((p) => p.status === "Completed").length;
  const pendingPayments = payments.filter((p) => p.status === "Pending").length;
  const overduePayments = payments.filter((p) => p.status === "Overdue").length;

  const paidAmount = payments
    .filter((p) => p.status === "Completed")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const pendingAmount = payments
    .filter((p) => p.status === "Pending")
    .reduce((sum, p) => sum + (p.amount || 0), 0);
  const overdueAmount = payments
    .filter((p) => p.status === "Overdue")
    .reduce((sum, p) => sum + (p.amount || 0), 0);

  const pendingIssues = issues.filter(
    (issue) => issue.status === "Pending" || issue.status === "Assigned"
  ).length;
  const resolvedIssues = issues.filter((issue) => issue.status === "Resolved").length;
  const urgentIssues = issues.filter(
    (issue) => issue.priority === "High" && issue.status !== "Resolved"
  ).length;

  const recentIssues = [...issues]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);
  const recentBookings = [...bookings]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const now = new Date();
  const activeAds = advertisements.filter((ad) => {
    const startDate = new Date(ad.startDate);
    const endDate = new Date(ad.endDate);
    return startDate <= now && now <= endDate;
  }).length;
  const pendingAds = advertisements.filter((ad) => new Date(ad.startDate) > now).length;
  const expiredAds = advertisements.filter((ad) => new Date(ad.endDate) < now).length;

  return {
    totalResidents: residents.length,
    totalWorkers: workers.length,
    totalVisitors: visitors.length,
    totalBookings: bookings.length,
    totalPayments: payments.length,
    paidPayments,
    pendingPayments,
    overduePayments,
    paidAmount,
    pendingAmount,
    overdueAmount,
    pendingIssues,
    resolvedIssues,
    urgentIssues,
    recentIssues: recentIssues.length,
    recentBookings: recentBookings.length,
    activeAds,
    pendingAds,
    expiredAds,
  };
}

async function dashboardNewFlow(communityId, managerId) {
  const now = new Date();
  const [
    totalResidents,
    totalWorkers,
    totalVisitors,
    issueDashboardData,
    bookingDashboardData,
    paymentDashboardData,
    adsDashboardData,
  ] = await Promise.all([
    Resident.countDocuments({ community: communityId }),
    Worker.countDocuments({ community: communityId }),
    Visitor.countDocuments({ community: communityId }),
    Issue.aggregate([
      { $match: { community: communityId } },
      {
        $facet: {
          counts: [
            {
              $group: {
                _id: null,
                pending: {
                  $sum: {
                    $cond: [{ $in: ["$status", ["Pending", "Assigned"]] }, 1, 0],
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
            { $unwind: { path: "$residentDoc", preserveNullAndEmptyArrays: true } },
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
      { $match: { community: communityId } },
      {
        $facet: {
          counts: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                pending: {
                  $sum: { $cond: [{ $eq: ["$status", "Pending"] }, 1, 0] },
                },
                approved: {
                  $sum: { $cond: [{ $eq: ["$status", "Approved"] }, 1, 0] },
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
            { $unwind: { path: "$bookedByDoc", preserveNullAndEmptyArrays: true } },
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
      { $match: { community: communityId } },
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
            $sum: { $cond: [{ $eq: ["$statusLower", "pending"] }, 1, 0] },
          },
          overdueCount: {
            $sum: { $cond: [{ $eq: ["$statusLower", "overdue"] }, 1, 0] },
          },
          paidAmount: {
            $sum: {
              $cond: [{ $in: ["$statusLower", ["completed", "complete"]] }, "$amount", 0],
            },
          },
          pendingAmount: {
            $sum: { $cond: [{ $eq: ["$statusLower", "pending"] }, "$amount", 0] },
          },
          overdueAmount: {
            $sum: { $cond: [{ $eq: ["$statusLower", "overdue"] }, "$amount", 0] },
          },
        },
      },
    ]),
    Ad.aggregate([
      { $match: { community: communityId } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          active: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lte: ["$startDate", now] },
                    { $gte: ["$endDate", now] },
                  ],
                },
                1,
                0,
              ],
            },
          },
          pending: {
            $sum: { $cond: [{ $gt: ["$startDate", now] }, 1, 0] },
          },
          expired: {
            $sum: { $cond: [{ $lt: ["$endDate", now] }, 1, 0] },
          },
        },
      },
    ]),
  ]);

  await CommunityManager.findById(managerId)
    .select("notifications")
    .populate({
      path: "notifications",
      select: "type title message read referenceId referenceType createdAt",
      options: { sort: { createdAt: -1 } },
    })
    .lean();

  const issueCounts = issueDashboardData?.[0]?.counts?.[0] || {};
  const bookingCounts = bookingDashboardData?.[0]?.counts?.[0] || {};
  const paymentCounts = paymentDashboardData?.[0] || {};
  const adCounts = adsDashboardData?.[0] || {};
  const recentIssues = issueDashboardData?.[0]?.recent || [];
  const recentBookings = bookingDashboardData?.[0]?.recent || [];

  return {
    totalResidents,
    totalWorkers,
    totalVisitors,
    totalBookings: bookingCounts.total || 0,
    bookingPending: bookingCounts.pending || 0,
    bookingApproved: bookingCounts.approved || 0,
    totalPayments: paymentCounts.total || 0,
    paidPayments: paymentCounts.paidCount || 0,
    pendingPayments: paymentCounts.pendingCount || 0,
    overduePayments: paymentCounts.overdueCount || 0,
    paidAmount: paymentCounts.paidAmount || 0,
    pendingAmount: paymentCounts.pendingAmount || 0,
    overdueAmount: paymentCounts.overdueAmount || 0,
    pendingIssues: issueCounts.pending || 0,
    resolvedIssues: issueCounts.resolved || 0,
    urgentIssues: issueCounts.urgent || 0,
    recentIssues: recentIssues.length,
    recentBookings: recentBookings.length,
    totalAds: adCounts.total || 0,
    activeAds: adCounts.active || 0,
    pendingAds: adCounts.pending || 0,
    expiredAds: adCounts.expired || 0,
  };
}

async function paymentsOldFlow(communityId) {
  const payments = await Payment.find({ community: communityId })
    .populate("community")
    .populate("sender")
    .populate("receiver")
    .lean();

  const toLower = (v) => (v || "").toString().toLowerCase();

  const paidPayments = payments.filter(
    (p) => toLower(p.status) === "completed" || toLower(p.status) === "complete"
  ).length;
  const pendingPayments = payments.filter((p) => toLower(p.status) === "pending").length;
  const overduePayments = payments.filter((p) => toLower(p.status) === "overdue").length;

  const paidAmount = payments
    .filter((p) => toLower(p.status) === "completed" || toLower(p.status) === "complete")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const pendingAmount = payments
    .filter((p) => toLower(p.status) === "pending")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const overdueAmount = payments
    .filter((p) => toLower(p.status) === "overdue")
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return {
    count: payments.length,
    paidPayments,
    pendingPayments,
    overduePayments,
    paidAmount,
    pendingAmount,
    overdueAmount,
  };
}

async function paymentsNewFlow(communityId) {
  const [payments, paymentSummary] = await Promise.all([
    Payment.find({ community: communityId })
      .select(
        "title sender receiver amount penalty paymentDeadline paymentDate paymentMethod status remarks ID belongTo belongToId createdAt"
      )
      .populate("sender", "email residentFirstname residentLastname uCode flatNo name")
      .populate("receiver", "email name")
      .sort({ paymentDeadline: -1, createdAt: -1 })
      .lean(),
    Payment.aggregate([
      { $match: { community: communityId } },
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

  const map = paymentSummary.reduce((acc, item) => {
    acc[item._id] = item;
    return acc;
  }, {});

  return {
    count: payments.length,
    paidPayments: (map.completed?.count || 0) + (map.complete?.count || 0),
    pendingPayments: map.pending?.count || 0,
    overduePayments: map.overdue?.count || 0,
    paidAmount: (map.completed?.totalAmount || 0) + (map.complete?.totalAmount || 0),
    pendingAmount: map.pending?.totalAmount || 0,
    overdueAmount: map.overdue?.totalAmount || 0,
  };
}

async function explainQuick(communityId) {
  const oldIssue = await Issue.find({ community: communityId }).explain("executionStats");
  const newIssue = await Issue.find({ community: communityId })
    .sort({ createdAt: -1 })
    .limit(5)
    .explain("executionStats");

  const oldBooking = await CommonSpaces.find({ community: communityId }).explain("executionStats");
  const newBooking = await CommonSpaces.find({ community: communityId })
    .sort({ createdAt: -1 })
    .limit(5)
    .explain("executionStats");

  const getStages = (plan) => {
    const stages = [];
    let cursor = plan;
    while (cursor) {
      if (cursor.stage) stages.push(cursor.stage);
      cursor = cursor.inputStage || (cursor.inputStages && cursor.inputStages[0]);
    }
    return stages;
  };

  return {
    issue: {
      oldReturned: oldIssue.executionStats.nReturned,
      oldExamined: oldIssue.executionStats.totalDocsExamined,
      newReturned: newIssue.executionStats.nReturned,
      newExamined: newIssue.executionStats.totalDocsExamined,
      oldStages: getStages(oldIssue.queryPlanner.winningPlan).join(" > "),
      newStages: getStages(newIssue.queryPlanner.winningPlan).join(" > "),
    },
    booking: {
      oldReturned: oldBooking.executionStats.nReturned,
      oldExamined: oldBooking.executionStats.totalDocsExamined,
      newReturned: newBooking.executionStats.nReturned,
      newExamined: newBooking.executionStats.totalDocsExamined,
      oldStages: getStages(oldBooking.queryPlanner.winningPlan).join(" > "),
      newStages: getStages(newBooking.queryPlanner.winningPlan).join(" > "),
    },
  };
}

async function run() {
  await mongoose.connect(MONGO_URI);

  try {
    const managers = await CommunityManager.find({
      assignedCommunity: { $exists: true, $ne: null },
    })
      .select("_id assignedCommunity")
      .lean();

    if (!managers.length) {
      console.error("No manager/community data found for benchmark.");
      return;
    }

    const [issueCounts, paymentCounts, bookingCounts, visitorCounts, residentCounts, workerCounts] =
      await Promise.all([
        Issue.aggregate([{ $group: { _id: "$community", c: { $sum: 1 } } }]),
        Payment.aggregate([{ $group: { _id: "$community", c: { $sum: 1 } } }]),
        CommonSpaces.aggregate([{ $group: { _id: "$community", c: { $sum: 1 } } }]),
        Visitor.aggregate([{ $group: { _id: "$community", c: { $sum: 1 } } }]),
        Resident.aggregate([{ $group: { _id: "$community", c: { $sum: 1 } } }]),
        Worker.aggregate([{ $group: { _id: "$community", c: { $sum: 1 } } }]),
      ]);

    const totals = new Map();
    const addCounts = (arr) => {
      for (const row of arr) {
        if (!row?._id) continue;
        const key = row._id.toString();
        totals.set(key, (totals.get(key) || 0) + (row.c || 0));
      }
    };

    addCounts(issueCounts);
    addCounts(paymentCounts);
    addCounts(bookingCounts);
    addCounts(visitorCounts);
    addCounts(residentCounts);
    addCounts(workerCounts);

    const managerWithMostData = managers
      .map((m) => ({
        ...m,
        totalDocs: totals.get(m.assignedCommunity.toString()) || 0,
      }))
      .sort((a, b) => b.totalDocs - a.totalDocs)[0];

    const communityId = managerWithMostData.assignedCommunity;
    const managerId = managerWithMostData._id;

    console.log("Benchmarking with:");
    console.log(`communityId=${communityId}`);
    console.log(`managerId=${managerId}\n`);
    console.log(`estimatedTotalDocsForCommunity=${managerWithMostData.totalDocs}\n`);

    const dashboardOld = await benchmark(
      "Dashboard OLD flow",
      () => dashboardOldFlow(communityId, managerId)
    );
    const dashboardNew = await benchmark(
      "Dashboard NEW flow",
      () => dashboardNewFlow(communityId, managerId)
    );

    const paymentsOld = await benchmark(
      "Payments OLD flow",
      () => paymentsOldFlow(communityId)
    );
    const paymentsNew = await benchmark(
      "Payments NEW flow",
      () => paymentsNewFlow(communityId)
    );

    printRow(dashboardOld);
    printRow(dashboardNew);
    printRow(paymentsOld);
    printRow(paymentsNew);

    const explain = await explainQuick(communityId);
    console.log("\nExplain delta (docs examined / returned):");
    console.log(
      `Issue old: examined=${explain.issue.oldExamined}, returned=${explain.issue.oldReturned}`
    );
    console.log(
      `Issue new: examined=${explain.issue.newExamined}, returned=${explain.issue.newReturned}`
    );
    console.log(`Issue old plan: ${explain.issue.oldStages}`);
    console.log(`Issue new plan: ${explain.issue.newStages}`);
    console.log(
      `Booking old: examined=${explain.booking.oldExamined}, returned=${explain.booking.oldReturned}`
    );
    console.log(
      `Booking new: examined=${explain.booking.newExamined}, returned=${explain.booking.newReturned}`
    );
    console.log(`Booking old plan: ${explain.booking.oldStages}`);
    console.log(`Booking new plan: ${explain.booking.newStages}`);
  } finally {
    await mongoose.disconnect();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
