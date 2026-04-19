import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";

import Community from "../models/communities.js";
import Security from "../models/security.js";
import Visitor from "../models/visitors.js";
import Resident from "../models/resident.js";
import Worker from "../models/workers.js";
import Payment from "../models/payment.js";
import Issue from "../models/issues.js";
import CommonSpaces from "../models/commonSpaces.js";

dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env"),
});

const MONGO_URI = process.env.MONGO_URI1;
if (!MONGO_URI) {
  console.error("MONGO_URI1 is not defined in Server/.env");
  process.exit(1);
}

const MIN_SECURITY = Number(process.env.SECURITY_MIN_PER_COMMUNITY || 2);
const MAX_SECURITY = Number(process.env.SECURITY_MAX_PER_COMMUNITY || 3);
const APPLY = process.argv.includes("--apply");
const PASSWORD_PLAIN =
  process.env.LITE_SEED_PASSWORD ||
  process.env.MEGA_SEED_PASSWORD ||
  process.env.MEGA_SEED_SHARED_PASSWORD ||
  "MegaCommunity@123";

const PRIORITY_EMAILS = new Set(
  [process.env.MEGA_SEED_EMAIL, "adityakanumuri02@gmail.com"]
    .filter(Boolean)
    .map((email) => String(email).trim().toLowerCase()),
);

const toIso = (value) => (value ? new Date(value).toISOString() : null);

function pickKeepSet(securityDocs = [], maxCount = MAX_SECURITY) {
  const sorted = [...securityDocs].sort((a, b) => {
    const aPriority = PRIORITY_EMAILS.has(String(a.email || "").toLowerCase()) ? 0 : 1;
    const bPriority = PRIORITY_EMAILS.has(String(b.email || "").toLowerCase()) ? 0 : 1;
    if (aPriority !== bPriority) return aPriority - bPriority;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return sorted.slice(0, Math.min(sorted.length, maxCount));
}

function createSecurityPayload(community, index, hashedPassword) {
  const code = String(community.communityCode || community._id).replace(/[^a-zA-Z0-9]/g, "").toLowerCase();
  const serial = String(index + 1).padStart(2, "0");

  return {
    name: `Balanced Security ${serial}`,
    email: `balanced.security.${code}.${serial}@urbanease.local`,
    password: hashedPassword,
    contact: `94${String(10000000 + index).slice(-8)}`,
    address: `${community.name || "Community"} Gate Office`,
    community: community._id,
    Shift: index % 2 === 0 ? "Day" : "Night",
    workplace: index % 2 === 0 ? "Main Gate" : "Side Gate",
    joiningDate: new Date(),
  };
}

async function getCoreCounts() {
  const [communities, residents, workers, securities, visitors, payments, issues, bookings] =
    await Promise.all([
      Community.countDocuments({}),
      Resident.countDocuments({}),
      Worker.countDocuments({}),
      Security.countDocuments({}),
      Visitor.countDocuments({}),
      Payment.countDocuments({}),
      Issue.countDocuments({}),
      CommonSpaces.countDocuments({}),
    ]);

  return { communities, residents, workers, securities, visitors, payments, issues, bookings };
}

async function countOrphanVisitorAddedBy() {
  const result = await Visitor.aggregate([
    { $match: { addedBy: { $ne: null } } },
    {
      $lookup: {
        from: "securities",
        localField: "addedBy",
        foreignField: "_id",
        as: "securityDoc",
      },
    },
    {
      $match: {
        $expr: { $eq: [{ $size: "$securityDoc" }, 0] },
      },
    },
    { $count: "orphans" },
  ]);

  return result[0]?.orphans || 0;
}

async function run() {
  await mongoose.connect(MONGO_URI);
  const startedAt = new Date();

  const beforeCounts = await getCoreCounts();
  const beforeOrphans = await countOrphanVisitorAddedBy();
  const hashedPassword = await bcrypt.hash(PASSWORD_PLAIN, 10);

  const communities = await Community.find({}).select("_id name communityCode").lean();
  const report = {
    mode: APPLY ? "apply" : "dry-run",
    policy: { min: MIN_SECURITY, max: MAX_SECURITY },
    startedAt: toIso(startedAt),
    totals: {
      communitiesScanned: communities.length,
      communitiesModified: 0,
      securityCreated: 0,
      securityDeleted: 0,
      visitorRefsReassigned: 0,
    },
    communityChanges: [],
    beforeCounts,
    beforeOrphanVisitorAddedBy: beforeOrphans,
  };

  for (const community of communities) {
    const securityDocs = await Security.find({ community: community._id })
      .select("_id email createdAt")
      .sort({ createdAt: 1 })
      .lean();

    const originalCount = securityDocs.length;
    const keep = pickKeepSet(securityDocs, MAX_SECURITY);
    const keepIds = new Set(keep.map((doc) => String(doc._id)));
    const deleteCandidates = securityDocs.filter((doc) => !keepIds.has(String(doc._id)));

    const addNeeded = originalCount < MIN_SECURITY ? MIN_SECURITY - originalCount : 0;
    const shouldDelete = originalCount > MAX_SECURITY ? deleteCandidates.length : 0;

    if (!addNeeded && !shouldDelete) {
      continue;
    }

    const change = {
      communityId: String(community._id),
      communityName: community.name,
      beforeSecurityCount: originalCount,
      addNeeded,
      deleteNeeded: shouldDelete,
      createdIds: [],
      deletedIds: [],
      reassignedVisitors: 0,
    };

    let replacementSecurityId = keep[0]?._id || null;
    const createdSecurityIds = [];

    if (APPLY && addNeeded > 0) {
      for (let i = 0; i < addNeeded; i += 1) {
        const payload = createSecurityPayload(community, i, hashedPassword);
        const created = await Security.create(payload);
        createdSecurityIds.push(created._id);
        change.createdIds.push(String(created._id));
      }
      replacementSecurityId = replacementSecurityId || createdSecurityIds[0] || null;
      report.totals.securityCreated += createdSecurityIds.length;
    }

    if (APPLY && shouldDelete > 0) {
      if (!replacementSecurityId) {
        const emergency = await Security.create(createSecurityPayload(community, 99, hashedPassword));
        replacementSecurityId = emergency._id;
        change.createdIds.push(String(emergency._id));
        report.totals.securityCreated += 1;
      }

      const deleteIds = deleteCandidates.map((doc) => doc._id);
      const visitorUpdate = await Visitor.updateMany(
        {
          community: community._id,
          addedBy: { $in: deleteIds },
        },
        {
          $set: { addedBy: replacementSecurityId },
        },
      );
      const deleted = await Security.deleteMany({ _id: { $in: deleteIds } });

      change.reassignedVisitors = visitorUpdate.modifiedCount || 0;
      change.deletedIds = deleteIds.map((id) => String(id));
      report.totals.visitorRefsReassigned += change.reassignedVisitors;
      report.totals.securityDeleted += deleted.deletedCount || 0;
    } else if (!APPLY) {
      change.deletedIds = deleteCandidates.map((doc) => String(doc._id));
    }

    const finalCount = APPLY
      ? await Security.countDocuments({ community: community._id })
      : originalCount + addNeeded - shouldDelete;

    change.afterSecurityCount = finalCount;
    report.communityChanges.push(change);
    report.totals.communitiesModified += 1;
  }

  const afterCounts = await getCoreCounts();
  const afterOrphans = await countOrphanVisitorAddedBy();

  report.afterCounts = afterCounts;
  report.afterOrphanVisitorAddedBy = afterOrphans;
  report.endedAt = toIso(new Date());
  report.countDelta = {
    communities: afterCounts.communities - beforeCounts.communities,
    residents: afterCounts.residents - beforeCounts.residents,
    workers: afterCounts.workers - beforeCounts.workers,
    securities: afterCounts.securities - beforeCounts.securities,
    visitors: afterCounts.visitors - beforeCounts.visitors,
    payments: afterCounts.payments - beforeCounts.payments,
    issues: afterCounts.issues - beforeCounts.issues,
    bookings: afterCounts.bookings - beforeCounts.bookings,
  };

  const violations = await Security.aggregate([
    { $group: { _id: "$community", count: { $sum: 1 } } },
    { $match: { $or: [{ count: { $lt: MIN_SECURITY } }, { count: { $gt: MAX_SECURITY } }] } },
  ]);
  report.policyViolationsAfterRun = violations.length;

  console.log(JSON.stringify(report, null, 2));
  await mongoose.disconnect();
}

run().catch(async (error) => {
  console.error("Security rebalance failed:", error);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore disconnect error
  }
  process.exit(1);
});

