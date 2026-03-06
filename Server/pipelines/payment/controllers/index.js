/**
 * Payment controllers — HTTP handlers that call paymentService.
 * Used by the payment pipeline routers only.
 * Pipelines that need payment logic should use paymentService directly, not these handlers.
 */

import {
    createPaymentRecord,
    resolveReceiver,
    markPaymentPaid,
    getPaymentsByCommunity,
    getPaymentsByResident,
    getPaymentById,
    deletePaymentById,
} from "../services/paymentService.js";
import Resident from "../../../models/resident.js";
import Payment from "../../../models/payment.js";

// ── MANAGER ──────────────────────────────────

export const getAllPayments = async (req, res) => {
    try {
        const payments = await getPaymentsByCommunity(req.user.community);
        return res.status(200).json(payments);
    } catch (e) {
        return res.status(500).json({ message: "Error fetching payments", error: e.message });
    }
};

export const createPayment = async (req, res) => {
    try {
        const { title, senderId, receiverId, amount, remarks, paymentDeadline, paymentMethod } = req.body;
        const payment = await createPaymentRecord({
            title, senderId, receiverId, amount,
            communityId: req.user.community,
            remarks, paymentDeadline, paymentMethod,
        });
        return res.status(201).json(payment);
    } catch (e) {
        return res.status(400).json({ message: e.message });
    }
};

export const updatePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, remarks, paymentMethod, amount } = req.body;
        const payment = await Payment.findOne({ _id: id, community: req.user.community });
        if (!payment) return res.status(404).json({ message: "Payment not found or access denied" });
        if (status) {
            payment.status = status;
            if (status === "Completed" && !payment.paymentDate) payment.paymentDate = new Date();
        }
        if (paymentMethod) payment.paymentMethod = paymentMethod;
        if (remarks !== undefined) payment.remarks = remarks;
        if (amount !== undefined) payment.amount = parseFloat(amount);
        await payment.save();
        await payment.populate("sender", "residentFirstname flatNo name");
        await payment.populate("receiver", "name");
        return res.status(200).json(payment);
    } catch (e) {
        return res.status(500).json({ message: "Error updating payment", error: e.message });
    }
};

export const deletePayment = async (req, res) => {
    try {
        await deletePaymentById(req.params.id, req.user.community);
        return res.status(200).json({ message: "Payment deleted successfully" });
    } catch (e) {
        return res.status(404).json({ message: e.message });
    }
};

export const getAllResidents = async (req, res) => {
    try {
        const residents = await Resident.find({ community: req.user.community })
            .select("residentFirstname flatNo email contact");
        return res.status(200).json(residents);
    } catch (e) {
        return res.status(500).json({ message: "Error fetching residents", error: e.message });
    }
};

// ── RESIDENT ─────────────────────────────────

export const getResidentPayments = async (req, res) => {
    try {
        const payments = await getPaymentsByResident(req.user.id);
        return res.status(200).json(payments);
    } catch (e) {
        return res.status(500).json({ message: "Error fetching payments", error: e.message });
    }
};

export const createResidentPayment = async (req, res) => {
    try {
        const { title, amount, paymentMethod, receiverId } = req.body;
        if (!title || !amount) return res.status(400).json({ message: "Title and amount are required" });
        const resident = await Resident.findById(req.user.id);
        if (!resident) return res.status(404).json({ message: "Resident not found" });
        const finalReceiverId = await resolveReceiver(resident.community, receiverId) || req.user.id;
        const payment = await createPaymentRecord({
            title, senderId: req.user.id, receiverId: finalReceiverId,
            amount, communityId: resident.community,
            paymentMethod: paymentMethod || "Online",
            status: "Completed",
            remarks: "Self-payment by resident",
        });
        return res.status(201).json(payment);
    } catch (e) {
        return res.status(500).json({ message: "Error creating payment", error: e.message });
    }
};

export const updateResidentPayment = async (req, res) => {
    try {
        const { status, paymentMethod, paymentDate } = req.body;
        const payment = await markPaymentPaid(req.params.id, req.user.id, { paymentMethod, paymentDate });
        return res.status(200).json({ message: "Payment updated successfully", payment });
    } catch (e) {
        return res.status(404).json({ message: e.message });
    }
};

export const getSinglePayment = async (req, res) => {
    try {
        const payment = await getPaymentById(req.params.id);
        if (!payment) return res.status(404).json({ message: "Payment not found" });
        return res.status(200).json(payment);
    } catch (e) {
        return res.status(500).json({ message: "Error fetching payment", error: e.message });
    }
};

export const getCommunityPaymentInfo = async (req, res) => {
    try {
        const community = req.community;
        return res.status(200).json(community);
    } catch (err) {
        console.error("Community fetch error:", err);
        return res.status(500).json({ message: "Error fetching community data" });
    }
};
