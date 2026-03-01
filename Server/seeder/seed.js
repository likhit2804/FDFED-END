
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

// Import Models
import Community from "../core/models/communities.js";
import CommunityManager from "../core/models/cManager.js";
import Resident from "../core/models/resident.js";
import Payment from "../core/models/payment.js";
import Worker from "../core/models/workers.js";
import Security from "../core/models/security.js";
import Visitor from "../core/models/visitors.js";
import CommonSpaces from "../core/models/commonSpaces.js"; // Amenities
import Amenity from "../core/models/Amenities.js"; // Real Amenities model
import Issue from "../core/models/issues.js";
import Interest from "../core/models/interestForm.js";
import Notifications from "../core/models/Notifications.js";
import CommunitySubscription from "../core/models/communitySubscription.js";

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
    generateInterest,
    generateCommunitySubscription
} from './dataGenerator.js';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const MONGO_URI = process.env.MONGO_URI1;

if (!MONGO_URI) {
    console.error('MONGO_URI1 is not defined in .env');
    process.exit(1);
}

const PASSWORD_PLAIN = 'password123';
let HASHED_PASSWORD;

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('âœ… Connected to MongoDB');
    } catch (err) {
        console.error('âŒ MongoDB Connection Error:', err);
        process.exit(1);
    }
};

const clearDB = async () => {
    console.log('ðŸ§¹ Clearing existing data... SKIPPED (Uncomment to enable)');
};

const seedCommunities = async (count = 3) => {
    console.log(`ðŸŒ± Seeding ${count} communities with subscription history...`);
    const communities = [];
    const now = new Date();

    for (let i = 0; i < count; i++) {
        const communityData = generateCommunity();

        // Dynamic Date: Community started sometime in the last 3 years
        const communityCreatedAt = faker.date.past({ years: 3 });

        // Create specific structure for the community
        const blocks = ['A', 'B', 'C'].map(blockName => ({
            name: `Block ${blockName}`,
            totalFloors: 5,
            flatsPerFloor: 4,
            flats: []
        }));

        blocks.forEach(block => {
            for (let floor = 1; floor <= block.totalFloors; floor++) {
                for (let flatNum = 1; flatNum <= block.flatsPerFloor; flatNum++) {
                    block.flats.push({
                        flatNumber: `${block.name.split(' ')[1]}-${floor}0${flatNum}`,
                        floor: floor,
                        status: 'Vacant',
                        residentId: null
                    });
                }
            }
        });

        communityData.blocks = blocks;

        const community = new Community(communityData);
        community.createdAt = communityCreatedAt;
        await community.save();

        // Seed Subscription history for this community
        let subDate = new Date(communityCreatedAt);
        // Randomize the day of the month for subscriptions
        subDate.setDate(faker.number.int({ min: 1, max: 28 }));

        while (subDate <= now) {
            const subData = generateCommunitySubscription(community._id, new Date(subDate));
            await CommunitySubscription.create(subData);

            // If this is the most recent one, update community subscription fields
            if (new Date(subDate.getTime() + (subData.duration === 'monthly' ? 30 : 365) * 86400000) > now) {
                community.subscriptionStatus = subData.status === 'completed' ? 'active' : 'expired';
                community.planStartDate = subData.planStartDate;
                community.planEndDate = subData.planEndDate;
            }

            // Move to next period
            if (subData.duration === 'monthly') subDate.setMonth(subDate.getMonth() + 1);
            else subDate.setFullYear(subDate.getFullYear() + 1);
        }

        const managerData = generateManager(community._id);
        managerData.password = HASHED_PASSWORD;
        const manager = await CommunityManager.create(managerData);

        community.communityManager = manager._id;
        await community.save();

        communities.push({ community, manager });
        console.log(`   - Created Community: ${community.name}`);
    }
    return communities;
};

const seedWorkersAndSecurity = async (communities) => {
    console.log('ðŸ‘· Seeding Workers and Security...');
    const staff = [];

    for (const { community } of communities) {
        for (let w = 0; w < 3; w++) {
            const workerData = generateWorker(community._id);
            workerData.password = HASHED_PASSWORD;
            workerData.joiningDate = faker.date.between({ from: community.createdAt, to: new Date() });
            await Worker.create(workerData);
        }

        for (let s = 0; s < 2; s++) {
            const securityData = generateSecurity(community._id);
            securityData.password = HASHED_PASSWORD;
            securityData.joiningDate = faker.date.between({ from: community.createdAt, to: new Date() });
            const sec = await Security.create(securityData);
            staff.push(sec);
        }
    }
    return staff;
};

const seedAmenities = async (communities) => {
    console.log('ðŸŠ Seeding Amenities...');
    for (const { community } of communities) {
        for (let a = 0; a < 2; a++) {
            const amenityData = generateAmenity(community._id);
            await Amenity.create(amenityData);
        }
    }
};

const seedResidentsAndRelated = async (communities, staff) => {
    console.log('ðŸ‘¥ Seeding Residents, Payments, Issues, Visitors with scattered dates...');
    const now = new Date();

    for (const { community, manager } of communities) {
        const blocks = community.blocks;
        for (const block of blocks) {
            for (const flat of block.flats) {
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

                        let currentDate = new Date(moveInDate);
                        // Randomize payment day for each resident
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
                    } catch (err) { }
                }
            }
        }
        await Community.findByIdAndUpdate(community._id, { blocks: blocks });
    }
};

const run = async () => {
    await connectDB();
    HASHED_PASSWORD = await bcrypt.hash(PASSWORD_PLAIN, 10);

    // Note: We don't clear DB by default to be safe, but history will grow
    const communities = await seedCommunities(3);
    const staff = await seedWorkersAndSecurity(communities);
    await seedAmenities(communities);
    await seedResidentsAndRelated(communities, staff);

    console.log('\nâœ¨ Seeding Complete with Full Dynamic Ranges! âœ¨');
    process.exit(0);
};

run();


