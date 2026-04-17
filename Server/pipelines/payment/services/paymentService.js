/**
 * Payment Service — pure functions, no req/res.
 * Import this in any pipeline that needs to create or update payments.
 *
 * Example (inside an issue pipeline controller):
 *   import { createPaymentRecord, markPaymentPaid } from '../../payment/services/paymentService.js';
 *   const payment = await createPaymentRecord({ title, senderId, receiverId, amount, communityId, belongTo: 'Issue', belongToId: issue._id });
 */

import Payment from "../../../models/payment.js";
import Resident from "../../../models/resident.js";
import CommunityManager from "../../../models/cManager.js";
import Notifications from "../../../models/Notifications.js";
import { getIO } from "../../../utils/socket.js";

// ─────────────────────────────────────────────
// CREATE
// ─────────────────────────────────────────────

/**
 * Create a Payment document.
 * @param {object} opts
 * @param {string} opts.title
 * @param {string} opts.senderId        - Mongoose ObjectId string
 * @param {string} opts.receiverId      - Mongoose ObjectId string
 * @param {number} opts.amount
 * @param {string} opts.communityId
 * @param {string} [opts.remarks]
 * @param {Date}   [opts.paymentDeadline]  - defaults to 15 days from now
 * @param {string} [opts.paymentMethod]    - defaults to 'None'
 * @param {string} [opts.status]           - defaults to 'Pending'
 * @param {string} [opts.belongTo]         - e.g. 'Issue', 'CSB', 'Onboarding'
 * @param {string} [opts.belongToId]       - related document id
 * @returns {Promise<Payment>} populated Payment document
 */
export async function createPaymentRecord({
    title,
    senderId,
    receiverId,
    amount,
    communityId,
    remarks = "",
    paymentDeadline,
    paymentMethod = "None",
    status = "Pending",
    belongTo,
    belongToId,
}) {
    if (!title || !senderId || !receiverId || !amount || !communityId) {
        throw new Error("createPaymentRecord: missing required fields (title, senderId, receiverId, amount, communityId)");
    }

    const payment = new Payment({
        title,
        sender: senderId,
        receiver: receiverId,
        amount,
        community: communityId,
        paymentDeadline: paymentDeadline || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        paymentMethod,
        status,
        remarks,
        ...(belongTo && { belongTo }),
        ...(belongToId && { belongToId }),
    });

    await payment.save();
    await payment.populate("sender", "name residentFirstname flatNo");
    await payment.populate("receiver", "name");
    return payment;
}

// ─────────────────────────────────────────────
// AUTO-RESOLVE RECEIVER
// ─────────────────────────────────────────────

/**
 * Resolve receiver: use given receiverId or fall back to the community manager.
 * Useful for resident self-pays when no explicit receiver is specified.
 */
export async function resolveReceiver(communityId, receiverId) {
    if (receiverId) return receiverId;
    const manager = await CommunityManager.findOne({ assignedCommunity: communityId });
    return manager ? manager._id.toString() : null;
}

// ─────────────────────────────────────────────
// MARK PAID
// ─────────────────────────────────────────────

/**
 * Mark a payment as Completed (resident confirms payment).
 * Also closes a linked Issue and emits socket events if applicable.
 *
 * @param {string} paymentId
 * @param {string} residentId
 * @param {object} [opts]
 * @param {string} [opts.paymentMethod]
 * @param {Date}   [opts.paymentDate]
 * @returns {Promise<Payment>}
 */
export async function markPaymentPaid(paymentId, residentId, { paymentMethod, paymentDate } = {}) {
    const payment = await Payment.findOne({ _id: paymentId, sender: residentId });
    if (!payment) throw new Error("Payment not found or access denied");

    payment.status = "Completed";
    payment.paymentDate = paymentDate ? new Date(paymentDate) : new Date();
    if (paymentMethod) payment.paymentMethod = paymentMethod;

    // If linked to an Issue → close it + notify manager + emit socket
    if (payment.belongTo === "Issue" && payment.belongToId) {
        const { default: Issue } = await import("../../../models/issues.js");
        await Issue.findByIdAndUpdate(payment.belongToId, { status: "Closed" });

        if (payment.community) {
            const manager = await CommunityManager.findOne({ assignedCommunity: payment.community });
            if (manager) {
                const notif = new Notifications({
                    type: "Payment",
                    title: "Issue Payment Completed",
                    message: `Payment completed for issue ${payment.belongToId}.`,
                    referenceId: payment._id,
                    referenceType: "Payment",
                });
                await notif.save();
                manager.notifications.push(notif._id);
                await manager.save();
            }
        }

        const io = getIO();
        if (io) {
            io.to(`community_${payment.community}`).emit("issue:updated", {
                action: "payment_completed", issueId: payment.belongToId, status: "Closed",
                community: payment.community, updatedAt: new Date().toISOString(),
            });
            io.to(`resident_${residentId}`).emit("issue:updated", {
                action: "payment_completed", issueId: payment.belongToId, status: "Closed",
                updatedAt: new Date().toISOString(),
            });
        }
    }

    if (payment.belongTo === "CommonSpaces" && payment.belongToId) {
        const { default: CommonSpaces } = await import("../../../models/commonSpaces.js");
        await CommonSpaces.findByIdAndUpdate(payment.belongToId, {
            paymentStatus: "Success",
        });
    }

    await payment.save();
    await payment.populate("sender", "residentFirstname flatNo");
    await payment.populate("receiver", "name");
    return payment;
}

// ─────────────────────────────────────────────
// QUERIES
// ─────────────────────────────────────────────

/** Get all payments for a community (manager view) */
export async function getPaymentsByCommunity(communityId) {
    return Payment.find({ community: communityId })
        .populate("receiver", "name")
        .populate("sender", "name flatNumber")
        .sort({ paymentDeadline: -1 });
}

/** Get all payments where resident is sender */
export async function getPaymentsByResident(residentId) {
    return Payment.find({ sender: residentId })
        .populate("receiver", "name")
        .populate("sender", "name flatNumber")
        .sort({ paymentDeadline: -1 });
}

/** Get a single payment by id */
export async function getPaymentById(paymentId) {
    return Payment.findById(paymentId)
        .populate("sender", "residentFirstname flatNo name")
        .populate("receiver", "name");
}

/** Get pending/overdue payments for a resident */
export async function getPendingPayments(residentId) {
    return Payment.find({ sender: residentId, status: { $in: ["Pending", "Overdue"] } });
}

// ─────────────────────────────────────────────
// DELETE
// ─────────────────────────────────────────────

/** Delete a payment (manager only, community-scoped) */
export async function deletePaymentById(paymentId, communityId) {
    const payment = await Payment.findOne({ _id: paymentId, community: communityId });
    if (!payment) throw new Error("Payment not found or access denied");
    await Payment.deleteOne({ _id: paymentId });
}
