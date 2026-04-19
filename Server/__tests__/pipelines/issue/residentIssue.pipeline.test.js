import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

import { connect, disconnect, clearDatabase } from "../../setup.js";
import auth from "../../../controllers/shared/auth.js";
import { authorizeR } from "../../../controllers/shared/authorization.js";
import { attachCommunity } from "../../../middleware/attachCommunity.js";
import issueResidentRouter from "../../../pipelines/issue/router/resident.js";

import Community from "../../../models/communities.js";
import Resident from "../../../models/resident.js";
import CommunityManager from "../../../models/cManager.js";
import Issue from "../../../models/issues.js";
import Payment from "../../../models/payment.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/resident", auth, authorizeR, attachCommunity, issueResidentRouter);

const jwtSecret = process.env.JWT_SECRET || "test-jwt-secret-min-32-characters";
process.env.JWT_SECRET = jwtSecret;

const createAuthToken = ({ id, userType, community }) =>
  jwt.sign({ id, userType, community }, jwtSecret, { expiresIn: "1h" });

describe("Resident Issues Pipeline Integration", () => {
  let community;
  let resident;
  let manager;
  let residentToken;
  let managerToken;

  let confirmableIssue;
  let rejectableIssue;
  let deletableIssue;
  let feedbackIssue;

  beforeAll(async () => {
    await connect();
  });

  beforeEach(async () => {
    community = await Community.create({
      name: "Test Community",
      location: "Test Location",
      communityCode: `TC-${Date.now()}`,
      subscriptionStatus: "active",
    });

    manager = await CommunityManager.create({
      name: "Manager One",
      email: "manager.issue@test.com",
      password: "hashed-password",
      contact: "9999999999",
      assignedCommunity: community._id,
    });

    community.communityManager = manager._id;
    await community.save();

    resident = await Resident.create({
      residentFirstname: "Riya",
      residentLastname: "Shah",
      uCode: "A-101",
      email: "resident.issue@test.com",
      password: "hashed-password",
      contact: "8888888888",
      community: community._id,
    });

    confirmableIssue = await Issue.create({
      title: "Tap leakage in kitchen",
      description: "There is a major leakage under the sink in kitchen area.",
      category: "Plumbing",
      categoryType: "Resident",
      resident: resident._id,
      community: community._id,
      location: resident.uCode,
      status: "Resolved (Awaiting Confirmation)",
    });

    rejectableIssue = await Issue.create({
      title: "Ceiling dampness issue",
      description: "The bedroom ceiling is still damp and needs rework urgently.",
      category: "Maintenance",
      categoryType: "Resident",
      resident: resident._id,
      community: community._id,
      location: resident.uCode,
      status: "Resolved (Awaiting Confirmation)",
    });

    deletableIssue = await Issue.create({
      title: "Light flickering in hall",
      description: "The hallway light keeps flickering and needs inspection.",
      category: "Electrical",
      categoryType: "Resident",
      resident: resident._id,
      community: community._id,
      location: resident.uCode,
      status: "Pending Assignment",
    });

    feedbackIssue = await Issue.create({
      title: "Drain block resolved",
      description: "Drain blockage was fixed but feedback needs to be submitted now.",
      category: "Plumbing",
      categoryType: "Resident",
      resident: resident._id,
      community: community._id,
      location: resident.uCode,
      status: "Payment Pending",
      estimatedCost: 350,
    });

    resident.raisedIssues = [deletableIssue._id];
    await resident.save();

    residentToken = createAuthToken({
      id: resident._id.toString(),
      userType: "Resident",
      community: community._id.toString(),
    });

    managerToken = createAuthToken({
      id: manager._id.toString(),
      userType: "CommunityManager",
      community: community._id.toString(),
    });
  });

  afterEach(async () => {
    await clearDatabase();
  });

  afterAll(async () => {
    await disconnect();
  });

  describe("POST /resident/issue/raise", () => {
    test("returns 201 and created issue payload for valid request", async () => {
      const payload = {
        title: "Bathroom shower leaking",
        description: "Shower tap is leaking continuously and water is wasting.",
        category: "Plumbing",
        categoryType: "Resident",
      };

      const res = await request(app)
        .post("/resident/issue/raise")
        .set("Authorization", `Bearer ${residentToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          issue: expect.objectContaining({
            _id: expect.any(String),
            title: payload.title,
            category: payload.category,
            categoryType: payload.categoryType,
            resident: resident._id.toString(),
            community: community._id.toString(),
          }),
        })
      );
    });

    test("returns 400 for invalid body payload", async () => {
      const res = await request(app)
        .post("/resident/issue/raise")
        .set("Authorization", `Bearer ${residentToken}`)
        .send({
          title: "Bad",
          description: "short",
          category: "InvalidCategory",
          categoryType: "Resident",
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: "Validation failed",
        })
      );
    });

    test("returns 401 when token is missing", async () => {
      const res = await request(app).post("/resident/issue/raise").send({
        title: "Bathroom shower leaking",
        description: "Shower tap is leaking continuously and water is wasting.",
        category: "Plumbing",
        categoryType: "Resident",
      });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized/i);
    });

    test("returns 401 when JWT is invalid", async () => {
      const res = await request(app)
        .post("/resident/issue/raise")
        .set("Authorization", "Bearer invalid-token")
        .send({
          title: "Bathroom shower leaking",
          description: "Shower tap is leaking continuously and water is wasting.",
          category: "Plumbing",
          categoryType: "Resident",
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/invalid|expired/i);
    });

    test("returns 403 when non-resident role accesses resident route", async () => {
      const res = await request(app)
        .post("/resident/issue/raise")
        .set("Authorization", `Bearer ${managerToken}`)
        .send({
          title: "Bathroom shower leaking",
          description: "Shower tap is leaking continuously and water is wasting.",
          category: "Plumbing",
          categoryType: "Resident",
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/Forbidden/i);
    });
  });

  describe("GET /resident/issue/data", () => {
    test("returns 200 with resident issue list schema", async () => {
      const res = await request(app)
        .get("/resident/issue/data")
        .set("Authorization", `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("issues");
      expect(Array.isArray(res.body.issues)).toBe(true);
      expect(res.body.issues.length).toBeGreaterThan(0);
      expect(res.body.issues[0]).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
          resident: resident._id.toString(),
          community: community._id.toString(),
        })
      );
    });
  });

  describe("GET /resident/issue/data/:id", () => {
    test("returns 200 with issue details for valid issue id", async () => {
      const res = await request(app)
        .get(`/resident/issue/data/${confirmableIssue._id}`)
        .set("Authorization", `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          _id: confirmableIssue._id.toString(),
          resident: expect.objectContaining({
            _id: resident._id.toString(),
          }),
          community: community._id.toString(),
        })
      );
    });
  });

  describe("POST /resident/issue/confirmIssue/:id", () => {
    test("returns 200 and moves issue to payment pending", async () => {
      const res = await request(app)
        .post(`/resident/issue/confirmIssue/${confirmableIssue._id}`)
        .set("Authorization", `Bearer ${residentToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          message: expect.stringMatching(/confirmed/i),
        })
      );

      const updated = await Issue.findById(confirmableIssue._id);
      expect(updated.status).toBe("Payment Pending");
    });

    test("returns 400 for invalid object id parameter", async () => {
      const res = await request(app)
        .post("/resident/issue/confirmIssue/not-a-valid-id")
        .set("Authorization", `Bearer ${residentToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: "Validation failed",
        })
      );
    });
  });

  describe("POST /resident/issue/rejectIssueResolution/:id", () => {
    test("returns 200 and reopens issue", async () => {
      const res = await request(app)
        .post(`/resident/issue/rejectIssueResolution/${rejectableIssue._id}`)
        .set("Authorization", `Bearer ${residentToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          message: expect.stringMatching(/reopened/i),
        })
      );

      const updated = await Issue.findById(rejectableIssue._id);
      expect(updated.status).toBe("Reopened");
    });
  });

  describe("DELETE /resident/issue/delete/:issueID", () => {
    test("returns 200 and deletes issue while updating resident raisedIssues", async () => {
      const res = await request(app)
        .delete(`/resident/issue/delete/${deletableIssue._id}`)
        .set("Authorization", `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          message: expect.stringMatching(/deleted/i),
        })
      );

      const deleted = await Issue.findById(deletableIssue._id);
      expect(deleted).toBeNull();

      const updatedResident = await Resident.findById(resident._id);
      expect(updatedResident.raisedIssues.map((id) => id.toString())).not.toContain(
        deletableIssue._id.toString()
      );
    });
  });

  describe("POST /resident/issue/submitFeedback", () => {
    test("returns 200 and creates payment record for payment-pending issue", async () => {
      const res = await request(app)
        .post("/resident/issue/submitFeedback")
        .set("Authorization", `Bearer ${residentToken}`)
        .send({
          id: feedbackIssue._id.toString(),
          feedback: "Issue was fixed properly and quickly.",
          rating: 5,
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          message: expect.stringMatching(/payment initiated/i),
        })
      );

      const updatedIssue = await Issue.findById(feedbackIssue._id);
      expect(updatedIssue.feedback).toBe("Issue was fixed properly and quickly.");
      expect(updatedIssue.rating).toBe(5);
      expect(updatedIssue.payment).toBeDefined();

      const payment = await Payment.findById(updatedIssue.payment);
      expect(payment).toBeTruthy();
      expect(payment.title).toBe(feedbackIssue.title);
      expect(payment.sender.toString()).toBe(resident._id.toString());
      expect(payment.receiver.toString()).toBe(manager._id.toString());
      expect(payment.community.toString()).toBe(community._id.toString());
      expect(payment.amount).toBe(350);
      expect(payment.status).toBe("Pending");
      expect(payment.belongTo).toBe("Issue");
    });
  });
});
