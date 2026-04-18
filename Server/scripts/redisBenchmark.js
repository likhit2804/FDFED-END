import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";
import dotenv from "dotenv";
import { performance } from "node:perf_hooks";

import Resident from "../models/resident.js";
import Worker from "../models/workers.js";
import Issue from "../models/issues.js";
import Payment from "../models/payment.js";
import Visitor from "../models/visitors.js";
import CommonSpaces from "../models/commonSpaces.js";
import CommunityManager from "../models/cManager.js";

// For local benchmarking, prefer .env values over stale shell vars.
dotenv.config({ override: true });

// Backward compatibility: support accidental typo key in .env.
if (!process.env.REDIS_URL && process.env.REDIS_URl) {
  process.env.REDIS_URL = process.env.REDIS_URl;
}

const redisModule = await import("../configs/redisClient.js");
const redisClient = redisModule.default;
const { isRedisReady } = redisModule;
const {
  buildBenchmarkCacheKey,
  clearAllCache,
  invalidateCache,
  readCacheKey,
  writeCacheKey,
} = await import("../middleware/cacheMiddleware.js");

const MONGO_URI = process.env.MONGO_URI1 || process.env.MONGO_URI;
const RUNS = Number(process.env.REDIS_BENCHMARK_RUNS || 12);
const WARMUP = Number(process.env.REDIS_BENCHMARK_WARMUP || 2);
const CACHE_TTL_SECONDS = Number(process.env.REDIS_BENCHMARK_TTL || 120);

if (!MONGO_URI) {
  console.error("Missing MONGO_URI1 or MONGO_URI in environment.");
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForRedisReady(timeoutMs = 6000, stepMs = 200) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (isRedisReady()) return true;
    await sleep(stepMs);
  }

  return isRedisReady();
}

async function clearBenchmarkCacheKey(cacheKey) {
  if (redisClient && isRedisReady()) {
    try {
      return await redisClient.del(cacheKey);
    } catch {
      return 0;
    }
  }

  return invalidateCache(cacheKey);
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

function summarize(samples) {
  const avg = samples.reduce((acc, n) => acc + n, 0) / samples.length;
  return {
    avg,
    p50: percentile(samples, 50),
    p95: percentile(samples, 95),
    min: Math.min(...samples),
    max: Math.max(...samples),
    runs: samples.length,
  };
}

async function benchmark(label, fn, { warmup = 2, runs = 10 } = {}) {
  for (let i = 0; i < warmup; i += 1) {
    await fn();
  }

  const samples = [];
  const sourceCounter = {};

  for (let i = 0; i < runs; i += 1) {
    const started = performance.now();
    const result = await fn();
    const elapsed = performance.now() - started;
    samples.push(elapsed);

    if (result?.source) {
      sourceCounter[result.source] = (sourceCounter[result.source] || 0) + 1;
    }
  }

  return {
    label,
    ...summarize(samples),
    sourceCounter,
  };
}

function fmtMs(v) {
  return `${v.toFixed(2)}ms`;
}

function printRow(row) {
  const format = (value) => fmtMs(value).padStart(10);
  console.log(
    `${row.label.padEnd(24)} avg:${format(row.avg)} p50:${format(row.p50)} p95:${format(row.p95)} min:${format(row.min)} max:${format(row.max)}`
  );
}

async function buildDashboardSnapshot(communityId) {
  const [residentCount, workerCount, visitorCount, issueStats, paymentStats, bookingStats] =
    await Promise.all([
      Resident.countDocuments({ community: communityId }),
      Worker.countDocuments({ community: communityId }),
      Visitor.countDocuments({ community: communityId }),
      Issue.aggregate([
        { $match: { community: communityId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
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
                $cond: [{ $in: ["$statusLower", ["completed", "complete"]] }, "$amount", 0],
              },
            },
          },
        },
      ]),
      CommonSpaces.aggregate([
        { $match: { community: communityId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            approved: {
              $sum: {
                $cond: [{ $eq: ["$status", "Approved"] }, 1, 0],
              },
            },
            pending: {
              $sum: {
                $cond: [{ $eq: ["$status", "Pending"] }, 1, 0],
              },
            },
          },
        },
      ]),
    ]);

  return {
    communityId: String(communityId),
    generatedAt: new Date().toISOString(),
    residents: residentCount,
    workers: workerCount,
    visitors: visitorCount,
    issues: issueStats[0] || { total: 0, pending: 0, resolved: 0 },
    payments:
      paymentStats[0] || { total: 0, paidCount: 0, pendingCount: 0, overdueCount: 0, paidAmount: 0 },
    bookings: bookingStats[0] || { total: 0, approved: 0, pending: 0 },
  };
}

async function getSnapshotWithRedis(cacheKey, communityId) {
  const cached = await readCacheKey(cacheKey);

  if (cached) {
    try {
      return { source: "cache", payload: JSON.parse(cached) };
    } catch {
      await clearBenchmarkCacheKey(cacheKey);
    }
  }

  const payload = await buildDashboardSnapshot(communityId);
  await writeCacheKey(cacheKey, payload, CACHE_TTL_SECONDS);
  return { source: "db", payload };
}

async function resolveBenchmarkCommunity() {
  const managers = await CommunityManager.find({
    assignedCommunity: { $exists: true, $ne: null },
  })
    .select("_id assignedCommunity")
    .lean();

  if (!managers.length) {
    return null;
  }

  const [issueCounts, paymentCounts, visitorCounts, residentCounts, workerCounts] = await Promise.all([
    Issue.aggregate([{ $group: { _id: "$community", count: { $sum: 1 } } }]),
    Payment.aggregate([{ $group: { _id: "$community", count: { $sum: 1 } } }]),
    Visitor.aggregate([{ $group: { _id: "$community", count: { $sum: 1 } } }]),
    Resident.aggregate([{ $group: { _id: "$community", count: { $sum: 1 } } }]),
    Worker.aggregate([{ $group: { _id: "$community", count: { $sum: 1 } } }]),
  ]);

  const totalByCommunity = new Map();
  const addCounts = (rows) => {
    for (const row of rows) {
      if (!row?._id) continue;
      const key = String(row._id);
      totalByCommunity.set(key, (totalByCommunity.get(key) || 0) + (row.count || 0));
    }
  };

  addCounts(issueCounts);
  addCounts(paymentCounts);
  addCounts(visitorCounts);
  addCounts(residentCounts);
  addCounts(workerCounts);

  const winner = managers
    .map((manager) => ({
      ...manager,
      totalDocs: totalByCommunity.get(String(manager.assignedCommunity)) || 0,
    }))
    .sort((a, b) => b.totalDocs - a.totalDocs)[0];

  return winner || null;
}

function buildImprovement(base, candidate) {
  const delta = base - candidate;
  const percent = base ? (delta / base) * 100 : 0;
  return {
    deltaMs: Number(delta.toFixed(2)),
    percent: Number(percent.toFixed(2)),
  };
}

async function main() {
  await mongoose.connect(MONGO_URI);

  try {
    const redisOk = await waitForRedisReady();
    if (!redisOk) {
      console.error("Redis is not ready. Start Redis and rerun: npm run benchmark:redis");
      process.exitCode = 1;
      return;
    }

    const target = await resolveBenchmarkCommunity();
    if (!target) {
      console.error("No manager with assigned community found. Seed data first.");
      process.exitCode = 1;
      return;
    }

    const communityId = target.assignedCommunity;
    const cacheKey = buildBenchmarkCacheKey(`manager-dashboard:${communityId}`);

    await clearAllCache();
    await clearBenchmarkCacheKey(cacheKey);

    console.log("Redis Benchmark Target");
    console.log(`communityId=${communityId}`);
    console.log(`managerId=${target._id}`);
    console.log(`estimatedDocs=${target.totalDocs}`);
    console.log("");

    const noCache = await benchmark(
      "DB only (no cache)",
      async () => ({ source: "db", payload: await buildDashboardSnapshot(communityId) }),
      { warmup: WARMUP, runs: RUNS }
    );

    const cacheCold = await benchmark(
      "Redis cold miss",
      async () => {
        await clearBenchmarkCacheKey(cacheKey);
        return getSnapshotWithRedis(cacheKey, communityId);
      },
      { warmup: 1, runs: Math.max(6, Math.floor(RUNS / 2)) }
    );

    await clearBenchmarkCacheKey(cacheKey);
    await getSnapshotWithRedis(cacheKey, communityId);

    const cacheWarm = await benchmark(
      "Redis warm hit",
      async () => getSnapshotWithRedis(cacheKey, communityId),
      { warmup: 1, runs: RUNS }
    );

    console.log("Latency Results");
    printRow(noCache);
    printRow(cacheCold);
    printRow(cacheWarm);
    console.log("");

    const improvementVsNoCache = {
      warmHitAvg: buildImprovement(noCache.avg, cacheWarm.avg),
      warmHitP95: buildImprovement(noCache.p95, cacheWarm.p95),
      coldMissAvg: buildImprovement(noCache.avg, cacheCold.avg),
    };

    console.log("Improvement Summary");
    console.log(
      `Warm-hit avg improvement: ${improvementVsNoCache.warmHitAvg.percent}% (${improvementVsNoCache.warmHitAvg.deltaMs}ms)`
    );
    console.log(
      `Warm-hit p95 improvement: ${improvementVsNoCache.warmHitP95.percent}% (${improvementVsNoCache.warmHitP95.deltaMs}ms)`
    );
    console.log(
      `Cold-miss avg improvement: ${improvementVsNoCache.coldMissAvg.percent}% (${improvementVsNoCache.coldMissAvg.deltaMs}ms)`
    );
    console.log("");

    const diagnostics = {
      redisLikelyNetworkBound: improvementVsNoCache.warmHitAvg.percent < 0,
      note:
        improvementVsNoCache.warmHitAvg.percent < 0
          ? "Redis warm-hit is slower than DB path. Usually caused by high Redis network latency (different region or distant managed Redis)."
          : "Redis warm-hit is faster than DB path.",
    };

    if (diagnostics.redisLikelyNetworkBound) {
      console.log("Diagnostic Note");
      console.log(
        "- Warm-hit is slower than DB. Use Redis in same region/VPC as app, or local Redis for lab benchmarking."
      );
      console.log("");
    }

    const report = {
      generatedAt: new Date().toISOString(),
      benchmarkConfig: {
        runs: RUNS,
        warmup: WARMUP,
        ttlSeconds: CACHE_TTL_SECONDS,
      },
      target: {
        communityId: String(communityId),
        managerId: String(target._id),
        estimatedDocs: target.totalDocs,
      },
      results: {
        noCache,
        cacheCold,
        cacheWarm,
      },
      improvementVsNoCache,
      diagnostics,
    };

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const reportPath = path.resolve(__dirname, "../../project_docs/redis_benchmark_report.json");
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2), "utf8");

    console.log(`Report saved to: ${reportPath}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error("Redis benchmark failed:", err);
  process.exit(1);
});
