import { connect, disconnect, clearDatabase } from '../setup.js';
import mongoose from 'mongoose';
import Issue from '../../models/issues.js';
import Resident from '../../models/resident.js';
import Worker from '../../models/workers.js';
import CommunityManager from '../../models/cManager.js';
import Community from '../../models/communities.js';
import Security from '../../models/security.js';

import {
  raiseIssue,
  getResidentIssues,
  confirmIssue,
  rejectIssueResolution,
  deleteIssue,
  getEmergencyContacts,
} from '../../pipelines/issue/controllers/resident.js';

import {
  assignIssue,
  reassignIssue,
  closeIssueByManager,
} from '../../pipelines/issue/controllers/manager.js';

import {
  startIssue,
  resolveIssue,
  getWorkerTasks,
} from '../../pipelines/issue/controllers/worker.js';

import {
  logPhoneOrIntercomIssue,
  getCommunityFlatsForSecurity,
} from '../../pipelines/issue/controllers/security.js';

// Helper to mock express req / res
function createMockReqRes(reqData = {}) {
  const req = {
    user: reqData.user || {},
    body: reqData.body || {},
    params: reqData.params || {},
    query: reqData.query || {},
  };
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
  return { req, res };
}

describe('Issue Pipeline Test Suite', () => {
  let communityId;
  let residentUser;
  let managerUser;
  let workerUser;
  let securityUser;
  let residentDoc;
  let workerDoc;
  let managerDoc;
  let securityDoc;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await disconnect();
  });

  beforeEach(async () => {
    await clearDatabase();

    communityId = new mongoose.Types.ObjectId();

    // 1. Create a test Community Manager
    managerDoc = await CommunityManager.create({
      name: 'Test Manager',
      email: 'manager@urbanease.com',
      password: 'password123',
      contact: '9876543211',
      community: communityId,
      assignedCommunity: communityId,
    });

    // 2. Create Community document linking manager
    await Community.create({
      _id: communityId,
      name: 'Greenfield Heights',
      location: 'Bangalore',
      communityManager: managerDoc._id,
      status: 'Active',
    });

    // 3. Create a test Resident
    residentDoc = await Resident.create({
      residentFirstname: 'John',
      residentLastname: 'Doe',
      email: 'resident@urbanease.com',
      password: 'password123',
      contact: '9876543210',
      uCode: 'A-101',
      community: communityId,
    });

    residentUser = {
      id: residentDoc._id.toString(),
      community: communityId.toString(),
      userType: 'Resident',
    };

    managerUser = {
      id: managerDoc._id.toString(),
      community: communityId.toString(),
      userType: 'CommunityManager',
    };

    // 4. Create a test Worker
    workerDoc = await Worker.create({
      name: 'Ramesh Plumber',
      email: 'ramesh@urbanease.com',
      password: 'password123',
      contact: '9876543212',
      address: '123 Worker Street',
      jobRole: ['Plumber'],
      salary: 15000,
      community: communityId,
      isActive: true,
    });

    workerUser = {
      id: workerDoc._id.toString(),
      community: communityId.toString(),
      userType: 'Worker',
    };

    // 5. Create a test Security Guard
    securityDoc = await Security.create({
      name: 'Bahadur Singh',
      email: 'bahadur@urbanease.com',
      password: 'password123',
      contact: '9876500001',
      address: 'Main Gate Cabin',
      community: communityId,
      Shift: 'Day',
    });

    securityUser = {
      id: securityDoc._id.toString(),
      community: communityId.toString(),
      userType: 'Security',
    };
  });

  // ==========================================
  // 1. RESIDENT WORKFLOW TESTS
  // ==========================================
  describe('Resident Workflow', () => {
    test('Resident can raise a personal issue with auto priority and flat location', async () => {
      const { req, res } = createMockReqRes({
        user: residentUser,
        body: {
          title: 'Bathroom water leakage',
          category: 'Plumbing',
          categoryType: 'Resident',
          description: 'Water pipe is leaking under the bathroom sink',
        },
      });

      await raiseIssue(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.issue).toBeDefined();
      expect(res.jsonData.issue.title).toBe('Bathroom water leakage');
      expect(res.jsonData.issue.location).toBe('A-101');

      const dbIssue = await Issue.findById(res.jsonData.issue._id);
      expect(dbIssue).not.toBeNull();
      expect(dbIssue.resident.toString()).toBe(residentUser.id);
    });

  // ==========================================
  // 1. PRIORITY CLASSIFICATION TESTS
  // ==========================================
  describe('Priority Auto-Detection Rules', () => {
    test('URGENT Priority: Assigned to electrical sparks, sewage flood, power outages, and elevator entrapment', async () => {
      const urgentCases = [
        {
          title: 'Circuit breaker sparking',
          category: 'Electrical',
          categoryType: 'Resident',
          description: 'Dangerous electrical sparks flying from the main distribution board',
        },
        {
          title: 'Sewage flood in basement',
          category: 'Plumbing',
          categoryType: 'Resident',
          description: 'Sewage line burst and flooding water rapidly into apartment',
        },
        {
          title: 'Passenger trapped',
          category: 'Elevator',
          categoryType: 'Community',
          location: 'Block A Lift 1',
          description: 'Two elderly residents stuck in elevator between 4th and 5th floors',
        },
        {
          title: 'Total blackout',
          category: 'Electrical',
          categoryType: 'Resident',
          description: 'Sudden power outage with complete no electricity in flat',
        },
      ];

      for (const testCase of urgentCases) {
        await Issue.deleteMany({});
        const { req, res } = createMockReqRes({
          user: residentUser,
          body: testCase,
        });

        await raiseIssue(req, res);

        expect(res.statusCode).toBe(201);
        expect(res.jsonData.issue.priority).toBe('Urgent');
      }
    });

    test('HIGH Priority: Assigned to breakdowns, mold/infestation, hygiene & structural safety issues', async () => {
      const highCases = [
        {
          title: 'Gym treadmill motor issue',
          category: 'Maintenance',
          categoryType: 'Community',
          location: 'Clubhouse Gym',
          description: 'Motor belt is broken and machine is not working properly',
        },
        {
          title: 'Kitchen pest infestation',
          category: 'Pest Control',
          categoryType: 'Resident',
          description: 'Severe cockroach and rodents infestation behind cabinets',
        },
        {
          title: 'Loose staircase railing',
          category: 'Maintenance',
          categoryType: 'Community',
          location: 'Block B Staircase 3rd Floor',
          description: 'Railing is completely loose and posing a serious safety hazard for kids',
        },
        {
          title: 'Overhead tank overflow',
          category: 'Plumbing',
          categoryType: 'Community',
          location: 'Terrace Tank Block C',
          description: 'Water tank overflow continuously spilling onto rooftop',
        },
      ];

      for (const testCase of highCases) {
        await Issue.deleteMany({});
        const { req, res } = createMockReqRes({
          user: residentUser,
          body: testCase,
        });

        await raiseIssue(req, res);

        expect(res.statusCode).toBe(201);
        expect(res.jsonData.issue.priority).toBe('High');
      }
    });

    test('NORMAL Priority: Assigned to standard routine maintenance, cosmetic fixes, and minor adjustments', async () => {
      const normalCases = [
        {
          title: 'Squeaky bedroom door hinge',
          category: 'Maintenance',
          categoryType: 'Resident',
          description: 'Bedroom door hinge makes a squeak sound when opening, needs oiling',
        },
        {
          title: 'Balcony paint touchup',
          category: 'Maintenance',
          categoryType: 'Resident',
          description: 'Small cosmetic paint chip near balcony railing',
        },
        {
          title: 'Garden hedge trimming request',
          category: 'Maintenance',
          categoryType: 'Community',
          location: 'East Lawn Pathway',
          description: 'Hedges along the walkway need regular seasonal trimming',
        },
      ];

      for (const testCase of normalCases) {
        await Issue.deleteMany({});
        const { req, res } = createMockReqRes({
          user: residentUser,
          body: testCase,
        });

        await raiseIssue(req, res);

        expect(res.statusCode).toBe(201);
        expect(res.jsonData.issue.priority).toBe('Normal');
      }
    });
  });

    test('Resident cannot raise Community issue without explicit location', async () => {
      const { req, res } = createMockReqRes({
        user: residentUser,
        body: {
          title: 'Broken gym light',
          category: 'Electrical',
          categoryType: 'Community',
          description: 'Ceiling light in gym is broken',
        },
      });

      await raiseIssue(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.message).toContain('Location is required');
    });

    test('Resident cannot raise issue with missing required fields', async () => {
      const { req, res } = createMockReqRes({
        user: residentUser,
        body: {
          title: 'Incomplete issue',
        },
      });

      await raiseIssue(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
    });

    test('Resident can fetch their own raised issues list', async () => {
      await Issue.create({
        title: 'Issue 1',
        category: 'Plumbing',
        categoryType: 'Resident',
        description: 'First test issue',
        location: 'A-101',
        resident: residentDoc._id,
        community: communityId,
        status: 'Pending Assignment',
      });

      await Issue.create({
        title: 'Issue 2',
        category: 'Electrical',
        categoryType: 'Resident',
        description: 'Second test issue',
        location: 'A-101',
        resident: residentDoc._id,
        community: communityId,
        status: 'Assigned',
      });

      const { req, res } = createMockReqRes({
        user: residentUser,
      });

      await getResidentIssues(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.issues).toHaveLength(2);
    });

    test('Resident can cancel an open issue using deleteIssue', async () => {
      const issue = await Issue.create({
        title: 'Issue to cancel',
        category: 'Plumbing',
        categoryType: 'Resident',
        description: 'Resolved on my own',
        location: 'A-101',
        resident: residentDoc._id,
        community: communityId,
        status: 'Pending Assignment',
      });

      // Link to resident's raisedIssues array
      await Resident.findByIdAndUpdate(residentDoc._id, {
        $push: { raisedIssues: issue._id },
      });

      const { req, res } = createMockReqRes({
        user: residentUser,
        params: { issueID: issue._id.toString() },
      });

      await deleteIssue(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);

      const deleted = await Issue.findById(issue._id);
      expect(deleted).toBeNull();
    });

    test('Resident can confirm a resolved issue', async () => {
      const issue = await Issue.create({
        title: 'Resolved issue',
        category: 'Plumbing',
        categoryType: 'Resident',
        description: 'Testing confirmation',
        location: 'A-101',
        resident: residentDoc._id,
        workerAssigned: workerDoc._id,
        community: communityId,
        status: 'Resolved (Awaiting Confirmation)',
      });

      const { req, res } = createMockReqRes({
        user: residentUser,
        params: { id: issue._id.toString() },
      });

      await confirmIssue(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);

      const updated = await Issue.findById(issue._id);
      expect(updated.status).toBe('Payment Pending');
    });

    test('Resident can reject an improper resolution', async () => {
      const issue = await Issue.create({
        title: 'Leaking pipe',
        category: 'Plumbing',
        categoryType: 'Resident',
        description: 'Testing rejection of resolution',
        location: 'A-101',
        resident: residentDoc._id,
        workerAssigned: workerDoc._id,
        community: communityId,
        status: 'Resolved (Awaiting Confirmation)',
      });

      const { req, res } = createMockReqRes({
        user: residentUser,
        params: { id: issue._id.toString() },
        body: {
          reason: 'Pipe is still leaking from joint',
        },
      });

      await rejectIssueResolution(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);

      const updated = await Issue.findById(issue._id);
      expect(updated.status).toBe('Reopened');
    });

    test('Resident can fetch live emergency contacts (manager & security)', async () => {
      const { req, res } = createMockReqRes({
        user: residentUser,
      });

      await getEmergencyContacts(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.contacts).toBeDefined();
      expect(res.jsonData.contacts.estateOffice.contact).toBe('9876543211');
      expect(res.jsonData.contacts.securityGate.contact).toBe('9876500001');
      expect(res.jsonData.contacts.securityGate.name).toBe('Bahadur Singh');
    });
  });

  // ==========================================
  // 2. MANAGER WORKFLOW TESTS
  // ==========================================
  describe('Manager Workflow', () => {
    test('Manager can assign a pending issue to an active worker', async () => {
      const issue = await Issue.create({
        title: 'Tap repair needed',
        category: 'Plumbing',
        categoryType: 'Resident',
        description: 'Kitchen tap dripping',
        location: 'A-101',
        resident: residentDoc._id,
        community: communityId,
        status: 'Pending Assignment',
      });

      const deadline = new Date(Date.now() + 86400000).toISOString();

      const { req, res } = createMockReqRes({
        user: managerUser,
        params: { id: issue._id.toString() },
        body: {
          worker: workerDoc._id.toString(),
          deadline,
          remarks: 'Please visit before 4 PM',
        },
      });

      await assignIssue(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);

      const updatedIssue = await Issue.findById(issue._id);
      expect(updatedIssue.status).toBe('Assigned');
      expect(updatedIssue.workerAssigned.toString()).toBe(workerDoc._id.toString());

      const updatedWorker = await Worker.findById(workerDoc._id);
      expect(updatedWorker.assignedIssues.map((id) => id.toString())).toContain(issue._id.toString());
    });

    test('Manager cannot assign issue to an inactive worker', async () => {
      const inactiveWorker = await Worker.create({
        name: 'Inactive Worker',
        email: 'inactive@urbanease.com',
        password: 'password123',
        contact: '9876543219',
        address: '456 Inactive Street',
        jobRole: ['Plumber'],
        salary: 15000,
        community: communityId,
        isActive: false,
      });

      const issue = await Issue.create({
        title: 'Tap repair needed',
        category: 'Plumbing',
        categoryType: 'Resident',
        description: 'Kitchen tap dripping',
        location: 'A-101',
        resident: residentDoc._id,
        community: communityId,
        status: 'Pending Assignment',
      });

      const { req, res } = createMockReqRes({
        user: managerUser,
        params: { id: issue._id.toString() },
        body: {
          worker: inactiveWorker._id.toString(),
        },
      });

      await assignIssue(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.message).toContain('inactive worker');
    });

    test('Manager can reassign an issue to a new worker', async () => {
      const secondWorker = await Worker.create({
        name: 'Suresh Plumber',
        email: 'suresh@urbanease.com',
        password: 'password123',
        contact: '9876543215',
        address: '789 Worker Lane',
        jobRole: ['Plumber'],
        salary: 16000,
        community: communityId,
        isActive: true,
      });

      const issue = await Issue.create({
        title: 'Tap repair needed',
        category: 'Plumbing',
        categoryType: 'Resident',
        description: 'Kitchen tap dripping',
        location: 'A-101',
        resident: residentDoc._id,
        workerAssigned: workerDoc._id,
        community: communityId,
        status: 'Assigned',
      });

      const { req, res } = createMockReqRes({
        user: managerUser,
        params: { id: issue._id.toString() },
        body: {
          newWorker: secondWorker._id.toString(),
          reason: 'Previous worker on leave',
        },
      });

      await reassignIssue(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);

      const updated = await Issue.findById(issue._id);
      expect(updated.workerAssigned.toString()).toBe(secondWorker._id.toString());
    });

    test('Manager can close an issue directly', async () => {
      const issue = await Issue.create({
        title: 'Completed community issue',
        category: 'Plumbing',
        categoryType: 'Community',
        description: 'Fixed garden pipe',
        location: 'Garden Area',
        resident: residentDoc._id,
        community: communityId,
        status: 'Resolved (Awaiting Confirmation)',
      });

      const { req, res } = createMockReqRes({
        user: managerUser,
        params: { id: issue._id.toString() },
      });

      await closeIssueByManager(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);

      const updated = await Issue.findById(issue._id);
      expect(updated.status).toBe('Closed');
    });
  });

  // ==========================================
  // 3. WORKER WORKFLOW TESTS
  // ==========================================
  describe('Worker Workflow', () => {
    test('Worker can fetch their assigned active tasks', async () => {
      await Issue.create({
        title: 'Plumbing Task 1',
        category: 'Plumbing',
        categoryType: 'Resident',
        description: 'Fix drain',
        location: 'A-101',
        resident: residentDoc._id,
        workerAssigned: workerDoc._id,
        community: communityId,
        status: 'Assigned',
      });

      const { req, res } = createMockReqRes({
        user: workerUser,
      });

      await getWorkerTasks(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.tasks).toHaveLength(1);
    });

    test('Worker can start an assigned issue', async () => {
      const issue = await Issue.create({
        title: 'Electrical Spark',
        category: 'Electrical',
        categoryType: 'Resident',
        description: 'Switchboard sparking',
        location: 'A-101',
        resident: residentDoc._id,
        workerAssigned: workerDoc._id,
        community: communityId,
        status: 'Assigned',
      });

      const { req, res } = createMockReqRes({
        user: workerUser,
        params: { id: issue._id.toString() },
      });

      await startIssue(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);

      const updated = await Issue.findById(issue._id);
      expect(updated.status).toBe('In Progress');
    });

    test('Worker cannot start an unassigned issue', async () => {
      const issue = await Issue.create({
        title: 'Pending Issue',
        category: 'Electrical',
        categoryType: 'Resident',
        description: 'Switchboard sparking',
        location: 'A-101',
        resident: residentDoc._id,
        community: communityId,
        status: 'Pending Assignment',
      });

      const { req, res } = createMockReqRes({
        user: workerUser,
        params: { id: issue._id.toString() },
      });

      await startIssue(req, res);

      expect(res.statusCode).toBe(400);
      expect(res.jsonData.success).toBe(false);
    });

    test('Worker can resolve an in-progress resident issue', async () => {
      const issue = await Issue.create({
        title: 'Electrical Spark',
        category: 'Electrical',
        categoryType: 'Resident',
        description: 'Switchboard sparking',
        location: 'A-101',
        resident: residentDoc._id,
        workerAssigned: workerDoc._id,
        community: communityId,
        status: 'In Progress',
      });

      const { req, res } = createMockReqRes({
        user: workerUser,
        params: { id: issue._id.toString() },
        body: {
          estimatedCost: 150,
        },
      });

      await resolveIssue(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);

      const updated = await Issue.findById(issue._id);
      expect(updated.status).toBe('Resolved (Awaiting Confirmation)');
      expect(updated.estimatedCost).toBe(150);
    });
  });

  // ==========================================
  // 4. TENANT ISOLATION TESTS
  // ==========================================
  describe('Tenant Boundary & Multi-Community Isolation', () => {
    test('Resident from Community A cannot delete/cancel an issue in Community B', async () => {
      const otherCommunityId = new mongoose.Types.ObjectId();
      const otherIssue = await Issue.create({
        title: 'Other community issue',
        category: 'Plumbing',
        categoryType: 'Resident',
        description: 'Belongs to other community',
        location: 'A-999',
        resident: new mongoose.Types.ObjectId(),
        community: otherCommunityId,
        status: 'Pending Assignment',
      });

      const { req, res } = createMockReqRes({
        user: residentUser, // Resident in Community A
        params: { issueID: otherIssue._id.toString() },
      });

      await deleteIssue(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.jsonData.success).toBe(false);
    });

    test('Manager from Community A cannot assign an issue in Community B', async () => {
      const otherCommunityId = new mongoose.Types.ObjectId();
      const otherIssue = await Issue.create({
        title: 'Other community issue',
        category: 'Plumbing',
        categoryType: 'Resident',
        description: 'Belongs to other community',
        location: 'A-999',
        resident: new mongoose.Types.ObjectId(),
        community: otherCommunityId,
        status: 'Pending Assignment',
      });

      const { req, res } = createMockReqRes({
        user: managerUser, // Manager in Community A
        params: { id: otherIssue._id.toString() },
        body: {
          worker: workerDoc._id.toString(),
        },
      });

      await assignIssue(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.jsonData.success).toBe(false);
    });
  });

  // ==========================================
  // 5. SECURITY / GATE DESK WORKFLOW TESTS
  // ==========================================
  describe('Security Gate Desk (Phone & Intercom Call Logging)', () => {
    test('Security guard can log an incoming intercom call on behalf of a resident flat', async () => {
      const { req, res } = createMockReqRes({
        user: securityUser,
        body: {
          callSource: 'Intercom',
          categoryType: 'Resident',
          uCode: 'A-101',
          category: 'Plumbing',
          title: 'Kitchen sink pipe burst',
          description: 'Resident phoned intercom reporting emergency water burst under kitchen sink',
        },
      });

      await logPhoneOrIntercomIssue(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.issue).toBeDefined();
      expect(res.jsonData.issue.title).toContain('[Intercom]');
      expect(res.jsonData.issue.resident._id.toString()).toBe(residentDoc._id.toString());
      expect(res.jsonData.issue.location).toBe('A-101');

      // Verify resident document updated with new ticket
      const updatedResident = await Resident.findById(residentDoc._id);
      expect(updatedResident.raisedIssues.map((id) => id.toString())).toContain(res.jsonData.issue._id.toString());
    });

    test('Security guard can log an external phone call for a common area breakdown', async () => {
      const { req, res } = createMockReqRes({
        user: securityUser,
        body: {
          callSource: 'Phone Call',
          categoryType: 'Community',
          location: 'Block A Lift 2',
          category: 'Elevator',
          title: 'Lift stopped between floors',
          description: 'External phone call from resident reporting lift 2 stuck',
        },
      });

      await logPhoneOrIntercomIssue(req, res);

      expect(res.statusCode).toBe(201);
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.issue.location).toBe('Block A Lift 2');
      expect(res.jsonData.issue.priority).toBe('Urgent');
    });

    test('Security guard cannot log an issue for an invalid/unknown flat', async () => {
      const { req, res } = createMockReqRes({
        user: securityUser,
        body: {
          callSource: 'Intercom',
          categoryType: 'Resident',
          uCode: 'Z-999', // Invalid flat
          category: 'Plumbing',
          title: 'Pipe leakage',
          description: 'Call from unknown flat',
        },
      });

      await logPhoneOrIntercomIssue(req, res);

      expect(res.statusCode).toBe(404);
      expect(res.jsonData.success).toBe(false);
      expect(res.jsonData.message).toContain('No active resident found');
    });

    test('Security guard can fetch list of community flats for dropdown', async () => {
      const { req, res } = createMockReqRes({
        user: securityUser,
      });

      await getCommunityFlatsForSecurity(req, res);

      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);
      expect(res.jsonData.residents).toBeDefined();
      expect(res.jsonData.residents.length).toBeGreaterThanOrEqual(1);
      expect(res.jsonData.residents[0].uCode).toBe('A-101');
    });
  });
});
