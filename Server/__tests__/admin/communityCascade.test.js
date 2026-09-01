import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { connect, disconnect, clearDatabase } from "../setup.js";
import Community from "../../models/communities.js";
import Resident from "../../models/resident.js";
import Worker from "../../models/workers.js";
import Security from "../../models/security.js";
import Issue from "../../models/issues.js";
import Payment from "../../models/payment.js";
import { deleteCommunityCascade } from "../../utils/communityCascadeDelete.js";

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
});

beforeEach(async () => {
  await clearDatabase();
});

describe("Admin Community Cascade Deletion Test Suite", () => {
  test("should cascade delete all linked residents, workers, issues, and payments when a community is removed", async () => {
    const community = await Community.create({
      name: "Grand Horizon Estates",
      location: "Central City",
      status: "Active"
    });

    const resident = await Resident.create({
      residentFirstname: "Alice",
      residentLastname: "Smith",
      email: "alice.cascade@example.com",
      password: "pass",
      community: community._id,
      uCode: "GH-101"
    });

    const worker = await Worker.create({
      name: "Bob Plumber",
      email: "bob.worker@example.com",
      password: "pass",
      contact: "9876543210",
      address: "Staff Quarters",
      salary: 15000,
      community: community._id,
      jobRole: ["Plumber"]
    });

    const security = await Security.create({
      name: "Sam Guard",
      email: "sam.guard@example.com",
      password: "pass",
      contact: "9876543210",
      address: "Main Gate Security Cabin",
      community: community._id
    });

    const issue = await Issue.create({
      title: "Pipe leak",
      category: "Plumbing",
      categoryType: "Resident",
      description: "Leak under kitchen sink",
      location: "GH-101",
      resident: resident._id,
      community: community._id
    });

    const payment = await Payment.create({
      title: "Monthly Rent",
      sender: resident._id,
      receiver: resident._id,
      amount: 1500,
      community: community._id
    });

    // Execute Cascade Delete
    const result = await deleteCommunityCascade(community._id.toString());

    expect(result).toBeDefined();
    expect(result.deletedCommunityId).toEqual(community._id);
    expect(result.deletedCounts.residents).toBe(1);
    expect(result.deletedCounts.workers).toBe(1);
    expect(result.deletedCounts.securities).toBe(1);
    expect(result.deletedCounts.issues).toBe(1);
    expect(result.deletedCounts.payments).toBe(1);

    // Verify all records were removed from database
    expect(await Community.findById(community._id)).toBeNull();
    expect(await Resident.findById(resident._id)).toBeNull();
    expect(await Worker.findById(worker._id)).toBeNull();
    expect(await Security.findById(security._id)).toBeNull();
    expect(await Issue.findById(issue._id)).toBeNull();
    expect(await Payment.findById(payment._id)).toBeNull();
  });
});
