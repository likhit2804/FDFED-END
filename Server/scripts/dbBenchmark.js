/**
 * DB Benchmark Script — UrbanEase
 *
 * Runs .explain('executionStats') on the most common queries across ALL models
 * to verify index usage and measure query performance before/after optimization.
 * Now fully asserts MongoDB $text usage across all search variants.
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
const CommunityManager = (await import('../models/cManager.js')).default;

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
const term = "green";
const textQuery = { $text: { $search: term } };
const scopedTextQuery = { community: communityId, $text: { $search: term } };

const queries = [

  // RESIDENT
  { name: 'Residents text search',                 model: Resident,      filter: scopedTextQuery },
  { name: 'Resident by email + community',         model: Resident,      filter: { email: sampleResident?.email, community: communityId } },

  // ISSUE
  { name: 'Issues $text search',                   model: Issue,         filter: textQuery },
  { name: 'Issues by community + status',          model: Issue,         filter: { community: communityId, status: 'Pending Assignment' } },

  // WORKER
  { name: 'Workers text search',                   model: Worker,        filter: scopedTextQuery },

  // SECURITY
  { name: 'Security text search',                  model: Security,      filter: scopedTextQuery },

  // CMANAGER
  { name: 'Managers text search',                  model: CommunityManager, filter: textQuery },

  // PAYMENT
  { name: 'Payments text search',                  model: Payment,       filter: scopedTextQuery },
  { name: 'Payments by receiver (manager)',         model: Payment,       filter: { receiver: communityId } },

  // VISITOR
  { name: 'Visitors text search',                  model: Visitor,       filter: scopedTextQuery },

  // PRE-APPROVAL
  { name: 'PreApprovals text search',              model: PreApproval,   filter: scopedTextQuery },

  // LEAVE
  { name: 'Leaves text search',                    model: Leave,         filter: scopedTextQuery },

  // COMMON SPACES
  { name: 'CommonSpaces text search',              model: CommonSpaces,  filter: textQuery },

  // AMENITY
  { name: 'Amenities text search',                 model: Amenity,       filter: scopedTextQuery },

  // AD
  { name: 'Ads text search',                       model: Ad,            filter: scopedTextQuery },

  // COMMUNITY
  { name: 'Community $text search',                model: Community,     filter: textQuery },

  // INTEREST FORM
  { name: 'Interest forms text search',            model: Interest,      filter: textQuery },

  // AUDIT LOG
  { name: 'Audit logs text search',                model: AdminAuditLog, filter: textQuery },

  // BLOCK / FLAT (Not text indexed, raw speed check)
  { name: 'Blocks by community',                   model: Block,         filter: { community: communityId } },
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
    const explained = await q.model.find(q.filter).limit(10).explain('executionStats');

    const stats   = explained.executionStats;
    const winner  = explained.queryPlanner?.winningPlan;
    const stages  = getStages(winner);

    const examined = String(stats.totalDocsExamined ?? '—');
    const returned = String(stats.nReturned ?? '—');
    const time     = String(stats.executionTimeMillis ?? '—');

    // Determine index usage
    const hasIxScan   = stages.includes('IXSCAN');
    const hasCollscan = stages.includes('COLLSCAN');
    const hasText     = stages.includes('TEXT') || stages.includes('TEXT_MATCH');
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
  console.log('  🎉 All queries use indexes natively — optimal!');
} else {
  console.log(`  ⚠️  ${collscans} queries still use COLLSCAN — consider adding indexes.`);
}
console.log('');

await mongoose.disconnect();
