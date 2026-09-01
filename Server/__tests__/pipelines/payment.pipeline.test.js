import { jest } from "@jest/globals";
import mongoose from "mongoose";
import { connect, disconnect, clearDatabase } from "../setup.js";
import Payment from "../../models/payment.js";
import Resident from "../../models/resident.js";
import Community from "../../models/communities.js";
import CommunityManager from "../../models/cManager.js";
import {
  createPaymentRecord,
  markPaymentPaid,
  getPaymentById,
  getPendingPayments,
  deletePaymentById
} from "../../pipelines/payment/services/paymentService.js";

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
});

beforeEach(async () => {
  await clearDatabase();
});

describe("Payment Pipeline Test Suite", () => {
  let community;
  let manager;
  let resident;

  beforeEach(async () => {
    community = await Community.create({
      name: "Palm Meadows",
      location: "East Wing",
      status: "Active",
      subscriptionStatus: "active"
    });

    manager = await CommunityManager.create({
      name: "Manager Alice",
      email: "manager.alice@example.com",
      password: "hashedPassword",
      contact: "9876543210",
      assignedCommunity: community._id,
      role: "CommunityManager"
    });

    resident = await Resident.create({
      residentFirstname: "Bob",
      residentLastname: "Smith",
      email: "resident.bob@example.com",
      password: "hashedPassword",
      community: community._id,
      uCode: "A-101",
      role: "Resident"
    });
  });

  describe("1. Payment Record Lifecycle", () => {
    test("should successfully create a pending payment invoice", async () => {
      const payment = await createPaymentRecord({
        title: "Maintenance Bill - Oct 2026",
        senderId: resident._id.toString(),
        receiverId: manager._id.toString(),
        amount: 2500,
        communityId: community._id.toString(),
        belongTo: "Resident",
        remarks: "Monthly maintenance charge"
      });

      expect(payment).toBeDefined();
      expect(payment.amount).toBe(2500);
      expect(payment.status).toBe("Pending");
      expect(payment.title).toBe("Maintenance Bill - Oct 2026");
      expect(payment.paymentMethod).toBe("None");
      expect(payment.paymentDeadline).toBeDefined();
    });

    test("should reject payment record creation when required fields are missing", async () => {
      await expect(
        createPaymentRecord({
          title: "Incomplete Payment",
          senderId: resident._id.toString(),
          // Missing receiverId, amount, communityId
        })
      ).rejects.toThrow("createPaymentRecord: missing required fields");
    });

    test("should mark a pending payment as Completed with payment method and timestamp", async () => {
      const payment = await createPaymentRecord({
        title: "Clubhouse Booking Fee",
        senderId: resident._id.toString(),
        receiverId: manager._id.toString(),
        amount: 500,
        communityId: community._id.toString(),
        belongTo: "CommonSpaces"
      });

      const updated = await markPaymentPaid(payment._id, resident._id.toString(), {
        paymentMethod: "UPI",
        transactionId: "TXN_987654321"
      });

      expect(updated.status).toBe("Completed");
      expect(updated.paymentMethod).toBe("UPI");
      expect(updated.paymentDate).toBeDefined();

      const inDb = await Payment.findById(payment._id);
      expect(inDb.status).toBe("Completed");
    });

    test("should delete an invoice when authorized by community", async () => {
      const payment = await createPaymentRecord({
        title: "Erroneous Fee",
        senderId: resident._id.toString(),
        receiverId: manager._id.toString(),
        amount: 300,
        communityId: community._id.toString()
      });

      await deletePaymentById(payment._id, community._id.toString());
      const inDb = await Payment.findById(payment._id);
      expect(inDb).toBeNull();
    });
  });

  describe("2. Queries & Overdue Detection", () => {
    test("should fetch pending payments for resident and identify overdue status", async () => {
      const pastDeadline = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000); // 5 days ago

      await createPaymentRecord({
        title: "Overdue Electricity",
        senderId: resident._id.toString(),
        receiverId: manager._id.toString(),
        amount: 1200,
        communityId: community._id.toString(),
        paymentDeadline: pastDeadline
      });

      const pending = await getPendingPayments(resident._id.toString());
      expect(pending.length).toBe(1);
      expect(pending[0].title).toBe("Overdue Electricity");

      const isOverdue = new Date(pending[0].paymentDeadline) < new Date();
      expect(isOverdue).toBe(true);
    });
  });
});
