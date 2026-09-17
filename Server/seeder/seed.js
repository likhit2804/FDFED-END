import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { faker } from '@faker-js/faker';

import Community from '../models/communities.js';
import CommunityManager from '../models/cManager.js';
import Block from '../models/blocks.js';
import Flat from '../models/flats.js';
import Resident from '../models/resident.js';
import Payment from '../models/payment.js';
import Worker from '../models/workers.js';
import Security from '../models/security.js';
import Visitor from '../models/visitors.js';
import Amenity from '../models/Amenities.js';
import Issue from '../models/issues.js';
import CommunitySubscription from '../models/communitySubscription.js';
import Admin from '../models/admin.js';
import SystemSettings from '../models/systemSettings.js';
import SubscriptionPlan from '../models/subscriptionPlan.js';

import {
  generateCommunity,
  generateManager,
  generateResident,
  generatePayment,
  generateWorker,
  generateSecurity,
  generateAmenity,
  generateIssue,
  generateVisitor,
  generateCommunitySubscription
} from './dataGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const MONGO_URI = process.env.MONGO_URI1;
if (!MONGO_URI) {
  console.error('❌ MONGO_URI1 is not defined in .env');
  process.exit(1);
}

const PASSWORD_PLAIN = 'password123';
const TARGET_USER_EMAIL = 'adityakanumuri02@gmail.com';
const TARGET_USER_PASSWORD_PLAIN = '123456';

let HASHED_PASSWORD;
let HASHED_TARGET_PASSWORD;

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB Cloud (urbanEase)');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
  }
};

const clearDB = async () => {
  console.log('🧹 Clearing all existing data from MongoDB Cloud...');
  const collections = await mongoose.connection.db.collections();
  for (const collection of collections) {
    try {
      await collection.drop();
      console.log(`   - Dropped: ${collection.collectionName}`);
    } catch (err) {
      // Ignore if collection not found
    }
  }
  console.log('✅ All collections cleared.\n');

  // Seed Super Admin
  const HASHED_ADMIN_PASSWORD = await bcrypt.hash('Urbanease@123', 10);
  await Admin.create({
    name: 'Super Admin',
    email: 'noreply.urbanease@gmail.com',
    password: HASHED_ADMIN_PASSWORD,
    role: 'admin',
  });
  console.log('👑 Super Admin seeded (noreply.urbanease@gmail.com / Urbanease@123)');

  // Seed System Settings
  await SystemSettings.create({
    key: 'global_settings',
    skip2FA: false,
    maintenanceMode: false,
  });
  console.log('⚙️ SystemSettings seeded.');

  // Seed Default Subscription Plans
  await SubscriptionPlan.create([
    {
      planKey: 'starter',
      name: 'Starter Plan',
      price: 2999,
      duration: 'monthly',
      maxResidents: 50,
      features: ['Visitor Management', 'Resident Directory', 'Basic Helpdesk'],
      isActive: true,
      displayOrder: 1,
    },
    {
      planKey: 'growth',
      name: 'Growth Plan',
      price: 6999,
      duration: 'monthly',
      maxResidents: 200,
      features: ['Visitor Management', 'Resident Directory', 'Advanced Helpdesk', 'Online Payments', 'Amenity Booking'],
      isActive: true,
      displayOrder: 2,
    },
    {
      planKey: 'enterprise',
      name: 'Enterprise Annual Plan',
      price: 59999,
      duration: 'yearly',
      maxResidents: null,
      features: ['All Features', 'Dedicated Support', 'Automated Billing', 'Custom Analytics'],
      isActive: true,
      displayOrder: 3,
    },
  ]);
  console.log('📋 Default Subscription Plans seeded.\n');
};

const seedCommunities = async (count = 3) => {
  console.log(`🌱 Seeding ${count} communities with subscription history...`);
  const communities = [];
  const now = new Date();

  for (let i = 0; i < count; i++) {
    const isTargetCommunity = (i === 0);
    const communityData = generateCommunity();
    if (isTargetCommunity) {
      communityData.name = 'Prestige Palm Heights';
      communityData.location = 'Outer Ring Road, Bengaluru';
    }

    const communityCreatedAt = faker.date.past({ years: 3 });

    const blocks = ['A', 'B', 'C'].map((blockName) => ({
      name: `Block ${blockName}`,
      totalFloors: 5,
      flatsPerFloor: 4,
      flats: [],
    }));

    blocks.forEach((block) => {
      for (let floor = 1; floor <= block.totalFloors; floor++) {
        for (let flatNum = 1; flatNum <= block.flatsPerFloor; flatNum++) {
          block.flats.push({
            flatNumber: `${block.name.split(' ')[1]}-${floor}0${flatNum}`,
            floor: floor,
            status: 'Vacant',
            residentId: null,
          });
        }
      }
    });

    const community = new Community(communityData);
    community.createdAt = communityCreatedAt;
    community.hasStructure = true;
    await community.save();

    for (const block of blocks) {
      const newBlock = await Block.create({
        name: block.name,
        totalFloors: block.totalFloors,
        flatsPerFloor: block.flatsPerFloor,
        community: community._id,
      });

      const flatDocs = block.flats.map((f) => ({
        flatNumber: f.flatNumber,
        floor: f.floor,
        status: 'Vacant',
        residentId: null,
        registrationCode: `UE-${crypto.randomBytes(4).toString('hex')}`,
        block: newBlock._id,
        community: community._id,
      }));
      await Flat.insertMany(flatDocs);
    }

    // Seed Subscription history
    let subDate = new Date(communityCreatedAt);
    subDate.setDate(faker.number.int({ min: 1, max: 28 }));
    while (subDate <= now) {
      const subData = generateCommunitySubscription(community._id, new Date(subDate));
      await CommunitySubscription.create(subData);
      if (new Date(subDate.getTime() + (subData.duration === 'monthly' ? 30 : 365) * 86400000) > now) {
        community.subscriptionStatus = subData.status === 'completed' ? 'active' : 'expired';
        community.planStartDate = subData.planStartDate;
        community.planEndDate = subData.planEndDate;
      }
      if (subData.duration === 'monthly') subDate.setMonth(subDate.getMonth() + 1);
      else subDate.setFullYear(subDate.getFullYear() + 1);
    }

    // Community Manager
    let manager;
    if (isTargetCommunity) {
      manager = await CommunityManager.create({
        name: 'Aditya Kanumuri',
        email: TARGET_USER_EMAIL,
        password: HASHED_TARGET_PASSWORD,
        contact: '+91 9876543210',
        assignedCommunity: community._id,
      });
      console.log(`   🌟 CommunityManager (${TARGET_USER_EMAIL}) created for: ${community.name}`);
    } else {
      const managerData = generateManager(community._id);
      managerData.password = HASHED_PASSWORD;
      manager = await CommunityManager.create(managerData);
    }

    community.communityManager = manager._id;
    await community.save();

    communities.push({ community, manager, isTargetCommunity });
    console.log(`   - Created Community: ${community.name}`);
  }
  return communities;
};

const seedWorkersAndSecurity = async (communities) => {
  console.log('👷 Seeding Workers and Security...');
  const staff = [];
  const now = new Date();

  for (const { community, isTargetCommunity } of communities) {
    if (isTargetCommunity) {
      // Target Security
      const targetSec = await Security.create({
        name: 'Aditya Kanumuri',
        email: TARGET_USER_EMAIL,
        password: HASHED_TARGET_PASSWORD,
        contact: '+91 9876543210',
        address: 'Gate 1 Security Desk',
        community: community._id,
        Shift: 'Day',
        workplace: 'Main Gate',
        joiningDate: new Date(),
      });
      staff.push(targetSec);
      console.log(`   🌟 Security (${TARGET_USER_EMAIL}) created for: ${community.name}`);

      // Target Worker
      await Worker.create({
        name: 'Aditya Kanumuri',
        email: TARGET_USER_EMAIL,
        password: HASHED_TARGET_PASSWORD,
        contact: '+91 9876543210',
        address: 'Maintenance Wing Room 1',
        jobRole: ['Electrician', 'Maintenance'],
        salary: 28000,
        isActive: true,
        community: community._id,
        joiningDate: new Date(),
      });
      console.log(`   🌟 Worker (${TARGET_USER_EMAIL}) created for: ${community.name}`);
    }

    for (let w = 0; w < 3; w++) {
      const workerData = generateWorker(community._id);
      workerData.password = HASHED_PASSWORD;
      workerData.joiningDate = faker.date.between({ from: community.createdAt, to: now });
      await Worker.create(workerData);
    }
    for (let s = 0; s < 2; s++) {
      const securityData = generateSecurity(community._id);
      securityData.password = HASHED_PASSWORD;
      securityData.joiningDate = faker.date.between({ from: community.createdAt, to: now });
      const sec = await Security.create(securityData);
      staff.push(sec);
    }
  }
  return staff;
};

const seedAmenities = async (communities) => {
  console.log('🏊 Seeding Amenities...');
  for (const { community } of communities) {
    for (let a = 0; a < 2; a++) {
      const amenityData = generateAmenity(community._id);
      await Amenity.create(amenityData);
    }
  }
};

const seedResidentsAndRelated = async (communities, staff) => {
  console.log('👥 Seeding Residents, Payments, Issues, Visitors with scattered dates...');
  const now = new Date();

  for (const { community, manager, isTargetCommunity } of communities) {
    const blocks = await Block.find({ community: community._id });

    if (isTargetCommunity) {
      // Find Flat A-101 in Block A
      const blockA = blocks.find((b) => b.name.includes('A')) || blocks[0];
      const flatA101 = await Flat.findOne({ block: blockA._id, flatNumber: { $regex: /101$/ } });

      const targetResident = new Resident({
        residentFirstname: 'Aditya',
        residentLastname: 'Kanumuri',
        uCode: 'A-101',
        email: TARGET_USER_EMAIL,
        password: HASHED_TARGET_PASSWORD,
        contact: '+91 9876543210',
        community: community._id,
        createdAt: new Date(),
      });
      await targetResident.save();

      if (flatA101) {
        flatA101.status = 'Occupied';
        flatA101.residentId = targetResident._id;
        await flatA101.save();
      }

      // Add initial payment & issue for target resident
      await Payment.create({
        title: 'Monthly Maintenance',
        sender: targetResident._id,
        receiver: manager._id,
        community: community._id,
        amount: 2500,
        status: 'Completed',
        paymentDate: new Date(),
        paymentDeadline: new Date(Date.now() + 15 * 86400000),
        paymentMethod: 'UPI',
      });

      const issueData = generateIssue(targetResident._id, community._id);
      issueData.title = 'Master Bedroom AC Breaker Tripping';
      issueData.category = 'Electrical';
      const targetIssue = new Issue(issueData);
      await targetIssue.save();

      console.log(`   🌟 Resident (${TARGET_USER_EMAIL}) created for: ${community.name} (Flat A-101)`);
    }

    for (const block of blocks) {
      const flats = await Flat.find({ block: block._id });
      for (const flat of flats) {
        if (flat.status === 'Occupied') continue;

        if (faker.datatype.boolean(0.6)) {
          const residentData = generateResident(community._id, block.name.split(' ')[1], flat.flatNumber.split('-')[1]);
          residentData.password = HASHED_PASSWORD;
          try {
            const moveInDate = faker.date.between({ from: community.createdAt, to: now });
            const resident = new Resident(residentData);
            resident.createdAt = moveInDate;
            await resident.save();
            flat.status = 'Occupied';
            flat.residentId = resident._id;
            await flat.save();

            let currentDate = new Date(moveInDate);
            const payDay = faker.number.int({ min: 1, max: 28 });
            currentDate.setDate(payDay);
            if (moveInDate.getDate() > payDay) currentDate.setMonth(currentDate.getMonth() + 1);

            while (currentDate <= now) {
              const paymentData = generatePayment(resident._id, manager._id, community._id, new Date(currentDate));
              if (currentDate.getMonth() === now.getMonth() && currentDate.getFullYear() === now.getFullYear()) {
                paymentData.status = faker.helpers.arrayElement(['Pending', 'Completed']);
              } else {
                paymentData.status = faker.helpers.arrayElement(['Completed', 'Completed', 'Completed', 'Overdue']);
              }
              if (paymentData.status === 'Completed') {
                const paidConfig = new Date(currentDate);
                paidConfig.setDate(paidConfig.getDate() + faker.number.int({ min: -2, max: 7 }));
                paymentData.paymentDate = paidConfig;
              } else {
                paymentData.paymentDate = null;
              }
              const payment = new Payment(paymentData);
              payment.createdAt = currentDate;
              await payment.save();
              currentDate.setMonth(currentDate.getMonth() + 1);
            }

            if (faker.datatype.boolean(0.4)) {
              for (let k = 0; k < faker.number.int({ min: 1, max: 3 }); k++) {
                const issueData = generateIssue(resident._id, community._id);
                const issueDate = faker.date.between({ from: moveInDate, to: now });
                const issue = new Issue(issueData);
                issue.createdAt = issueDate;
                await issue.save();
              }
            }

            if (faker.datatype.boolean(0.5)) {
              for (let v = 0; v < faker.number.int({ min: 1, max: 5 }); v++) {
                const securityId = staff.length > 0 ? faker.helpers.arrayElement(staff)._id : null;
                const visitorData = generateVisitor(community._id, resident._id, securityId);
                const visitDate = faker.date.between({ from: moveInDate, to: now });
                if (visitorData.checkInAt) visitorData.checkInAt = visitDate;
                const visitor = new Visitor(visitorData);
                visitor.createdAt = visitDate;
                await visitor.save();
              }
            }
          } catch (err) {}
        }
      }
    }
  }
};

const run = async () => {
  await connectDB();
  HASHED_PASSWORD = await bcrypt.hash(PASSWORD_PLAIN, 10);
  HASHED_TARGET_PASSWORD = await bcrypt.hash(TARGET_USER_PASSWORD_PLAIN, 10);

  await clearDB();

  const communities = await seedCommunities(3);
  const staff = await seedWorkersAndSecurity(communities);
  await seedAmenities(communities);
  await seedResidentsAndRelated(communities, staff);

  console.log('\n=============================================================');
  console.log('✨ Seeding Complete in MongoDB Cloud (urbanEase)! ✨');
  console.log('=============================================================');
  console.log(`\nAll users seeded with email: ${TARGET_USER_EMAIL}`);
  console.log(`Password for all: ${TARGET_USER_PASSWORD_PLAIN}`);
  console.log(`Community: Prestige Palm Heights`);
  console.log(`\nRoles ready to login on /SignIn:`);
  console.log(`1. Community Manager  -> Role: 'Community Manager'`);
  console.log(`2. Resident           -> Role: 'Resident' (Flat A-101)`);
  console.log(`3. Security Guard     -> Role: 'Security' (Gate 1)`);
  console.log(`4. Worker / Staff     -> Role: 'Worker' (Electrician)`);
  console.log(`\nSuper Admin Login:`);
  console.log(`Email: noreply.urbanease@gmail.com | Password: Urbanease@123`);
  console.log('=============================================================\n');

  process.exit(0);
};

run();
