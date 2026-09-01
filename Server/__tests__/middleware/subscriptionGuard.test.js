import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { connect, disconnect, clearDatabase } from "../setup.js";
import Community from "../../models/communities.js";
import checkSubscriptionStatus from "../../middleware/subcriptionStatus.js";

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
});

beforeEach(async () => {
  await clearDatabase();
});

function createMockReqRes(options = {}) {
  const req = {
    path: options.path || "/api/dashboard",
    user: options.user || null,
  };
  const res = {
    statusCode: 200,
    jsonData: null,
    locals: {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.jsonData = data;
      return this;
    },
  };
  const next = jest.fn();
  return { req, res, next };
}

describe("Subscription Status Middleware Guard Test Suite", () => {
  let activeCommunity;
  let expiredCommunity;

  beforeEach(async () => {
    activeCommunity = await Community.create({
      name: "Sunnyvale Towers",
      location: "Sector 5",
      subscriptionStatus: "active"
    });

    expiredCommunity = await Community.create({
      name: "Old Pine Heights",
      location: "Sector 1",
      subscriptionStatus: "expired"
    });
  });

  test("should allow request when community subscription is active", async () => {
    const { req, res, next } = createMockReqRes({
      user: {
        id: new mongoose.Types.ObjectId().toString(),
        userType: "Resident",
        community: activeCommunity._id.toString()
      }
    });

    await checkSubscriptionStatus(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.locals.communityStatus).toBe("active");
  });

  test("should block resident with 402 SUBSCRIPTION_EXPIRED when community subscription is expired", async () => {
    const { req, res, next } = createMockReqRes({
      user: {
        id: new mongoose.Types.ObjectId().toString(),
        userType: "Resident",
        community: expiredCommunity._id.toString()
      }
    });

    await checkSubscriptionStatus(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(402);
    expect(res.jsonData.code).toBe("SUBSCRIPTION_EXPIRED");
    expect(res.jsonData.success).toBe(false);
  });

  test("should bypass check for Admin and CommunityManager roles", async () => {
    const { req, res, next } = createMockReqRes({
      user: {
        id: new mongoose.Types.ObjectId().toString(),
        userType: "Admin",
        community: expiredCommunity._id.toString()
      }
    });

    await checkSubscriptionStatus(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  test("should bypass check for excluded routes like /login and /logout", async () => {
    const { req, res, next } = createMockReqRes({
      path: "/login",
      user: {
        id: new mongoose.Types.ObjectId().toString(),
        userType: "Resident",
        community: expiredCommunity._id.toString()
      }
    });

    await checkSubscriptionStatus(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
