import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

import { connect, disconnect, clearDatabase } from "../../setup.js";
import auth from "../../../controllers/shared/auth.js";
import { authorizeR, authorizeS } from "../../../controllers/shared/authorization.js";
import { attachCommunity } from "../../../middleware/attachCommunity.js";

import preapprovalResidentRouter from "../../../pipelines/Preapproval/router/manager.js";
import preapprovalSecurityRouter from "../../../pipelines/Preapproval/router/security.js";

import Community from "../../../models/communities.js";
import Resident from "../../../models/resident.js";
import Security from "../../../models/security.js";
import Visitor from "../../../models/visitors.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/resident", auth, authorizeR, attachCommunity, preapprovalResidentRouter);
app.use("/security", auth, authorizeS, attachCommunity, preapprovalSecurityRouter);

const jwtSecret = process.env.JWT_SECRET || "test-jwt-secret-min-32-characters";
process.env.JWT_SECRET = jwtSecret;

const createAuthToken = ({ id, userType, community }) =>
  jwt.sign({ id, userType, community }, jwtSecret, { expiresIn: "1h" });

describe("Preapproval Pipeline Integration", () => {
  let community;
  let resident;
  let securityUser;
  let residentToken;
  let securityToken;
  let managerToken;

  beforeAll(async () => {
    await connect();
  });

  beforeEach(async () => {
    community = await Community.create({
      name: "Palm Residency",
      location: "Downtown",
      communityCode: `PC-${Date.now()}`,
      subscriptionStatus: "active",
    });

    resident = await Resident.create({
      residentFirstname: "Asha",
      residentLastname: "Kapoor",
      uCode: "B-204",
      email: "resident.preapproval@test.com",
      password: "hashed-password",
      contact: "9000000001",
      community: community._id,
    });

    securityUser = await Security.create({
      name: "Guard One",
      email: "security.preapproval@test.com",
      password: "hashed-password",
      contact: "9000000002",
      address: "Main Gate Office",
      community: community._id,
    });

    residentToken = createAuthToken({
      id: resident._id.toString(),
      userType: "Resident",
      community: community._id.toString(),
    });

    securityToken = createAuthToken({
      id: securityUser._id.toString(),
      userType: "Security",
      community: community._id.toString(),
    });

    managerToken = createAuthToken({
      id: resident._id.toString(),
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

  describe("Resident Preapproval Endpoints", () => {
    test("POST /resident/preapproval returns 201 and creates preapproval", async () => {
      const res = await request(app)
        .post("/resident/preapproval")
        .set("Authorization", `Bearer ${residentToken}`)
        .send({
          visitorName: "Rahul Mehta",
          contactNumber: "9876543210",
          dateOfVisit: "2099-12-30",
          timeOfVisit: "10:30",
          purpose: "Personal visit",
        });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          preapproval: expect.objectContaining({
            _id: expect.any(String),
            visitorName: "Rahul Mehta",
            contactNumber: "9876543210",
            purpose: "Personal visit",
            qrToken: expect.any(String),
            qrCode: expect.any(String),
          }),
        }),
      );

      const created = await Visitor.findById(res.body.preapproval._id);
      expect(created).toBeTruthy();
      expect(created.approvedBy.toString()).toBe(resident._id.toString());
      expect(created.community.toString()).toBe(community._id.toString());
    });

    test("POST /resident/preapproval returns 400 for missing body fields", async () => {
      const res = await request(app)
        .post("/resident/preapproval")
        .set("Authorization", `Bearer ${residentToken}`)
        .send({
          visitorName: "Rahul Mehta",
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Missing required fields/i);
    });

    test("GET /resident/preApprovals returns 200 and visitor stats", async () => {
      await Visitor.create({
        ID: "PA-0001",
        name: "Sample Visitor",
        contactNumber: "9876543210",
        purpose: "Delivery",
        scheduledAt: new Date("2099-12-30T10:00:00Z"),
        approvedBy: resident._id,
        community: community._id,
        status: "Approved",
      });

      const res = await request(app)
        .get("/resident/preApprovals")
        .set("Authorization", `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          visitors: expect.any(Array),
          counts: expect.any(Object),
        }),
      );
      expect(res.body.visitors.length).toBeGreaterThan(0);
    });

    test("GET /resident/preapproval/qr/:id returns QR payload", async () => {
      const visitor = await Visitor.create({
        ID: "PA-0002",
        name: "QR Visitor",
        contactNumber: "9876543210",
        purpose: "Meeting",
        scheduledAt: new Date("2099-12-30T12:00:00Z"),
        approvedBy: resident._id,
        community: community._id,
        qrToken: "sample-token",
        qrCode: "data:image/png;base64,sample",
      });

      const res = await request(app)
        .get(`/resident/preapproval/qr/${visitor._id}`)
        .set("Authorization", `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          qrCodeBase64: expect.any(String),
          name: "QR Visitor",
        }),
      );
    });

    test("DELETE /resident/preapproval/cancel/:id deletes request", async () => {
      const visitor = await Visitor.create({
        ID: "PA-0003",
        name: "Cancel Visitor",
        contactNumber: "9876543210",
        purpose: "Courier",
        approvedBy: resident._id,
        community: community._id,
      });

      const res = await request(app)
        .delete(`/resident/preapproval/cancel/${visitor._id}`)
        .set("Authorization", `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          message: expect.stringMatching(/canceled successfully/i),
        }),
      );
      expect(await Visitor.findById(visitor._id)).toBeNull();
    });

    test("returns 401 when token is missing", async () => {
      const res = await request(app).get("/resident/preApprovals");
      expect(res.status).toBe(401);
    });

    test("returns 401 when token is invalid", async () => {
      const res = await request(app)
        .get("/resident/preApprovals")
        .set("Authorization", "Bearer invalid-token");
      expect(res.status).toBe(401);
    });

    test("returns 403 when manager token accesses resident preapproval route", async () => {
      const res = await request(app)
        .get("/resident/preApprovals")
        .set("Authorization", `Bearer ${managerToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe("Security Preapproval Endpoints", () => {
    let visitor;

    beforeEach(async () => {
      visitor = await Visitor.create({
        ID: "PA-0100",
        name: "Gate Visitor",
        contactNumber: "9123456780",
        purpose: "Check in",
        approvedBy: resident._id,
        community: community._id,
        qrToken: "gate-qr-token",
        status: "Pending",
      });
    });

    test("GET /security/preApproval returns community preapproval list", async () => {
      const res = await request(app)
        .get("/security/preApproval")
        .set("Authorization", `Bearer ${securityToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          preApprovalList: expect.any(Array),
        }),
      );
      expect(res.body.preApprovalList.length).toBeGreaterThan(0);
    });

    test("POST /security/preApproval/action updates status", async () => {
      const res = await request(app)
        .post("/security/preApproval/action")
        .set("Authorization", `Bearer ${securityToken}`)
        .send({
          ID: visitor._id.toString(),
          status: "Approved",
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const updated = await Visitor.findById(visitor._id);
      expect(updated.status).toBe("Approved");
    });

    test("POST /security/verify-qr toggles check-in state", async () => {
      const res = await request(app)
        .post("/security/verify-qr")
        .set("Authorization", `Bearer ${securityToken}`)
        .send({ token: "gate-qr-token" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          visitor: expect.objectContaining({
            _id: visitor._id.toString(),
            isCheckedIn: true,
            status: "Active",
          }),
        }),
      );
    });

    test("returns 403 when resident token accesses security preapproval route", async () => {
      const res = await request(app)
        .get("/security/preApproval")
        .set("Authorization", `Bearer ${residentToken}`);
      expect(res.status).toBe(403);
    });
  });
});
