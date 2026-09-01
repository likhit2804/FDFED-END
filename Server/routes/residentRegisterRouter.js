import express from "express";
import bcrypt from "bcrypt";
import Flat from "../models/flats.js";
import Resident from "../models/resident.js";
import { sendTemporaryPassword } from "../utils/otp.js";

const residentRegisterRouter = express.Router();

/**
 * @swagger
 * /resident-register/validate-code:
 *   post:
 *     summary: Validate a resident registration code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 example: "abc123"
 *     responses:
 *       200:
 *         description: Valid code — returns community and flat info
 *       404:
 *         description: Invalid or already-used code
 *       400:
 *         description: Flat already occupied
 */
residentRegisterRouter.post("/validate-code", async (req, res) => {
  try {
    const { code: rawCode } = req.body;
    if (!rawCode)
      return res.status(400).json({ success: false, message: "Registration code is required" });

    const code = rawCode.trim().toLowerCase();

    // Find the flat that owns this code (case-insensitive) and populate related info
    const foundFlat = await Flat.findOne({
      registrationCode: new RegExp(`^${code}$`, 'i')
    }).populate("community block");

    if (!foundFlat)
      return res.status(404).json({ success: false, message: "Invalid or already-used registration code" });

    if (foundFlat.status !== "Vacant")
      return res.status(400).json({ success: false, message: "This code is no longer valid (flat already occupied)" });

    return res.json({
      success: true,
      data: {
        communityId: foundFlat.community._id,
        communityName: foundFlat.community.name,
        block: foundFlat.block.name,
        flatNumber: foundFlat.flatNumber,
        floor: foundFlat.floor,
        registrationCode: code
      }
    });
  } catch (err) {
    console.error("[VALIDATE-CODE] Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * @swagger
 * /resident-register/complete:
 *   post:
 *     summary: Complete resident registration with code + personal details
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [residentFirstname, residentLastname, email, registrationCode]
 *             properties:
 *               residentFirstname:
 *                 type: string
 *               residentLastname:
 *                 type: string
 *               contact:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               registrationCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Registration complete, temporary password emailed
 *       404:
 *         description: Invalid registration code
 *       409:
 *         description: Email already exists
 */
residentRegisterRouter.post("/complete", async (req, res) => {
  try {
    const { residentFirstname, residentLastname, contact, email, registrationCode: rawCode } = req.body;

    if (!residentFirstname || !residentLastname || !email || !rawCode)
      return res.status(400).json({ success: false, message: "Missing required fields" });

    const registrationCode = rawCode.trim().toLowerCase();

    // Re-validate the code (case-insensitive) against the Flat model
    const foundFlat = await Flat.findOne({
      registrationCode: new RegExp(`^${registrationCode}$`, 'i')
    }).populate("community");

    if (!foundFlat)
      return res.status(404).json({ success: false, message: "Invalid or already-used registration code" });

    if (foundFlat.status !== "Vacant")
      return res.status(400).json({ success: false, message: "Code is no longer valid" });

    const community = foundFlat.community;

    // Check email uniqueness
    const existing = await Resident.findOne({ email });
    if (existing && existing.password)
      return res.status(409).json({ success: false, message: "An account with this email already exists" });

    // Create resident
    const tempPassword = Math.random().toString(36).slice(-10);
    const hashed = await bcrypt.hash(tempPassword, 12);

    const resident = new Resident({
      residentFirstname,
      residentLastname,
      uCode: foundFlat.flatNumber,
      contact: contact || "",
      email,
      community: community._id,
      password: hashed,
    });
    await resident.save();

    // Link flat to resident, mark Occupied, clear the code
    foundFlat.residentId = resident._id;
    foundFlat.status = "Occupied";
    foundFlat.registrationCode = undefined;

    // Save the flat directly
    await foundFlat.save();

    await sendTemporaryPassword(email, tempPassword);

    return res.json({
      success: true,
      message: "Registration complete! Temporary password sent to your email.",
      residentId: resident._id,
    });
  } catch (err) {
    console.error("[COMPLETE-REGISTER] Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

export default residentRegisterRouter;
