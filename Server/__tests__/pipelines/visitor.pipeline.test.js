import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { connect, disconnect, clearDatabase } from "../setup.js";
import Visitor from "../../models/visitors.js";
import Resident from "../../models/resident.js";
import Community from "../../models/communities.js";
import Security from "../../models/security.js";
import {
  createPreApproval
} from "../../pipelines/Preapproval/controllers/manager.js";
import {
  getPreApprovals,
  updatePreApprovalStatus
} from "../../pipelines/Preapproval/controllers/security.js";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test_jwt_secret_key_32_characters_minimum";

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
});

beforeEach(async () => {
  await clearDatabase();
});

function createMockRes() {
  const res = {
    statusCode: 200,
    jsonData: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
  };
  return res;
}

describe("Visitor & Security Pre-Approval Pipeline Test Suite", () => {
  let community;
  let resident;
  let guard;

  beforeEach(async () => {
    community = await Community.create({
      name: "Green Acres Society",
      location: "North Block",
      status: "Active",
      subscriptionStatus: "active"
    });

    resident = await Resident.create({
      residentFirstname: "John",
      residentLastname: "Doe",
      email: "john.res@example.com",
      password: "password123",
      community: community._id,
      uCode: "B-202",
      role: "Resident"
    });

    guard = await Security.create({
      name: "Guard Sam",
      email: "guard.sam@example.com",
      password: "password123",
      contact: "9876543210",
      address: "Main Gate Security Cabin",
      community: community._id,
      role: "Security"
    });
  });

  describe("1. Resident Pass Generation", () => {
    test("should successfully generate a visitor pre-approval with QR token", async () => {
      const req = {
        user: { id: resident._id.toString(), community: community._id.toString() },
        body: {
          visitorName: "David Guest",
          contactNumber: "9876543210",
          dateOfVisit: "2026-09-10",
          timeOfVisit: "14:00",
          purpose: "Guest visit"
        }
      };
      const res = createMockRes();

      await createPreApproval(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.preapproval).toBeDefined();
      expect(res.jsonData.preapproval.visitorName).toBe("David Guest");
      expect(res.jsonData.preapproval.qrCode).toBeDefined();

      const inDb = await Visitor.findOne({ name: "David Guest" });
      expect(inDb).toBeDefined();
      expect(inDb.status).toBe("Pending");
    });

    test("should reject pre-approval creation when required fields are missing", async () => {
      const req = {
        user: { id: resident._id.toString(), community: community._id.toString() },
        body: {
          visitorName: "Incomplete Guest"
          // Missing contactNumber, dateOfVisit, timeOfVisit, purpose
        }
      };
      const res = createMockRes();

      await createPreApproval(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.message).toBe("Missing required fields");
    });
  });

  describe("2. Security Guard Gate Verification & Status Update", () => {
    test("guard can list all pre-approved visitors for their community", async () => {
      await Visitor.create({
        ID: "PA-12345",
        name: "Expected Visitor",
        contactNumber: "9123456789",
        purpose: "Delivery",
        scheduledAt: new Date(),
        approvedBy: resident._id,
        community: community._id,
        status: "Pending"
      });

      const req = {
        user: { id: guard._id.toString(), community: community._id.toString() }
      };
      const res = createMockRes();

      await getPreApprovals(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.preApprovalList.length).toBe(1);
      expect(res.jsonData.preApprovalList[0].name).toBe("Expected Visitor");
    });

    test("guard can update visitor status to Approved on gate entry", async () => {
      const visitor = await Visitor.create({
        ID: "PA-55555",
        name: "Delivery Agent",
        contactNumber: "9123456789",
        purpose: "Package",
        scheduledAt: new Date(),
        approvedBy: resident._id,
        community: community._id,
        status: "Pending"
      });

      const req = {
        user: { id: guard._id.toString(), community: community._id.toString() },
        body: { ID: visitor._id.toString(), status: "Approved" }
      };
      const res = createMockRes();

      await updatePreApprovalStatus(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);

      const inDb = await Visitor.findById(visitor._id);
      expect(inDb.status).toBe("Approved");
    });
  });
});
