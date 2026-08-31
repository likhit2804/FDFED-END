import { connect, disconnect, clearDatabase } from '../setup.js';
import mongoose from 'mongoose';
import CommonSpaces from '../../models/commonSpaces.js';
import Amenity from '../../models/Amenities.js';
import Resident from '../../models/resident.js';
import CommunityManager from '../../models/cManager.js';
import Community from '../../models/communities.js';
import Payment from '../../models/payment.js';

import {
  createBooking,
  getResidentCommonSpaces,
  getBookingById,
  cancelBooking,
} from '../../pipelines/CSB/controllers/resident.js';

import {
  createSpace,
  getCommonSpaces,
  getBookingDetails,
  rejectBooking,
  updateSpace,
  deleteSpace,
} from '../../pipelines/CSB/controllers/manager.js';

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

describe('CSB (Common Space Booking) Pipeline Test Suite', () => {
  let communityId;
  let managerId;
  let residentId;
  let slotAmenityId;
  let subAmenityId;

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
      email: 'john.csb@example.com',
      contact: '9876543210',
      password: 'hashedpassword',
      assignedCommunity: community._id,
    });
    managerId = manager._id.toString();

    const resident = await Resident.create({
      residentFirstname: 'Alice',
      residentLastname: 'Smith',
      email: 'alice.csb@example.com',
      password: 'hashedpassword',
      community: community._id,
      flatNo: 'A-301',
      uCode: 'A-301',
      contact: '9876543210',
    });
    residentId = resident._id.toString();

    // 1. Create a Slot-based Amenity (Tennis Court)
    const slotAmenity = await Amenity.create({
      name: 'Tennis Court',
      type: 'Tennis Court',
      description: 'Championship hard court',
      Type: 'Slot',
      rent: 200,
      bookable: true,
      community: community._id,
      bookedSlots: [],
      availabilityControls: {
        slotConfig: { startTime: '06:00', endTime: '22:00' },
        bookingPolicy: { minAdvanceHours: 0, maxAdvanceDays: 90, sameDayCutoffTime: '22:00' },
        blackoutDates: [],
        dateSlotOverrides: [],
      },
    });
    slotAmenityId = slotAmenity._id.toString();

    // 2. Create a Subscription-based Amenity (Gym Pass)
    const subAmenity = await Amenity.create({
      name: 'Fitness Gym',
      type: 'Gym',
      description: 'Fully equipped modern gym',
      Type: 'Subscription',
      rent: 1500,
      bookable: true,
      community: community._id,
      bookedSlots: [],
    });
    subAmenityId = subAmenity._id.toString();
  });

  describe('1. Date Range & Format Validations', () => {
    test('should reject booking for past dates', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 2);
      const pastDateStr = pastDate.toISOString().split('T')[0];

      const { req, res } = createMockReqRes({
        user: { id: residentId, community: communityId },
        body: {
          newBooking: {
            facility: 'Tennis Court',
            fid: slotAmenityId,
            Date: pastDateStr,
            from: '10:00',
            to: '11:00',
            timeSlots: ['10:00'],
            Type: 'Slot',
            purpose: 'Match',
          },
          data: { amount: 200 },
        },
      });

      await createBooking(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.jsonData.message).toMatch(/past dates/i);
    });

    test('should reject invalid time range where end <= start', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 3);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const { req, res } = createMockReqRes({
        user: { id: residentId, community: communityId },
        body: {
          newBooking: {
            facility: 'Tennis Court',
            fid: slotAmenityId,
            Date: futureDateStr,
            from: '14:00',
            to: '12:00',
            timeSlots: ['14:00'],
            Type: 'Slot',
            purpose: 'Practice',
          },
          data: { amount: 200 },
        },
      });

      await createBooking(req, res);
      expect(res.statusCode).toBe(400);
      expect(res.jsonData.message).toMatch(/after start time/i);
    });
  });

  describe('2. Exclusive Slot Booking & Conflict Handling', () => {
    test('should successfully book available hourly slots and block them', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      const { req, res } = createMockReqRes({
        user: { id: residentId, community: communityId },
        body: {
          newBooking: {
            facility: 'Tennis Court',
            fid: slotAmenityId,
            Date: futureDateStr,
            from: '08:00',
            to: '10:00',
            timeSlots: ['08:00', '09:00'],
            Type: 'Slot',
            purpose: 'Morning session',
          },
          data: { amount: 400 },
        },
      });

      await createBooking(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);

      const createdBooking = res.jsonData.space;
      expect(createdBooking.status).toBe('Booked');
      expect(createdBooking.amount).toBe(400);

      // Verify slots are recorded in Amenity bookedSlots
      const updatedAmenity = await Amenity.findById(slotAmenityId);
      const dateEntry = updatedAmenity.bookedSlots.find(
        (b) => b.date.toISOString().split('T')[0] === futureDateStr
      );
      expect(dateEntry).toBeDefined();
      expect(dateEntry.slots).toContain('08:00');
      expect(dateEntry.slots).toContain('09:00');
    });

    test('should reject concurrent overlapping slot booking with 409 Conflict', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 2);
      const futureDateStr = futureDate.toISOString().split('T')[0];

      // First resident books 08:00 - 10:00
      const first = createMockReqRes({
        user: { id: residentId, community: communityId },
        body: {
          newBooking: {
            facility: 'Tennis Court',
            fid: slotAmenityId,
            Date: futureDateStr,
            from: '08:00',
            to: '10:00',
            timeSlots: ['08:00', '09:00'],
            Type: 'Slot',
            purpose: 'Player 1 match',
          },
          data: { amount: 400 },
        },
      });
      await createBooking(first.req, first.res);
      expect(first.res.statusCode).toBe(200);

      // Second resident attempts to book overlapping 09:00 - 11:00
      const second = createMockReqRes({
        user: { id: new mongoose.Types.ObjectId().toString(), community: communityId },
        body: {
          newBooking: {
            facility: 'Tennis Court',
            fid: slotAmenityId,
            Date: futureDateStr,
            from: '09:00',
            to: '11:00',
            timeSlots: ['09:00', '10:00'],
            Type: 'Slot',
            purpose: 'Player 2 match',
          },
          data: { amount: 400 },
        },
      });
      await createBooking(second.req, second.res);

      expect(second.res.statusCode).toBe(409);
      expect(second.res.jsonData.message).toMatch(/already booked/i);
    });
  });

  describe('3. Subscription Booking & Invoicing Flow', () => {
    test('should book monthly subscription and generate linked Payment invoice', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      const startDateStr = startDate.toISOString().split('T')[0];

      const { req, res } = createMockReqRes({
        user: { id: residentId, community: communityId },
        body: {
          newBooking: {
            facility: 'Fitness Gym',
            fid: subAmenityId,
            Date: startDateStr,
            from: '00:00',
            to: '23:59',
            Type: 'Subscription',
            purpose: 'Monthly Fitness Pass',
          },
          data: { amount: 1500 },
        },
      });

      await createBooking(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.jsonData.success).toBe(true);

      const booking = res.jsonData.space;
      expect(booking.Type).toBe('Subscription');
      expect(booking.paymentStatus).toBe('Pending');

      // Verify linked payment record was created
      const payment = await Payment.findOne({ belongToId: booking._id });
      expect(payment).toBeDefined();
      expect(payment.amount).toBe(1500);
      expect(payment.belongTo).toBe('CommonSpaces');
      expect(payment.title).toMatch(/Fitness Gym/i);
    });
  });

  describe('4. Manager Management & Cancellation Workflow', () => {
    test('manager can view all bookings scoped to community', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      await CommonSpaces.create({
        name: 'Tennis Court',
        description: 'Test Booking',
        Date: futureDate,
        from: '15:00',
        to: '16:00',
        Type: 'Slot',
        amount: 200,
        status: 'Booked',
        bookedBy: residentId,
        community: communityId,
      });

      const { req, res } = createMockReqRes({
        user: { id: managerId, community: communityId },
      });

      await getCommonSpaces(req, res);
      expect(res.statusCode).toBe(200);
      expect(res.jsonData.bookings).toHaveLength(1);
    });

    test('manager can reject/cancel booking with reason and refund details', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 4);

      const booking = await CommonSpaces.create({
        name: 'Tennis Court',
        description: 'Practice match',
        Date: futureDate,
        from: '16:00',
        to: '17:00',
        Type: 'Slot',
        amount: 200,
        status: 'Booked',
        paymentStatus: 'Success',
        bookedBy: residentId,
        community: communityId,
      });

      const { req, res } = createMockReqRes({
        user: { id: managerId, community: communityId },
        params: { id: booking._id.toString() },
        body: {
          reason: 'Court maintenance scheduled',
          refundType: 'full',
          refundPercentage: 100,
        },
      });

      await rejectBooking(req, res);
      expect(res.statusCode).toBe(200);

      const updated = await CommonSpaces.findById(booking._id);
      expect(updated.status).toBe('Cancelled');
      expect(updated.managerCancellation.reason).toBe('Court maintenance scheduled');
      expect(updated.refundAmount).toBe(200);
    });
  });
});
