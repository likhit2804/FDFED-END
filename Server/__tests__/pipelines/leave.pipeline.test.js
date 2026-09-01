import { connect, disconnect, clearDatabase } from "../setup.js";

import Leave from '../../models/leave.js';
import Worker from '../../models/workers.js';
import Resident from '../../models/resident.js';
import CommunityManager from '../../models/cManager.js';
import Community from '../../models/communities.js';
import Issue from '../../models/issues.js';

import { applyLeave } from "../../pipelines/workerLeave/controllers/resident.js";

import { approveLeave, rejectLeave } from "../../pipelines/workerLeave/controllers/manager.js";

import { autoAssignResidentIssue } from "../../utils/issueAutomation.js";

import { assignIssue } from "../../pipelines/issue/controllers/manager.js";

import { startIssue, resolveIssue } from "../../pipelines/issue/controllers/worker.js";

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

describe('Worker Leave Pipeline Test Suite', () => {
  let communityId;
  let managerId;
  let worker1Id;
  let worker2Id;

  beforeAll(async () => {
    await connect();
  });

  afterAll(async () => {
    await disconnect();
  });

  beforeEach(async () => {
    await clearDatabase();

    const community = await Community.create({
      name: 'Oakridge Heights',
      location: 'Hyderabad',
      communityCode: 'OAK123',
      address: '456 Hill Road',
      city: 'Hyderabad',
      state: 'Telangana',
      pincode: '500081',
      subscriptionStatus: 'active',
    });
    communityId = community._id.toString();

    const manager = await CommunityManager.create({
      name: 'Manager John',
      email: 'john.leave@example.com',
      contact: '9876543210',
      password: 'hashedpassword',
      assignedCommunity: community._id,
    });
    managerId = manager._id.toString();

    const worker1 = await Worker.create({
      name: 'Bob Plumber',
      email: 'bob.plumber@example.com',
      contact: '9876543211',
      address: '123 Staff Quarters',
      salary: 25000,
      password: 'hashedpassword',
      jobRole: ['Plumber'],
      community: community._id,
      isActive: true,
      assignedIssues: [],
    });
    worker1Id = worker1._id.toString();

    const worker2 = await Worker.create({
      name: 'Charlie Plumber',
      email: 'charlie.plumber@example.com',
      contact: '9876543212',
      address: '124 Staff Quarters',
      salary: 25000,
      password: 'hashedpassword',
      jobRole: ['Plumber'],
      community: community._id,
      isActive: true,
      assignedIssues: [],
    });
    worker2Id = worker2._id.toString();
  });

  describe('1. Date Range & Overlap Validations', () => {
    test('should reject leave with past start date', async () => {
      const pastStart = new Date();
      pastStart.setDate(pastStart.getDate() - 3);
      const futureEnd = new Date();
      futureEnd.setDate(futureEnd.getDate() + 2);

      const { req, res } = createMockReqRes({
        user: { id: worker1Id, community: communityId },
        body: {
          type: 'casual',
          startDate: pastStart.toISOString().split('T')[0],
          endDate: futureEnd.toISOString().split('T')[0],
          reason: 'Family event',
        },
      });

      await applyLeave(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.jsonData.message).toMatch(/past/i);
    });

    test('should reject leave where endDate < startDate', async () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 5);
      const earlierEnd = new Date();
      earlierEnd.setDate(earlierEnd.getDate() + 3);

      const { req, res } = createMockReqRes({
        user: { id: worker1Id, community: communityId },
        body: {
          type: 'sick',
          startDate: futureStart.toISOString().split('T')[0],
          endDate: earlierEnd.toISOString().split('T')[0],
          reason: 'Medical rest',
        },
      });

      await applyLeave(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.jsonData.message).toMatch(/before start date/i);
    });

    test('should successfully apply for valid upcoming leave', async () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 2);
      const futureEnd = new Date();
      futureEnd.setDate(futureEnd.getDate() + 4);

      const { req, res } = createMockReqRes({
        user: { id: worker1Id, community: communityId },
        body: {
          type: 'annual',
          startDate: futureStart.toISOString().split('T')[0],
          endDate: futureEnd.toISOString().split('T')[0],
          reason: 'Annual vacation',
        },
      });

      await applyLeave(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);

      const leave = res.jsonData.leave;
      expect(leave.status).toBe('pending');
      expect(leave.type).toBe('annual');
      expect(leave.worker.toString()).toBe(worker1Id);
    });

    test('should reject overlapping leave request for same worker', async () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 2);
      const futureEnd = new Date();
      futureEnd.setDate(futureEnd.getDate() + 5);

      // 1. Create first leave
      await Leave.create({
        worker: worker1Id,
        community: communityId,
        type: 'sick',
        startDate: futureStart,
        endDate: futureEnd,
        reason: 'Existing leave',
        status: 'pending',
      });

      // 2. Worker attempts to apply for overlapping period
      const overlapStart = new Date();
      overlapStart.setDate(overlapStart.getDate() + 3);
      const overlapEnd = new Date();
      overlapEnd.setDate(overlapEnd.getDate() + 6);

      const { req, res } = createMockReqRes({
        user: { id: worker1Id, community: communityId },
        body: {
          type: 'casual',
          startDate: overlapStart.toISOString().split('T')[0],
          endDate: overlapEnd.toISOString().split('T')[0],
          reason: 'Overlapping request',
        },
      });

      await applyLeave(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.jsonData.message).toMatch(/overlap/i);
    });
  });

  describe('2. Manager Decision & Approval Workflow', () => {
    test('manager can view community leaves and approve with notes', async () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 1);
      const futureEnd = new Date();
      futureEnd.setDate(futureEnd.getDate() + 3);

      const leave = await Leave.create({
        worker: worker1Id,
        community: communityId,
        type: 'casual',
        startDate: futureStart,
        endDate: futureEnd,
        reason: 'Personal errand',
        status: 'pending',
      });

      const { req, res } = createMockReqRes({
        user: { id: managerId, community: communityId },
        params: { id: leave._id.toString() },
        body: { notes: 'Approved. Reliever assigned.' },
      });

      await approveLeave(req, res);
      expect(res.statusCode).toBe(200);

      const updated = await Leave.findById(leave._id);
      expect(updated.status).toBe('approved');
      expect(updated.manager.toString()).toBe(managerId);
      expect(updated.notes).toBe('Approved. Reliever assigned.');
      expect(updated.decisionAt).toBeDefined();
    });

    test('manager can reject leave with rejection reason', async () => {
      const futureStart = new Date();
      futureStart.setDate(futureStart.getDate() + 1);
      const futureEnd = new Date();
      futureEnd.setDate(futureEnd.getDate() + 3);

      const leave = await Leave.create({
        worker: worker1Id,
        community: communityId,
        type: 'casual',
        startDate: futureStart,
        endDate: futureEnd,
        reason: 'Personal errand',
        status: 'pending',
      });

      const { req, res } = createMockReqRes({
        user: { id: managerId, community: communityId },
        params: { id: leave._id.toString() },
        body: { notes: 'High maintenance volume this week' },
      });

      await rejectLeave(req, res);
      expect(res.statusCode).toBe(200);

      const updated = await Leave.findById(leave._id);
      expect(updated.status).toBe('rejected');
      expect(updated.notes).toBe('High maintenance volume this week');
    });
  });

  describe('3. Auto-Assignment Leave Exclusion Integration', () => {
    test('auto-assign skips worker on approved leave and selects available worker', async () => {
      const resident = await Resident.create({
        residentFirstname: 'David',
        residentLastname: 'Miller',
        email: 'david.leave@example.com',
        password: 'hashedpassword',
        community: communityId,
        flatNo: 'A-301',
        uCode: 'A-301',
        contact: '9876543210',
      });

      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 2);

      // Worker 1 is on approved leave today
      await Leave.create({
        worker: worker1Id,
        community: communityId,
        type: 'sick',
        startDate: today,
        endDate: tomorrow,
        status: 'approved',
      });

      const issue = await Issue.create({
        title: 'Burst pipe in kitchen',
        category: 'Plumbing',
        categoryType: 'Resident',
        description: 'Water overflowing from sink drain',
        priority: 'High',
        resident: resident._id,
        location: 'Flat A-301',
        community: communityId,
        status: 'Pending Assignment',
      });

      // Auto assign should pick Worker 2 (Charlie), skipping Worker 1 (Bob who is on leave)
      const result = await autoAssignResidentIssue(issue);
      expect(result.assigned).toBe(true);

      const updatedIssue = await Issue.findById(issue._id);
      expect(updatedIssue.status).toBe('Assigned');
      expect(updatedIssue.workerAssigned.toString()).toBe(worker2Id);
    });

    test('should reject manual assignment of an issue to a worker on approved leave', async () => {
      const resident = await Resident.create({
        residentFirstname: 'Ella',
        residentLastname: 'Green',
        email: 'ella.leave@example.com',
        password: 'hashedpassword',
        community: communityId,
        flatNo: 'B-201',
        uCode: 'B-201',
        contact: '9876543210',
      });

      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 5);

      await Leave.create({
        worker: worker1Id,
        community: communityId,
        type: 'annual',
        startDate: today,
        endDate: nextWeek,
        status: 'approved',
      });

      const issue = await Issue.create({
        title: 'Geyser not heating',
        category: 'Electrical',
        categoryType: 'Resident',
        description: 'No hot water in bathroom',
        location: 'Flat B-201',
        resident: resident._id,
        community: communityId,
        status: 'Pending Assignment',
      });

      const { req, res } = createMockReqRes({
        user: { id: managerId, community: communityId },
        params: { id: issue._id.toString() },
        body: { worker: worker1Id },
      });

      await assignIssue(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.jsonData.message).toMatch(/on approved leave/i);
    });

    test('should block worker on approved leave from starting a task', async () => {
      const resident = await Resident.create({
        residentFirstname: 'Frank',
        residentLastname: 'White',
        email: 'frank.leave@example.com',
        password: 'hashedpassword',
        community: communityId,
        flatNo: 'C-101',
        uCode: 'C-101',
        contact: '9876543210',
      });

      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 5);

      await Leave.create({
        worker: worker1Id,
        community: communityId,
        type: 'casual',
        startDate: today,
        endDate: nextWeek,
        status: 'approved',
      });

      const issue = await Issue.create({
        title: 'Water tap leaking',
        category: 'Plumbing',
        categoryType: 'Resident',
        description: 'Continuous dripping from tap',
        location: 'Flat C-101',
        resident: resident._id,
        community: communityId,
        workerAssigned: worker1Id,
        status: 'Assigned',
      });

      const { req, res } = createMockReqRes({
        user: { id: worker1Id, community: communityId },
        params: { id: issue._id.toString() },
      });

      await startIssue(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.jsonData.message).toMatch(/on approved leave/i);
    });

    test('should block worker on approved leave from resolving a task', async () => {
      const resident = await Resident.create({
        residentFirstname: 'Grace',
        residentLastname: 'Taylor',
        email: 'grace.leave@example.com',
        password: 'hashedpassword',
        community: communityId,
        flatNo: 'D-401',
        uCode: 'D-401',
        contact: '9876543210',
      });

      const today = new Date();
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 5);

      await Leave.create({
        worker: worker1Id,
        community: communityId,
        type: 'casual',
        startDate: today,
        endDate: nextWeek,
        status: 'approved',
      });

      const issue = await Issue.create({
        title: 'Water tap leaking',
        category: 'Plumbing',
        categoryType: 'Resident',
        description: 'Continuous dripping from tap',
        location: 'Flat D-401',
        resident: resident._id,
        community: communityId,
        workerAssigned: worker1Id,
        status: 'In Progress',
      });

      const { req, res } = createMockReqRes({
        user: { id: worker1Id, community: communityId },
        params: { id: issue._id.toString() },
        body: { estimatedCost: 0 },
      });

      await resolveIssue(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.jsonData.message).toMatch(/on approved leave/i);
    });
  });
});
