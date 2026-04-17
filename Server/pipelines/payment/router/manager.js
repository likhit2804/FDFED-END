import express from "express";
import {
    getAllPayments,
    createPayment,
    updatePayment,
    deletePayment,
    getAllResidents,
} from "../controllers/index.js";

const paymentManagerRouter = express.Router();

// GET /manager/payments
paymentManagerRouter.get("/payments", getAllPayments);

// GET /manager/payment/residents — list residents for payment form
paymentManagerRouter.get("/payment/residents", getAllResidents);

// POST /manager/payment — manager creates a payment for a resident
paymentManagerRouter.post("/payment", createPayment);

// PUT /manager/payment/:id — manager updates status/remarks
paymentManagerRouter.put("/payment/:id", updatePayment);

// DELETE /manager/payment/:id
paymentManagerRouter.delete("/payment/:id", deletePayment);

export default paymentManagerRouter;
