/**
 * DB Benchmark Script — UrbanEase
 *
 * Runs .explain('executionStats') on the most common queries across ALL models
 * to verify index usage and measure query performance before/after optimization.
 *
 * Usage:
 *   node Server/scripts/dbBenchmark.js
 *
 * Output: formatted table showing docs examined, docs returned, exec time, and index used
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI1 || process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error('❌  MONGO_URI1 not set in .env');
  process.exit(1);
}

await mongoose.connect(MONGO_URI);
console.log('✅  Connected to MongoDB\n');

// ── Model imports ─────────────────────────────────────────────────────────
const Issue          = (await import('../models/issues.js')).default;
const Resident       = (await import('../models/resident.js')).default;
const Worker         = (await import('../models/workers.js')).default;
const Security       = (await import('../models/security.js')).default;
const Payment        = (await import('../models/payment.js')).default;
const Visitor        = (await import('../models/visitors.js')).default;
const PreApproval    = (await import('../models/preapproval.js')).default;
const Leave          = (await import('../models/leave.js')).default;
const CommonSpaces   = (await import('../models/commonSpaces.js')).default;
const Amenity        = (await import('../models/Amenities.js')).default;
const Ad             = (await import('../models/Ad.js')).default;
const Community      = (await import('../models/communities.js')).default;
const Interest       = (await import('../models/interestForm.js')).default;
const AdminAuditLog  = (await import('../models/adminAuditLog.js')).default;
const CommunitySubscription = (await import('../models/communitySubscription.js')).default;
const Block          = (await import('../models/blocks.js')).default;
const Flat           = (await import('../models/flats.js')).default;

// ── Get sample IDs from real data ─────────────────────────────────────────
const sampleResident = await Resident.findOne().lean();
const communityId    = sampleResident?.community;
const sampleWorker   = await Worker.findOne({ community: communityId }).lean();
const sampleIssue    = await Issue.findOne({ community: communityId }).lean();
const sampleBlock    = await Block.findOne({ community: communityId }).lean();
const sampleAdmin    = await (await import('../models/admin.js')).default.findOne().lean();

if (!communityId) {
  console.log('⚠️  No data found. Seed the database first.\n');
  await mongoose.disconnect();
  process.exit(0);
}

// ── Choose a worker ID or fall back ───────────────────────────────────────
const workerId = sampleWorker?._id || new mongoose.Types.ObjectId();
const adminId  = sampleAdmin?._id  || new mongoose.Types.ObjectId();

// ── Query definitions ─────────────────────────────────────────────────────
// Each entry: { name, model, filter }
const queries = [

  // RESIDENT
  { name: 'Residents by community',               model: Resident,      filter: { community: communityId } },
  { name: 'Resident by email + community',         model: Resident,      filter: { email: sampleResident?.email, community: communityId } },

  // ISSUE
  { name: 'Issues by community + status',          model: Issue,         filter: { community: communityId, status: 'Pending Assignment' } },
  { name: 'Issues by resident',                    model: Issue,         filter: { resident: sampleResident?._id } },
  { name: 'Issues by worker + status',             model: Issue,         filter: { workerAssigned: workerId, status: 'In Progress' } },
  { name: 'Issues $text search ("plumbing")',       model: Issue,         filter: { $text: { $search: 'plumbing' } } },

  // WORKER
  { name: 'Workers by community (active)',          model: Worker,        filter: { community: communityId, isActive: true } },

  // SECURITY
  { name: 'Security by community',                 model: Security,      filter: { community: communityId } },

  // PAYMENT
  { name: 'Payments by community + status',        model: Payment,       filter: { community: communityId, status: 'Pending' } },
  { name: 'Payments by sender (resident)',          model: Payment,       filter: { sender: sampleResident?._id } },
  { name: 'Payments by receiver (manager)',         model: Payment,       filter: { receiver: communityId } },

  // VISITOR
  { name: 'Visitors by community + status',        model: Visitor,       filter: { community: communityId, status: 'Active' } },
  { name: 'Visitors by community (upcoming)',       model: Visitor,       filter: { community: communityId, scheduledAt: { $gte: new Date() } } },

  // PRE-APPROVAL
  { name: 'PreApprovals by community + status',    model: PreApproval,   filter: { community: communityId, status: 'Pending' } },
  { name: 'PreApprovals by resident (approvedBy)', model: PreApproval,   filter: { approvedBy: sampleResident?._id } },

  // LEAVE
  { name: 'Leaves by worker + status',             model: Leave,         filter: { worker: workerId, status: 'pending' } },
  { name: 'Leaves by community + status',          model: Leave,         filter: { community: communityId, status: 'pending' } },

  // COMMON SPACES
  { name: 'CommonSpaces by community + status',    model: CommonSpaces,  filter: { community: communityId, status: 'Approved' } },
  { name: 'CommonSpaces by bookedBy (resident)',   model: CommonSpaces,  filter: { bookedBy: sampleResident?._id } },

  // AMENITY
  { name: 'Amenities by community',                model: Amenity,       filter: { community: communityId } },

  // AD
  { name: 'Ads by community + status',             model: Ad,            filter: { community: communityId, status: 'Active' } },

  // COMMUNITY
  { name: 'Community by subscriptionStatus',       model: Community,     filter: { subscriptionStatus: 'active' } },
  { name: 'Community $text search ("green")',       model: Community,     filter: { $text: { $search: 'green' } } },

  // INTEREST FORM
  { name: 'Interest forms by status (desc date)',  model: Interest,      filter: { status: 'pending' } },
  { name: 'Interest form by email',                model: Interest,      filter: { email: 'test@example.com' } },

  // COMMUNITY SUBSCRIPTION
  { name: 'Subscriptions by community+date',       model: CommunitySubscription, filter: { communityId } },

  // AUDIT LOG
  { name: 'Audit logs by admin + date',            model: AdminAuditLog, filter: { adminId, createdAt: { $gte: new Date(Date.now() - 7 * 86400000) } } },
  { name: 'Audit logs by action',                  model: AdminAuditLog, filter: { action: 'login' } },
  { name: 'Audit logs by target',                  model: AdminAuditLog, filter: { targetType: 'Community', targetId: communityId } },

  // BLOCK / FLAT
  { name: 'Blocks by community',                   model: Block,         filter: { community: communityId } },
  { name: 'Flats by community',                    model: Flat,          filter: { community: communityId } },
  { name: 'Flats by block',                        model: Flat,          filter: { block: sampleBlock?._id || new mongoose.Types.ObjectId() } },
];

// ── Helper: walk winning plan to get leaf stage ───────────────────────────
function getStages(plan) {
  const stages = [];
  let p = plan;
  while (p) {
    stages.push(p.stage);
    p = p.inputStage || (p.inputStages && p.inputStages[0]);
  }
  return stages;
}

// ── Column widths ─────────────────────────────────────────────────────────
const W = { name: 42, examined: 12, returned: 10, time: 10, index: 22 };
const totalW = Object.values(W).reduce((a, b) => a + b, 6);
const sep = '─'.repeat(totalW);
const hdr = (s, w) => s.padEnd(w);

// ── Print header ──────────────────────────────────────────────────────────
console.log('\n' + '='.repeat(totalW));
console.log('  DB OPTIMIZATION BENCHMARK REPORT — UrbanEase');
console.log('  MongoDB Atlas | Branch: feat/db-search');
console.log('='.repeat(totalW));
console.log(
  hdr('Query', W.name),
  hdr('Examined', W.examined),
  hdr('Returned', W.returned),
  hdr('Time(ms)', W.time),
  'Index Stage'
);
console.log(sep);

let collscans = 0;
let errors    = 0;

for (const q of queries) {
  try {
    const explained = await q.model.find(q.filter).limit(100).explain('executionStats');

    const stats   = explained.executionStats;
    const winner  = explained.queryPlanner?.winningPlan;
    const stages  = getStages(winner);

    const examined = String(stats.totalDocsExamined ?? '—');
    const returned = String(stats.nReturned ?? '—');
    const time     = String(stats.executionTimeMillis ?? '—');

    // Determine index usage
    const hasIxScan   = stages.includes('IXSCAN');
    const hasCollscan = stages.includes('COLLSCAN');
    const hasText     = stages.includes('TEXT');
    const hasFetch    = stages.includes('FETCH');

    let indexLabel;
    if (hasText)               indexLabel = '✅ TEXT index';
    else if (hasIxScan)        indexLabel = '✅ IXSCAN';
    else if (hasFetch && !hasCollscan) indexLabel = '✅ FETCH (idx)';
    else if (hasCollscan)      { indexLabel = '❌ COLLSCAN'; collscans++; }
    else                       indexLabel = stages[0] ?? '?';

    console.log(
      hdr(q.name, W.name),
      hdr(examined, W.examined),
      hdr(returned, W.returned),
      hdr(time, W.time),
      indexLabel
    );
  } catch (err) {
    errors++;
    console.log(
      hdr(q.name, W.name),
      hdr('ERROR', W.examined),
      hdr('—', W.returned),
      hdr('—', W.time),
      err.message.slice(0, 40)
    );
  }
}

// ── Summary ───────────────────────────────────────────────────────────────
console.log(sep);
console.log(`\n  Total queries: ${queries.length}  |  COLLSCANs: ${collscans}  |  Errors: ${errors}`);
if (collscans === 0) {
  console.log('  🎉 All queries use indexes — optimal!');
} else {
  console.log(`  ⚠️  ${collscans} queries still use COLLSCAN — consider adding indexes.`);
}
console.log('');

await mongoose.disconnect();
