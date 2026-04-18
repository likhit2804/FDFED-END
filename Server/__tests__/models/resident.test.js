import { connect, disconnect, clearDatabase } from '../setup.js';
import mongoose from 'mongoose';

// Import model AFTER connecting
let Resident, Community;

beforeAll(async () => {
  await connect();
  Resident = (await import('../../models/resident.js')).default;
  Community = (await import('../../models/communities.js')).default;
});

afterEach(async () => await clearDatabase());
afterAll(async () => await disconnect());

describe('Resident Model', () => {
  const validResident = {
    residentFirstname: 'John',
    residentLastname: 'Doe',
    email: 'john@test.com',
    password: 'hashedPassword123',
    contact: '9876543210',
    community: new mongoose.Types.ObjectId(),
    uCode: 'A-101',
  };

  test('should create a resident with valid data', async () => {
    const resident = await Resident.create(validResident);
    expect(resident._id).toBeDefined();
    expect(resident.residentFirstname).toBe('John'); 
    expect(resident.residentLastname).toBe('Doe');
    expect(resident.email).toBe('john@test.com');
  });

  test('should fail without required name', async () => {
    const { residentFirstname, ...noName } = validResident; 
    await expect(Resident.create(noName)).rejects.toThrow();
  });

  test('should fail without required email', async () => {
    const { email, ...noEmail } = validResident;
    await expect(Resident.create(noEmail)).rejects.toThrow();
  });

  test('should enforce email uniqueness', async () => {
    await Resident.create(validResident);
    const duplicate = { ...validResident, uCode: 'B-202' };
    await expect(Resident.create(duplicate)).rejects.toThrow();
  });

  test('should store community reference as ObjectId', async () => {
    const resident = await Resident.create(validResident);
    expect(resident.community).toBeInstanceOf(mongoose.Types.ObjectId);
  });

  test('should have uCode field', async () => {
    const resident = await Resident.create(validResident);
    expect(resident.uCode).toBe('A-101');
  });

  test('should have notifications array', async () => {
    const resident = await Resident.create(validResident);
    expect(Array.isArray(resident.notifications)).toBe(true);
  });

  test('should have createdAt timestamp', async () => {
    const resident = await Resident.create(validResident);
    expect(resident.createdAt).toBeDefined();
  });
});