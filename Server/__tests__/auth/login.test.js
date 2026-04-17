import { connect, disconnect, clearDatabase } from '../setup.js';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';

let Resident, CommunityManager, Worker, Security, Admin;
let VerifyR, VerifyC, VerifyW, VerifyS, VerifyA;

beforeAll(async () => {
  await connect();
  Resident = (await import('../../models/resident.js')).default;
  CommunityManager = (await import('../../models/cManager.js')).default;
  Worker = (await import('../../models/workers.js')).default;
  Security = (await import('../../models/security.js')).default;
  Admin = (await import('../../models/admin.js')).default;
  
  const loginModule = await import('../../controllers/shared/loginController.js');
  VerifyR = loginModule.VerifyR;
  VerifyC = loginModule.VerifyC;
  VerifyW = loginModule.VerifyW;
  VerifyS = loginModule.VerifyS;
  VerifyA = loginModule.VerifyA;
});

afterEach(async () => await clearDatabase());
afterAll(async () => await disconnect());

const hashedPw = await bcrypt.hash('password123', 10);
const communityId = new mongoose.Types.ObjectId();

describe('Login Verification', () => {
  test('should verify Resident credentials', async () => {
    await Resident.create({
      residentFirstname: 'Test', residentLastname: 'Resident', email: 'r@test.com', password: hashedPw,
      contact: '1234567890', community: communityId, uCode: 'A-101',
    });
    const result = await VerifyR('r@test.com', 'password123');
    expect(result).not.toBeNull();
    expect(result.userPayload.email).toBe('r@test.com');
    expect(result.userPayload.userType).toBe('Resident');
  });

  test('should verify CommunityManager credentials', async () => {
    await CommunityManager.create({
      name: 'Test Manager', email: 'cm@test.com', password: hashedPw,
      contact: '1234567890', assignedCommunity: communityId,
    });
    const result = await VerifyC('cm@test.com', 'password123');
    expect(result).not.toBeNull();
    expect(result.userPayload.userType).toBe('CommunityManager');
  });

  test('should verify Admin credentials', async () => {
    await Admin.create({
      name: 'Admin', email: 'admin@test.com', password: hashedPw,
    });
    const result = await VerifyA('admin@test.com', 'password123');
    expect(result).not.toBeNull();
  });

  test('should verify Worker credentials', async () => {
    await Worker.create({
      name: 'Worker', email: 'w@test.com', password: hashedPw,
      community: communityId, jobRole: 'Plumber',
      contact: '1234567890', address: '123 Test St', salary: 5000
    });
    const result = await VerifyW('w@test.com', 'password123');
    expect(result).not.toBeNull();
  });

  test('should verify Security credentials', async () => {
    await Security.create({
      name: 'Guard', email: 's@test.com', password: hashedPw,
      community: communityId,contact: '1234567890', address: '123 Test St'
    });
    const result = await VerifyS('s@test.com', 'password123');
    expect(result).not.toBeNull();
  });

  test('should reject wrong password', async () => {
    await Resident.create({
      residentFirstname: 'Shape', residentLastname: 'User', email: 'wrong@test.com', password: hashedPw,
      contact: '0000000000', community: communityId, uCode: 'B-102',
    });
    const result = await VerifyR('wrong@test.com', 'wrongpassword');
    expect(result).toBeNull();
  });

  test('should reject non-existent email', async () => {
    const result = await VerifyR('ghost@test.com', 'password123');
    expect(result).toBeNull();
  });

  test('should return userPayload with id, email, userType', async () => {
    await Resident.create({
      residentFirstname: 'Shape', residentLastname: 'User', email: 'shape@test.com', password: hashedPw,
      contact: '1111111111', community: communityId, uCode: 'C-303',
    });
    const result = await VerifyR('shape@test.com', 'password123');
    expect(result.userPayload).toHaveProperty('id');
    expect(result.userPayload).toHaveProperty('email');
    expect(result.userPayload).toHaveProperty('userType');
  });

  test('should include community for Resident', async () => {
    await Resident.create({
      residentFirstname: 'Com', residentLastname: 'User', email: 'com@test.com', password: hashedPw,
      contact: '2222222222', community: communityId, uCode: 'D-404',
    });
    const result = await VerifyR('com@test.com', 'password123');
    expect(result.userPayload.community).toBeDefined();
    expect(result.userPayload.community.toString()).toBe(communityId.toString());
  });

  test('should include assignedCommunity for CommunityManager', async () => {
    await CommunityManager.create({
      name: 'CM', email: 'cm2@test.com', password: hashedPw,
      assignedCommunity: communityId,
      contact: '1234567890',
    });
    const result = await VerifyC('cm2@test.com', 'password123');
    expect(result.userPayload.community.toString()).toBe(communityId.toString());
  });
});