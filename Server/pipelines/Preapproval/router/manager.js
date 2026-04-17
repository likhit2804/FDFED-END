import express from "express";
import {
    getPreApprovals,
    createPreApproval,
    cancelPreApproval,
    getQRcode,
} from "../controllers/manager.js";

const preapprovalResidentRouter = express.Router();

// Pre-approval routes for residents
preapprovalResidentRouter.get("/preApprovals", getPreApprovals);
preapprovalResidentRouter.post("/preapproval", createPreApproval);
preapprovalResidentRouter.delete("/preapproval/cancel/:id", cancelPreApproval);
preapprovalResidentRouter.get("/preapproval/qr/:id", getQRcode);

export default preapprovalResidentRouter;
