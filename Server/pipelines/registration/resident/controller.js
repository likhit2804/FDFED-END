import Resident from "../../../core/models/resident.js";
import Community from "../../../core/models/communities.js";
import { sendLoginOtp, verifyOtp as verifyOtpCode } from "../../../core/modules/security/otp/OTP.js";
import bcrypt from "bcrypt";
import cloudinary from "../../../core/configs/cloudinary.js";
import {
  getResidentById,
  updateResidentById,
} from "../shared/residentCrud.js";
import {
  createPreApproval,
  cancelPreApproval,
  getPreApprovals,
  getQRcode,
} from "../../preapproval/resident/controller.js";

export const requestOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res
        .status(400)
        .json({ success: false, message: "Email is required" });
    }

    const existing = await Resident.findOne({ email });
    if (existing && existing.password) {
      return res
        .status(409)
        .json({ success: false, message: "Account already exists" });
    }

    await sendLoginOtp(email);
    return res.json({ success: true, message: "OTP sent to email" });
  } catch (err) {
    console.error("OTP request error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res
        .status(400)
        .json({ success: false, message: "Email and OTP required" });
    }

    const result = verifyOtpCode(email, otp);
    if (!result.ok) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid OTP" });
    }

    return res.json({ success: true, message: "OTP verified" });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const completeRegistration = async (req, res) => {
  try {
    const {
      residentFirstname,
      residentLastname,
      uCode,
      contact,
      email,
      communityCode,
    } = req.body;

    if (
      !residentFirstname ||
      !residentLastname ||
      !uCode ||
      !email ||
      !communityCode
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const community = await Community.findOne({ communityCode });
    if (!community) {
      return res
        .status(404)
        .json({ success: false, message: "Invalid community code" });
    }

    const rotated = await community.rotateCodeIfExpired();
    if (rotated) {
      return res.status(400).json({
        success: false,
        message:
          "Community code expired. Please request a new code from the manager.",
      });
    }

    let resident = await Resident.findOne({ email });

    if (!resident) {
      resident = new Resident({
        residentFirstname,
        residentLastname,
        uCode,
        contact,
        email,
        community: community._id,
      });
    }

    await resident.save();

    return res.json({
      success: true,
      message: "Resident registered",
      residentId: resident._id,
    });
  } catch (err) {
    console.error("Complete registration error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getResidentProfile = async (req, res) => {
  try {
    const resident = await getResidentById(req.user.id, null, {
      populate: "community",
    });
    if (!resident) {
      return res.status(404).json({ success: false, message: "Resident not found" });
    }

    return res.json({ success: true, resident });
  } catch (err) {
    console.error("Get resident profile error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const resident = await getResidentById(req.user.id);
    if (!resident) {
      return res.status(404).json({ success: false, message: "Resident not found" });
    }

    const { residentFirstname, residentLastname, email, contact, address } = req.body;

    const updates = {};
    if (residentFirstname !== undefined) updates.residentFirstname = residentFirstname;
    if (residentLastname !== undefined) updates.residentLastname = residentLastname;
    if (email !== undefined) updates.email = email;
    if (contact !== undefined) updates.contact = contact;
    if (address !== undefined) updates.address = address;

    if (req.file?.buffer) {
      const uploaded = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "profiles/resident",
            resource_type: "image",
            transformation: [
              { width: 512, height: 512, crop: "limit" },
              { quality: "auto:good" },
            ],
          },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        stream.end(req.file.buffer);
      });

      updates.image = uploaded.secure_url;
      updates.imagePublicId = uploaded.public_id;
    }

    const updatedResident = await updateResidentById(req.user.id, updates);
    return res.json({ success: true, resident: updatedResident });
  } catch (err) {
    console.error("Update resident profile error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const currentPassword = req.body.currentPassword ?? req.body.cp;
    const newPassword = req.body.newPassword ?? req.body.np;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Current and new password are required" });
    }

    const resident = await getResidentById(req.user.id);
    if (!resident) {
      return res.status(404).json({ success: false, message: "Resident not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, resident.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    resident.password = await bcrypt.hash(newPassword, 10);
    await resident.save();

    return res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("Change resident password error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export { createPreApproval, cancelPreApproval, getPreApprovals, getQRcode };





