import express from "express";
import {
    getPreApprovals,
    updatePreApprovalStatus,
    verifyQr,
} from "../controllers/security.js";

const preapprovalSecurityRouter = express.Router();

// Pre-approval routes
preapprovalSecurityRouter.get("/preApproval", getPreApprovals);
preapprovalSecurityRouter.post("/preApproval/action", updatePreApprovalStatus);

// QR verification
preapprovalSecurityRouter.post("/verify-qr", verifyQr);

export default preapprovalSecurityRouter;
