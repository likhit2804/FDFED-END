import express from "express";
import mongoose from "mongoose";
import visitor from "../../../models/visitors.js";
import { generateVisitorID } from "../../../utils/idGenerator.js";
import {
    getVisitorManagementPage,
    getVisitorsApi,
    updateVisitorStatus,
} from "../controllers/manager.js";

const visitorManagementSecurityRouter = express.Router();

// POST /security/addVisitor (moved from securityRouter)
visitorManagementSecurityRouter.post("/addVisitor", async (req, res) => {
    const { visitorType, fullName, contact, email, vehicleNo } = req.body;
    try {
        const tempId = new mongoose.Types.ObjectId();
        const uniqueId = generateVisitorID(tempId.toString());
        const v = await visitor.create({
            ID: uniqueId,
            name: fullName,
            contactNumber: contact,
            purpose: visitorType,
            vehicleNumber: vehicleNo,
            email,
            addedBy: req.user.id,
            community: req.user.community,
        });
        return res.json({ success: true, message: "Visitor added successfully", visitor: v });
    } catch (err) {
        console.error("addVisitor error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
});

// Visitor management page (initial load)
visitorManagementSecurityRouter.get("/visitorManagement", getVisitorManagementPage);

// API: auto-refresh visitor list + stats
visitorManagementSecurityRouter.get("/visitorManagement/api/visitors", getVisitorsApi);

// Check-in / check-out action
visitorManagementSecurityRouter.get("/visitorManagement/:action/:id", updateVisitorStatus);

export default visitorManagementSecurityRouter;
