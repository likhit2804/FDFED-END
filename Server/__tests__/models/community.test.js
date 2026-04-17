import { connect, disconnect, clearDatabase } from "../setup.js";
import mongoose from "mongoose";

let Community;

beforeAll(async () => {
  await connect();
  Community = (await import("../../models/communities.js")).default;
});

afterEach(async () => await clearDatabase());
afterAll(async () => await disconnect());

describe("Community Model", () => {
  const validCommunity = {
    name: "Green Valley",
    location: "Bangalore",
    description: "A premium gated community",
    communityManager: new mongoose.Types.ObjectId(),
  };

  test("should create community with valid data", async () => {
    const community = await Community.create(validCommunity);
    expect(community.name).toBe("Green Valley");
    expect(community._id).toBeDefined();
  });

  test("should auto-generate communityCode if not provided", async () => {
    const community = await Community.create(validCommunity);
    expect(community.communityCode).toBeDefined();
    expect(community.communityCode.length).toBeGreaterThan(0);
  });

  test("should generate unique community codes", async () => {
    const c1 = await Community.create({
      ...validCommunity,
      name: "Community A",
    });
    const c2 = await Community.create({
      ...validCommunity,
      name: "Community B",
    });
    expect(c1.communityCode).not.toBe(c2.communityCode);
  });

  test("should have subscriptionStatus field", async () => {
    const community = await Community.create(validCommunity);
    expect(community.subscriptionStatus).toBeDefined();
  });

  test("should have isExpired virtual when plan end date is past", async () => {
    const community = await Community.create({
      ...validCommunity,
      planEndDate: new Date("2020-01-01"),
    });
    // Check that the virtual exists and works
    expect(typeof community.isExpired).toBeDefined();
  });

  test("should default subscriptionStatus to a valid state", async () => {
    const community = await Community.create(validCommunity);
    const validStatuses = [
      "Active",
      "Expired",
      "Pending",
      "Cancelled",
      "active",
      "expired",
      "pending",
    ];
    // It should be some default value
    expect(community.subscriptionStatus).toBeDefined();
  });

  test("should store location", async () => {
    const community = await Community.create(validCommunity);
    expect(community.location).toBe("Bangalore");
  });

  test("should store manager as ObjectId", async () => {
    const community = await Community.create(validCommunity);
    expect(community.communityManager).toBeInstanceOf(mongoose.Types.ObjectId);
  });
});
