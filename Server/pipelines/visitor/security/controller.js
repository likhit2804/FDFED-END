import visitor from "../../../core/models/visitors.js";
import Ad from "../../../core/models/Ad.js";
import Security from "../../../core/models/security.js";
import bcrypt from "bcrypt";
import cloudinary from "../../../core/configs/cloudinary.js";
import {
  getPreApprovals,
  updatePreApprovalStatus,
  verifyQr,
} from "../../preapproval/security/controller.js";

/**
 * GET /visitorManagement
 * Initial load (visitors + ads)
 */
export const getVisitorManagementPage = async (req, res) => {
  try {
    const visitors = await visitor.find({
      community: req.user.community,
      addedBy: req.user.id,
    });

    visitors.sort(
      (a, b) =>
        new Date(b.entryDate || b.createdAt) -
        new Date(a.entryDate || a.createdAt)
    );

    const ads = await Ad.find({
      community: req.user.community,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    return res.json({
      success: true,
      visitors,
      ads,
    });
  } catch (err) {
    console.error("VisitorManagement error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error loading visitor data",
    });
  }
};

/**
 * GET /visitorManagement/api/visitors
 * Auto-refresh visitor list + stats
 */
export const getVisitorsApi = async (req, res) => {
  try {
    const visitors = await visitor.find({
      community: req.user.community,
      addedBy: req.user.id,
    });

    visitors.sort((a, b) => {
      const dateA = new Date(a.entryDate || a.createdAt);
      const dateB = new Date(b.entryDate || b.createdAt);
      return dateB - dateA;
    });

    const stats = {
      total: visitors.length,
      active: visitors.filter(v => v.status === "Active").length,
      checkedOut: visitors.filter(v => v.status === "CheckedOut").length,
      pending: visitors.filter(v => v.status === "Pending").length,
    };

    return res.json({
      success: true,
      visitors,
      stats,
    });
  } catch (error) {
    console.error("Error fetching visitors:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching visitor data",
    });
  }
};

/**
 * GET /visitorManagement/:action/:id
 * Check-in / Check-out visitor
 */
export const updateVisitorStatus = async (req, res) => {
  const { action, id } = req.params;

  try {
    const v = await visitor.findById(id);

    if (!v) {
      return res
        .status(404)
        .json({ success: false, message: "Visitor not found" });
    }

    if (action === "checked-in") {
      v.status = "Active";
      v.checkInAt = new Date();
      v.isCheckedIn = true;
    } else if (action === "checked-out") {
      v.status = "CheckedOut";
      v.checkOutAt = new Date();
      v.isCheckedIn = false;
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid action" });
    }

    await v.save();

    return res.status(200).json({
      success: true,
      message: "Visitor updated",
      visitor: v,
    });
  } catch (error) {
    console.error("Error updating visitor status:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getProfile = async (req, res) => {
  try {
    const security = await Security.findById(req.user.id);
    if (!security) {
      return res.status(404).json({ success: false, message: "Security user not found" });
    }

    const ads = await Ad.find({
      community: req.user.community,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    return res.json({ success: true, security, ads });
  } catch (err) {
    console.error("Get security profile error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const security = await Security.findById(req.user.id);
    if (!security) {
      return res.status(404).json({ success: false, message: "Security user not found" });
    }

    const { name, email, contact, address } = req.body;
    if (name !== undefined) security.name = name;
    if (email !== undefined) security.email = email;
    if (contact !== undefined) security.contact = contact;
    if (address !== undefined) security.address = address;

    if (req.file?.buffer) {
      const uploaded = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "profiles/security",
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
      security.image = uploaded.secure_url;
      security.imagePublicId = uploaded.public_id;
    }

    await security.save();
    return res.json({ success: true, security });
  } catch (err) {
    console.error("Update security profile error:", err);
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

    const security = await Security.findById(req.user.id);
    if (!security) {
      return res.status(404).json({ success: false, message: "Security user not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, security.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    security.password = await bcrypt.hash(newPassword, 10);
    await security.save();

    return res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("Change security password error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export { getPreApprovals, updatePreApprovalStatus, verifyQr };
    
