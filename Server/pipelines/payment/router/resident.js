import express from "express";
import {
    getResidentPayments,
    createResidentPayment,
    updateResidentPayment,
    getSinglePayment,
} from "../controllers/index.js";
import Payment from "../../../models/payment.js";

const paymentResidentRouter = express.Router();

// GET /resident/payments — list all my payments
paymentResidentRouter.get("/payments", getResidentPayments);

// POST /resident/payment — self-pay
paymentResidentRouter.post("/payment", createResidentPayment);

// PATCH /resident/payment/:id — mark payment complete
paymentResidentRouter.patch("/payment/:id", updateResidentPayment);

// GET /resident/payment/receipt/:id
paymentResidentRouter.get("/payment/receipt/:id", getSinglePayment);

// GET /resident/payment/:paymentId — specific payment
paymentResidentRouter.get("/payment/:paymentId", getSinglePayment);

// GET /resident/payment/community — community payment info
import Community from "../../../models/communities.js";
paymentResidentRouter.get("/payment/community", async (req, res) => {
    try {
        const community = req.community;
        return res.status(200).json(community);
    } catch (err) {
        console.error("Community fetch error:", err);
        return res.status(500).json({ message: "Error fetching community data" });
    }
});

export default paymentResidentRouter;

