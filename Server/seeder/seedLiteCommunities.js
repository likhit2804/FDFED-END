import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import { faker } from "@faker-js/faker";

import Community from "../models/communities.js";
import CommunityManager from "../models/cManager.js";
import Block from "../models/blocks.js";
import Flat from "../models/flats.js";
import Resident from "../models/resident.js";
import Worker from "../models/workers.js";
import Security from "../models/security.js";
import Amenity from "../models/Amenities.js";
import Issue from "../models/issues.js";
import Visitor from "../models/visitors.js";
import Payment from "../models/payment.js";
import CommonSpaces from "../models/commonSpaces.js";
import CommunitySubscription from "../models/communitySubscription.js";
import { generateCustomID, generateTransactionId } from "../utils/idGenerator.js";

dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../.env"),
});

const MONGO_URI = process.env.MONGO_URI1;
if (!MONGO_URI) {
  console.error("MONGO_URI1 is not defined in Server/.env");
  process.exit(1);
}

const COMMUNITY_COUNT = Number(process.env.LITE_SEED_COMMUNITY_COUNT || 20);
const SCALE = Number(process.env.LITE_SEED_SCALE || 0.3);
const SHARED_PASSWORD = process.env.LITE_SEED_PASSWORD || "MegaCommunity@123";
const EMAIL_DOMAIN = "urbanease.local";

const BASELINE = {
  residents: 180,
  workers: 55,
  securities: 18,
  amenities: 14,
  issues: 140,
  visitors: 220,
  bookings: 180,
  maintenancePayments: 84,
  subscriptions: 18,
};

const COUNTS = {
  blocks: 3,
  floorsPerBlock: 6,
  flatsPerFloor: 3,
  residents: Math.max(18, Math.round(BASELINE.residents * SCALE)),
  workers: Math.max(6, Math.round(BASELINE.workers * SCALE)),
  securities: Math.max(2, Math.round(BASELINE.securities * SCALE)),
  amenities: Math.max(3, Math.round(BASELINE.amenities * SCALE)),
  issues: Math.max(16, Math.round(BASELINE.issues * SCALE)),
  visitors: Math.max(24, Math.round(BASELINE.visitors * SCALE)),
  bookings: Math.max(20, Math.round(BASELINE.bookings * SCALE)),
  maintenancePayments: Math.max(12, Math.round(BASELINE.maintenancePayments * SCALE)),
  subscriptions: Math.max(4, Math.round(BASELINE.subscriptions * SCALE)),
};

const WORKER_ROLES = [
  "Plumber",
  "Electrician",
  "Security",
  "Maintenance",
  "Pest Control",
  "Waste Management",
];

const ISSUE_STATUS = [
  "Pending Assignment",
  "Assigned",
  "In Progress",
  "On Hold",
  "Resolved (Awaiting Confirmation)",
  "Closed",
  "Payment Pending",
  "Payment Completed",
];

const VISITOR_STATUS = ["Pending", "Approved", "Active", "CheckedOut", "Rejected"];

const BOOKING_STATUS = ["Pending", "Approved", "Paid", "Completed", "Cancelled", "Rejected"];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};
const toYmd = (date) => date.toISOString().slice(0, 10);
const toUnique = (base, index, kind) =>
  `${base.toLowerCase().replace(/[^a-z0-9]+/g, ".")}.${kind}.${index}@${EMAIL_DOMAIN}`;

async function createStructure(communityId) {
  const flats = [];
  const blockCodes = ["A", "B", "C"];

  for (let b = 0; b < COUNTS.blocks; b += 1) {
    const blockCode = blockCodes[b] || `B${b + 1}`;
    const block = await Block.create({
      name: `Block ${blockCode}`,
      totalFloors: COUNTS.floorsPerBlock,
      flatsPerFloor: COUNTS.flatsPerFloor,
      community: communityId,
    });

    const batch = [];
    for (let floor = 1; floor <= COUNTS.floorsPerBlock; floor += 1) {
      for (let unit = 1; unit <= COUNTS.flatsPerFloor; unit += 1) {
        batch.push({
          flatNumber: `${blockCode}-${floor}${String(unit).padStart(2, "0")}`,
          floor,
          status: "Vacant",
          residentId: null,
          block: block._id,
          community: communityId,
        });
      }
    }

    const created = await Flat.insertMany(batch);
    flats.push(...created);
  }

  return flats;
}

async function createLiteCommunity(index, hashedPassword) {
  const suffix = String(index + 1).padStart(2, "0");
  const city = faker.location.city();
  const communityName = `UrbanEase Lite Community ${suffix} - ${city}`;

  const existing = await Community.findOne({ name: communityName }).select("_id").lean();
  if (existing) {
    return { skipped: true, name: communityName };
  }

  const community = await Community.create({
    name: communityName,
    location: faker.location.streetAddress(),
    description: "Lite data community seeded at ~30% scale for benchmarking and admin analytics.",
    status: "Active",
    subscriptionPlan: pick(["basic", "standard", "premium"]),
    subscriptionStatus: "active",
    planStartDate: addDays(new Date(), -120),
    planEndDate: addDays(new Date(), 245),
    hasStructure: true,
    totalMembers: 0,
  });

  const manager = await CommunityManager.create({
    name: `Lite Manager ${suffix}`,
    email: `lite.manager.${suffix}@${EMAIL_DOMAIN}`,
    password: hashedPassword,
    contact: `90${String(10000000 + index).slice(-8)}`,
    assignedCommunity: community._id,
  });

  community.communityManager = manager._id;
  await community.save();

  const startPlanDate = addDays(new Date(), -30 * COUNTS.subscriptions);
  for (let i = 0; i < COUNTS.subscriptions; i += 1) {
    const start = addDays(startPlanDate, i * 30);
    const end = addDays(start, 30);
    await CommunitySubscription.create({
      communityId: community._id,
      transactionId: generateTransactionId(`LITE_${suffix}`),
      planName: "Lite Plan",
      planType: community.subscriptionPlan || "standard",
      amount: pick([1999, 2499, 2999]),
      paymentMethod: pick(["UPI", "Card", "NetBanking"]),
      paymentDate: start,
      planStartDate: start,
      planEndDate: end,
      duration: "monthly",
      status: "completed",
      isRenewal: i > 0,
      metadata: {
        userAgent: "lite-seeder",
        ipAddress: "127.0.0.1",
      },
    });
  }

  const flats = await createStructure(community._id);
  const residentTarget = Math.min(COUNTS.residents, flats.length);
  const residents = [];

  for (let i = 0; i < residentTarget; i += 1) {
    const flat = flats[i];
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const resident = await Resident.create({
      residentFirstname: firstName,
      residentLastname: lastName,
      uCode: flat.flatNumber,
      email: toUnique(`${communityName}.${firstName}.${lastName}`, i + 1, "resident"),
      password: hashedPassword,
      contact: `91${String(10000000 + i + index * 100).slice(-8)}`,
      community: community._id,
    });
    flat.status = "Occupied";
    flat.residentId = resident._id;
    await flat.save();
    residents.push(resident);
  }

  const workers = [];
  for (let i = 0; i < COUNTS.workers; i += 1) {
    const worker = await Worker.create({
      name: `Lite Worker ${suffix}-${String(i + 1).padStart(2, "0")}`,
      email: `lite.worker.${suffix}.${i + 1}@${EMAIL_DOMAIN}`,
      password: hashedPassword,
      contact: `92${String(10000000 + i + index * 100).slice(-8)}`,
      address: `${communityName} Worker Quarters`,
      jobRole: [WORKER_ROLES[i % WORKER_ROLES.length]],
      salary: faker.number.int({ min: 18000, max: 42000 }),
      joiningDate: addDays(new Date(), -faker.number.int({ min: 40, max: 720 })),
      community: community._id,
      isActive: true,
    });
    workers.push(worker);
  }

  const securities = [];
  for (let i = 0; i < COUNTS.securities; i += 1) {
    const security = await Security.create({
      name: `Lite Security ${suffix}-${String(i + 1).padStart(2, "0")}`,
      email: `lite.security.${suffix}.${i + 1}@${EMAIL_DOMAIN}`,
      password: hashedPassword,
      contact: `93${String(10000000 + i + index * 100).slice(-8)}`,
      address: `${communityName} Gate Office`,
      community: community._id,
      Shift: i % 2 === 0 ? "Day" : "Night",
      workplace: i % 2 === 0 ? "Main Gate" : "Side Gate",
      joiningDate: addDays(new Date(), -faker.number.int({ min: 30, max: 560 })),
    });
    securities.push(security);
  }

  const amenities = [];
  for (let i = 0; i < COUNTS.amenities; i += 1) {
    const amenity = await Amenity.create({
      name: `Lite Amenity ${suffix}-${i + 1}`,
      type: pick(["Clubhouse", "Gym", "Banquet Hall", "Swimming Pool", "Badminton Court"]),
      Type: pick(["Slot", "Subscription"]),
      description: "Seeded lite amenity",
      bookable: true,
      rent: faker.number.int({ min: 250, max: 1600 }),
      community: community._id,
      bookedSlots: [],
    });
    amenities.push(amenity);
  }

  const paymentStatuses = ["Completed", "Completed", "Pending", "Overdue"];
  for (let i = 0; i < COUNTS.maintenancePayments; i += 1) {
    const resident = residents[i % residents.length];
    const status = paymentStatuses[i % paymentStatuses.length];
    const baseDate = addDays(new Date(), -i * 6);
    await Payment.create({
      ID: generateCustomID(`LITE_MAINT_${suffix}_${i}`, "PY"),
      title: `Maintenance-${suffix}-${String(i + 1).padStart(3, "0")}`,
      sender: resident._id,
      receiver: manager._id,
      amount: faker.number.int({ min: 1800, max: 5400 }),
      paymentDeadline: addDays(baseDate, 7),
      paymentDate: status === "Completed" ? addDays(baseDate, 2) : null,
      paymentMethod: status === "Completed" ? pick(["UPI", "Card", "NetBanking"]) : "None",
      status,
      remarks: "Seeded lite maintenance payment",
      community: community._id,
      belongTo: "Resident",
      belongToId: resident._id,
    });
  }

  for (let i = 0; i < COUNTS.bookings; i += 1) {
    const resident = residents[i % residents.length];
    const amenity = amenities[i % amenities.length];
    const status = BOOKING_STATUS[i % BOOKING_STATUS.length];
    const date = addDays(new Date(), faker.number.int({ min: -70, max: 30 }));
    const paymentStatus = status === "Paid" || status === "Completed"
      ? "Success"
      : status === "Cancelled"
        ? "Refunded"
        : status === "Rejected"
          ? "Failed"
          : "Pending";

    const booking = await CommonSpaces.create({
      ID: generateCustomID(`LITE_CSB_${suffix}_${i}`, "CS"),
      name: amenity.name,
      description: "Seeded lite booking",
      Date: toYmd(date),
      from: "10:00",
      to: "11:00",
      Type: amenity.Type || "Slot",
      status,
      paymentStatus,
      amount: Number(amenity.rent || 0),
      availability: status === "Cancelled" ? "NO" : "YES",
      bookedBy: resident._id,
      community: community._id,
    });

    if (status === "Paid" || status === "Completed") {
      const payment = await Payment.create({
        ID: generateCustomID(`LITE_CSB_PAY_${suffix}_${i}`, "PY"),
        title: `CSB-${booking.ID}`,
        sender: resident._id,
        receiver: manager._id,
        amount: Number(amenity.rent || 0),
        paymentDeadline: addDays(date, 2),
        paymentDate: addDays(date, 1),
        paymentMethod: "UPI",
        status: "Completed",
        remarks: "Seeded lite CSB payment",
        community: community._id,
        belongTo: "CommonSpaces",
        belongToId: booking._id,
      });
      booking.payment = payment._id;
      await booking.save();
    }
  }

  for (let i = 0; i < COUNTS.issues; i += 1) {
    const resident = residents[i % residents.length];
    const worker = workers[i % workers.length];
    const isResidentType = i % 3 !== 0;
    const categoryType = isResidentType ? "Resident" : "Community";
    const category = isResidentType
      ? pick(["Plumbing", "Electrical", "Maintenance", "Pest Control", "Other"])
      : pick(["Streetlight", "Elevator", "Garden", "Common Area", "Other Community"]);
    const status = ISSUE_STATUS[i % ISSUE_STATUS.length];

    const issue = await Issue.create({
      issueID: generateCustomID(`LITE_ISSUE_${suffix}_${i}`, "IS"),
      title: `${category} issue ${i + 1}`,
      description: "Seeded lite issue",
      status,
      priority: pick(["Normal", "High", "Urgent"]),
      categoryType,
      category,
      otherCategory: category === "Other" || category === "Other Community" ? "Custom Lite Category" : null,
      resident: resident._id,
      location: categoryType === "Resident" ? resident.uCode : `Zone-${(i % 6) + 1}`,
      workerAssigned: ["Assigned", "In Progress", "On Hold", "Payment Pending", "Payment Completed"].includes(status)
        ? worker._id
        : null,
      autoAssigned: i % 2 === 0,
      deadline: addDays(new Date(), faker.number.int({ min: 2, max: 12 })).toISOString(),
      community: community._id,
      estimatedCost: faker.number.int({ min: 350, max: 4500 }),
      paymentStatus: status === "Payment Completed" ? "Completed" : "Pending",
      resolvedAt: ["Closed", "Payment Completed"].includes(status)
        ? addDays(new Date(), -faker.number.int({ min: 1, max: 15 })).toISOString()
        : null,
    });

    if (status === "Payment Pending" || status === "Payment Completed") {
      const issuePayment = await Payment.create({
        ID: generateCustomID(`LITE_ISSUE_PAY_${suffix}_${i}`, "PY"),
        title: `Issue-${issue.issueID}`,
        sender: resident._id,
        receiver: manager._id,
        amount: issue.estimatedCost,
        paymentDeadline: addDays(new Date(), 7),
        paymentDate: status === "Payment Completed" ? addDays(new Date(), -1) : null,
        paymentMethod: status === "Payment Completed" ? "UPI" : "None",
        status: status === "Payment Completed" ? "Completed" : "Pending",
        remarks: "Seeded lite issue payment",
        community: community._id,
        belongTo: "Issue",
        belongToId: issue._id,
      });
      issue.payment = issuePayment._id;
      await issue.save();
    }
  }

  for (let i = 0; i < COUNTS.visitors; i += 1) {
    const resident = residents[i % residents.length];
    const security = securities[i % securities.length];
    const status = VISITOR_STATUS[i % VISITOR_STATUS.length];
    const scheduledAt = addDays(new Date(), faker.number.int({ min: -20, max: 20 }));
    const isCheckedIn = status === "Active" || status === "CheckedOut";

    await Visitor.create({
      ID: generateCustomID(`LITE_VIS_${suffix}_${i}`, "PA"),
      name: faker.person.fullName(),
      contactNumber: `98${String(10000000 + i + index * 100).slice(-8)}`,
      email: `lite.visitor.${suffix}.${i + 1}@${EMAIL_DOMAIN}`,
      purpose: pick(["Guest", "Delivery", "Service", "Family"]),
      vehicleNumber: `TS09LITE${suffix}${String(i + 1).padStart(3, "0")}`,
      scheduledAt,
      approvedBy: resident._id,
      status,
      isCheckedIn,
      checkInAt: isCheckedIn ? scheduledAt : null,
      checkOutAt: status === "CheckedOut" ? addDays(scheduledAt, 0) : null,
      verifiedByResident: status !== "Pending" && status !== "Rejected",
      addedBy: security._id,
      community: community._id,
    });
  }

  community.totalMembers = residents.length + workers.length + securities.length + 1;
  await community.save();

  return {
    skipped: false,
    name: community.name,
    communityId: String(community._id),
    managerEmail: manager.email,
    counts: {
      residents: residents.length,
      workers: workers.length,
      securities: securities.length,
      amenities: amenities.length,
      issues: COUNTS.issues,
      visitors: COUNTS.visitors,
      bookings: COUNTS.bookings,
    },
  };
}

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");
  console.log(`Creating ${COMMUNITY_COUNT} additional lite communities at scale=${SCALE}`);

  const hashedPassword = await bcrypt.hash(SHARED_PASSWORD, 10);
  const summary = {
    created: 0,
    skipped: 0,
    communities: [],
    defaultPassword: SHARED_PASSWORD,
  };

  for (let i = 0; i < COMMUNITY_COUNT; i += 1) {
    const result = await createLiteCommunity(i, hashedPassword);
    if (result.skipped) {
      summary.skipped += 1;
      console.log(`- Skipped existing: ${result.name}`);
      continue;
    }

    summary.created += 1;
    summary.communities.push(result);
    console.log(`- Created: ${result.name}`);
  }

  console.log("\nLite community seed complete");
  console.log(JSON.stringify(summary, null, 2));
  await mongoose.disconnect();
}

run().catch(async (err) => {
  console.error("Lite community seed failed:", err);
  try {
    await mongoose.disconnect();
  } catch (disconnectErr) {
    console.error("Disconnect failed:", disconnectErr);
  }
  process.exit(1);
});

