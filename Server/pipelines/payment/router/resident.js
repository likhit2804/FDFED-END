import express from "express";
import {
    getResidentPayments,
    createResidentPayment,
    updateResidentPayment,
    getSinglePayment,
    getCommunityPaymentInfo,
} from "../controllers/index.js";

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
paymentResidentRouter.get("/payment/community", getCommunityPaymentInfo);

export default paymentResidentRouter;

