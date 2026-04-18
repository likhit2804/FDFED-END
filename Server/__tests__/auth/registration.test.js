import { connect, disconnect, clearDatabase } from "../setup.js";
import mongoose from "mongoose";

let Flat, Resident, Community;

beforeAll(async () => {
  await connect();
  Flat = (await import("../../models/flats.js")).default;
  Resident = (await import("../../models/resident.js")).default;
  Community = (await import("../../models/communities.js")).default;
});

afterEach(async () => await clearDatabase());
afterAll(async () => await disconnect());

describe("Registration Flow", () => {
  let community, block;

  beforeEach(async () => {
    community = await Community.create({
      name: "Test Community",
      location: "Test City",
      manager: new mongoose.Types.ObjectId(),
    });
  });

  test("should find flat by valid registration code", async () => {
    const flat = await Flat.create({
      flatNumber: "101",
      floor: 1,
      block: new mongoose.Types.ObjectId(),
      community: community._id,
      registrationCode: "REG-ABC-123",
      status: "Vacant",
    });
    const found = await Flat.findOne({ registrationCode: "REG-ABC-123" });
    expect(found).not.toBeNull();
    expect(found.status).toBe("Vacant");
  });

  test("should reject invalid registration code", async () => {
    const found = await Flat.findOne({ registrationCode: "FAKE-CODE" });
    expect(found).toBeNull();
  });

  test("should reject already-occupied flat", async () => {
    await Flat.create({
      flatNumber: "102",
      floor: 1,
      block: new mongoose.Types.ObjectId(),
      community: community._id,
      registrationCode: "REG-USED",
      status: "Occupied",
    });
    const found = await Flat.findOne({
      registrationCode: "REG-USED",
      status: "Vacant",
    });
    expect(found).toBeNull();
  });

  test("should create resident with valid data", async () => {
    const resident = await Resident.create({
      residentFirstname: "New",
      residentLastname: "Resident",
      email: "new@test.com",
      password: "tempPassword123",
      contact: "9999999999",
      community: community._id,
      uCode: "A-101",
    });
    expect(resident._id).toBeDefined();
    expect(resident.email).toBe("new@test.com");
  });

  test("should reject duplicate email in same community", async () => {
    await Resident.create({
      residentFirstname: 'First', residentLastname: 'User',
      email: "dup@test.com",
      password: "pw",
      contact: "1111111111",
      community: community._id,
      uCode: "A-101",
    });
    await expect(
      Resident.create({
        name: "Second",
        email: "dup@test.com",
        password: "pw",
        contact: "2222222222",
        community: community._id,
        uCode: "A-102",
      }),
    ).rejects.toThrow();
  });

  test("should store password as-is (hashing is done in controller)", async () => {
    const resident = await Resident.create({
      residentFirstname: 'PW', residentLastname: 'Test',
      email: "pw@test.com",
      password: "plaintext",
      contact: "3333333333",
      community: community._id,
      uCode: "B-101",
    });
    // Model stores it as-is; controller should hash before saving
    expect(resident.password).toBe("plaintext");
  });
});
