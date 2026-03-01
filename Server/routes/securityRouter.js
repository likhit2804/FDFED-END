import express from "express";
const securityRouter = express.Router();

import Security from "../core/models/security.js";
import VisitorPreApproval from "../core/models/preapproval.js";
import Ad from "../core/models/Ad.js";

import visitor from "../core/models/visitors.js";

import mongoose from "mongoose";

import multer from "multer";
import cloudinary from "../core/configs/cloudinary.js";
import bcrypt from "bcrypt";

import { getDashboardInfo } from "../pipelines/dashboard/security/controller.js";
import {
  getProfile as getSecurityProfile,
  updateProfile as updateSecurityProfile,
  changePassword as changeSecurityPassword,
} from "../pipelines/profile/security/controller.js";
import Visitor from "../core/models/visitors.js";
import checkSubscriptionStatus from "../core/middleware/subscriptionStatus.js";
import * as SecurityController from "../pipelines/visitor/security/controller.js"

// Multer memory storage for security profile images (Cloudinary in handler)
const upload = multer({ storage: multer.memoryStorage() });

// Block access for security staff when community subscription is inactive/expired
securityRouter.use(checkSubscriptionStatus);

function generateCustomID(userEmail, facility, countOrRandom = null) {
  const id = userEmail.toUpperCase().slice(0, 2);
  const facilityCode = facility.toUpperCase().slice(0, 2);
  const suffix = countOrRandom
    ? String(countOrRandom).padStart(4, "0")
    : String(Math.floor(1000 + Math.random() * 9000));
  return `UE-${id}${facilityCode}${suffix}`;
}


securityRouter.post("/addVisitor", async (req, res) => {
  const {
    visitorType,
    fullName,
    contact,

    email,

    vehicleNo,
  } = req.body;


  const tempId = new mongoose.Types.ObjectId();
  const uniqueId = generateCustomID(tempId.toString(), "PA", null);
  console.log(uniqueId);
  try {
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
    console.log("visitor entered");
    return res.json({ success: true, message: "Visitor added successfully", visitor: v });
  } catch (err) {
    console.log(err);
  }


});

securityRouter.get("/dashboard", (req, res) => {
  return res.json({
    success: true,
    message: "Security dashboard base route OK",
  });
});

// API route your React fetches
securityRouter.get("/dashboard/api", getDashboardInfo);

//Preapproval routes
securityRouter.get("/preApproval", SecurityController.getPreApprovals);
securityRouter.post("/preApproval/action", SecurityController.updatePreApprovalStatus);
securityRouter.post("/verify-qr", SecurityController.verifyQr);


// Visitor mamagement routes
securityRouter.get("/visitorManagement", SecurityController.getVisitorManagementPage);
securityRouter.get("/visitorManagement/api/visitors", SecurityController.getVisitorsApi);
securityRouter.get("/visitorManagement/:action/:id", SecurityController.updateVisitorStatus);

// Profile routes
securityRouter.get("/profile", getSecurityProfile);
securityRouter.post("/profile", upload.single("image"), updateSecurityProfile);
securityRouter.post("/change-password", changeSecurityPassword);


export default securityRouter;


