import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import CommunityManager from "../../../models/cManager.js";
import Resident from "../../../models/resident.js";
import Security from "../../../models/security.js";
import Worker from "../../../models/workers.js";
import Admin from "../../../models/admin.js";
import Payment from "../../../models/payment.js";

async function verifyCredentials(model, email, password) {
    const user = await model.findOne({ email });
    if (!user) return null;

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return null;

    const userType = model.modelName;
    const userPayload = {
        id: user._id,
        email: user.email,
        userType,
    };

    if (userType === "Resident" || userType === "Security" || userType === "Worker") {
        userPayload.community = user.community;
    } else if (userType === "CommunityManager") {
        userPayload.community = user.assignedCommunity;
    } else {
        userPayload.community = null;
    }

    return { user, userPayload };
}

export async function VerifyR(email, password) {
    return verifyCredentials(Resident, email, password);
}

export async function VerifyS(email, password) {
    return verifyCredentials(Security, email, password);
}

export async function VerifyW(email, password) {
    return verifyCredentials(Worker, email, password);
}

export async function VerifyA(email, password) {
    return verifyCredentials(Admin, email, password);
}

export async function VerifyC(email, password) {
    return verifyCredentials(CommunityManager, email, password);
}

export async function getAllPayments(req, res) {
    try {
        const filter = {};
        if (req.user?.community) {
            filter.community = req.user.community;
        }

        const payments = await Payment.find(filter)
            .populate("sender", "residentFirstname residentLastname email")
            .populate("receiver", "name email")
            .sort({ createdAt: -1 });

        return res.json({ success: true, payments });
    } catch (err) {
        console.error("getAllPayments error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
}

export async function createPayment(req, res) {
    try {
        const payload = {
            ...req.body,
            community: req.body.community || req.user?.community || null,
        };

        const payment = await Payment.create(payload);
        return res.status(201).json({ success: true, payment });
    } catch (err) {
        console.error("createPayment error:", err);
        return res.status(500).json({ success: false, message: "Failed to create payment" });
    }
}

export async function getAllResidents(req, res) {
    try {
        let communityId = req.user?.community || null;

        if (!communityId && req.user?.userType === "CommunityManager") {
            const manager = await CommunityManager.findById(req.user.id).select("assignedCommunity");
            communityId = manager?.assignedCommunity || null;
        }

        const filter = communityId ? { community: communityId } : {};
        const residents = await Resident.find(filter).select("residentFirstname residentLastname email contact uCode");

        return res.json({ success: true, residents });
    } catch (err) {
        console.error("getAllResidents error:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch residents" });
    }
}

export async function getCurrentcManager(req, res) {
    try {
        const manager = await CommunityManager.findById(req.user?.id).select("name email contact assignedCommunity");
        if (!manager) {
            return res.status(404).json({ success: false, message: "Community manager not found" });
        }
        return res.json({ success: true, manager });
    } catch (err) {
        console.error("getCurrentcManager error:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch manager" });
    }
}

export async function getPaymentById(req, res) {
    try {
        const payment = await Payment.findById(req.params.id).populate("sender receiver");
        if (!payment) {
            return res.status(404).json({ success: false, message: "Payment not found" });
        }
        return res.json({ success: true, payment });
    } catch (err) {
        console.error("getPaymentById error:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch payment" });
    }
}

export async function updatePayment(req, res) {
    try {
        const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!payment) {
            return res.status(404).json({ success: false, message: "Payment not found" });
        }
        return res.json({ success: true, payment });
    } catch (err) {
        console.error("updatePayment error:", err);
        return res.status(500).json({ success: false, message: "Failed to update payment" });
    }
}

export async function deletePayment(req, res) {
    try {
        const payment = await Payment.findByIdAndDelete(req.params.id);
        if (!payment) {
            return res.status(404).json({ success: false, message: "Payment not found" });
        }
        return res.json({ success: true, message: "Payment deleted" });
    } catch (err) {
        console.error("deletePayment error:", err);
        return res.status(500).json({ success: false, message: "Failed to delete payment" });
    }
}

export async function updateResidentPayment(req, res) {
    try {
        const payment = await Payment.findOne({
            _id: req.params.id,
            sender: req.user?.id,
        });

        if (!payment) {
            return res.status(404).json({ success: false, message: "Payment not found" });
        }

        const status = req.body?.status || "Completed";
        if (status) payment.status = status;
        if (req.body?.paymentMethod) payment.paymentMethod = req.body.paymentMethod;
        if (req.body?.remarks) payment.remarks = req.body.remarks;
        if (payment.status === "Completed" && !payment.paymentDate) {
            payment.paymentDate = new Date();
        }

        await payment.save();
        return res.json({ success: true, payment });
    } catch (err) {
        console.error("updateResidentPayment error:", err);
        return res.status(500).json({ success: false, message: "Failed to update resident payment" });
    }
}

const PaymentController = {
    getAllPayments,
    createPayment,
    getAllResidents,
    getCurrentcManager,
    getPaymentById,
    updatePayment,
    deletePayment,
    updateResidentPayment,
};

export default PaymentController;

