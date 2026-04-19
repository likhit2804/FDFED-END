import express from "express";
import request from "supertest";
import jwt from "jsonwebtoken";
import cookieParser from "cookie-parser";

import { connect, disconnect, clearDatabase } from "../../setup.js";
import auth from "../../../controllers/shared/auth.js";
import { authorizeR } from "../../../controllers/shared/authorization.js";
import { attachCommunity } from "../../../middleware/attachCommunity.js";
import csbResidentRouter from "../../../pipelines/CSB/router/resident.js";

import Community from "../../../models/communities.js";
import Resident from "../../../models/resident.js";
import Amenity from "../../../models/Amenities.js";
import CommonSpaces from "../../../models/commonSpaces.js";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/resident", auth, authorizeR, attachCommunity, csbResidentRouter);

const jwtSecret = process.env.JWT_SECRET || "test-jwt-secret-min-32-characters";
process.env.JWT_SECRET = jwtSecret;

const createAuthToken = ({ id, userType, community }) =>
  jwt.sign({ id, userType, community }, jwtSecret, { expiresIn: "1h" });

describe("Common Space Booking Pipeline Integration", () => {
  let community;
  let resident;
  let residentToken;
  let managerToken;
  let amenity;

  beforeAll(async () => {
    await connect();
  });

  beforeEach(async () => {
    community = await Community.create({
      name: "Lakeview Community",
      location: "Sector 12",
      communityCode: `LC-${Date.now()}`,
      subscriptionStatus: "active",
    });

    resident = await Resident.create({
      residentFirstname: "Nina",
      residentLastname: "Das",
      uCode: "C-102",
      email: "resident.csb@test.com",
      password: "hashed-password",
      contact: "9222222222",
      community: community._id,
    });

    amenity = await Amenity.create({
      type: "Gym",
      name: "Central Gym",
      Type: "Slot",
      bookable: true,
      rent: 200,
      community: community._id,
    });

    community.commonSpaces = [amenity._id];
    await community.save();

    residentToken = createAuthToken({
      id: resident._id.toString(),
      userType: "Resident",
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

  describe("Resident CSB Endpoints", () => {
    test("GET /resident/commonSpace returns bookings and spaces", async () => {
      const res = await request(app)
        .get("/resident/commonSpace")
        .set("Authorization", `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          bookings: expect.any(Array),
          spaces: expect.any(Array),
        }),
      );
      expect(res.body.spaces.length).toBeGreaterThan(0);
    });

    test("POST /resident/commonSpace creates booking successfully", async () => {
      const res = await request(app)
        .post("/resident/commonSpace")
        .set("Authorization", `Bearer ${residentToken}`)
        .send({
          newBooking: {
            facility: "Central Gym",
            fid: amenity._id.toString(),
            purpose: "Workout session",
            Date: "2099-12-31",
            from: "10:00",
            to: "11:00",
            Type: "Slot",
            timeSlots: ["10:00"],
          },
          data: { amount: 0 },
        });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          message: expect.stringMatching(/submitted successfully/i),
          space: expect.objectContaining({
            _id: expect.any(String),
            name: "Central Gym",
            bookedBy: resident._id.toString(),
          }),
        }),
      );

      const booking = await CommonSpaces.findById(res.body.space._id);
      expect(booking).toBeTruthy();
      expect(booking.Type).toBe("Slot");
      expect(booking.status).toBe("Booked");
    });

    test("POST /resident/commonSpace returns 400 for invalid body", async () => {
      const res = await request(app)
        .post("/resident/commonSpace")
        .set("Authorization", `Bearer ${residentToken}`)
        .send({
          newBooking: {
            fid: amenity._id.toString(),
            Date: "2099-12-31",
          },
          data: { amount: 0 },
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/required/i),
        }),
      );
    });

    test("POST /resident/commonSpace/:id returns booking details", async () => {
      const booking = await CommonSpaces.create({
        name: "Central Gym",
        description: "Workout session",
        Date: "2099-12-31",
        from: "09:00",
        to: "10:00",
        Type: "Slot",
        amount: 0,
        status: "Booked",
        paymentStatus: "Success",
        bookedBy: resident._id,
        community: community._id,
      });

      const res = await request(app)
        .post(`/resident/commonSpace/${booking._id}`)
        .set("Authorization", `Bearer ${residentToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          commonspace: expect.objectContaining({
            _id: booking._id.toString(),
            bookedBy: resident._id.toString(),
          }),
        }),
      );
    });

    test("PUT /resident/booking/cancel/:id cancels booking and returns refund", async () => {
      const booking = await CommonSpaces.create({
        name: "Central Gym",
        description: "Evening session",
        Date: "2099-12-31",
        from: "18:00",
        to: "19:00",
        Type: "Slot",
        amount: 100,
        status: "Booked",
        paymentStatus: "Success",
        bookedBy: resident._id,
        community: community._id,
      });

      resident.bookedCommonSpaces = [booking._id];
      await resident.save();

      const res = await request(app)
        .put(`/resident/booking/cancel/${booking._id}`)
        .set("Authorization", `Bearer ${residentToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          message: expect.stringMatching(/cancelled successfully/i),
          refundAmount: expect.any(Number),
          refundId: expect.any(String),
        }),
      );

      const updated = await CommonSpaces.findById(booking._id);
      expect(updated.status).toBe("Cancelled");
    });

    test("GET /resident/api/facilities returns facilities array", async () => {
      const res = await request(app)
        .get("/resident/api/facilities")
        .set("Authorization", `Bearer ${residentToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.objectContaining({
          success: true,
          facilities: expect.any(Array),
        }),
      );
    });

    test("returns 401 when token is missing", async () => {
      const res = await request(app).get("/resident/commonSpace");
      expect(res.status).toBe(401);
    });

    test("returns 401 when token is invalid", async () => {
      const res = await request(app)
        .get("/resident/commonSpace")
        .set("Authorization", "Bearer invalid-token");
      expect(res.status).toBe(401);
    });

    test("returns 403 when manager token accesses resident csb route", async () => {
      const res = await request(app)
        .get("/resident/commonSpace")
        .set("Authorization", `Bearer ${managerToken}`);
      expect(res.status).toBe(403);
    });
  });
});
