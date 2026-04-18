import CommunityManager from "../../../models/cManager.js";
import Community from "../../../models/communities.js";
import { sendError, sendSuccess } from "../../shared/helpers.js";
import { handleProfileImageUpload, handlePasswordChange } from "../utils/profileShared.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{10}$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d!@#$%^&*]).{8,}$/;

export const getManagerProfile = async (req, res) => {
    try {
        const manager = await CommunityManager.findById(req.user.id)
            .populate("assignedCommunity");

        if (!manager) {
            return sendError(res, 404, "Manager not found");
        }

        return sendSuccess(res, "Profile fetched successfully", { manager });
    } catch (err) {
        console.error("Error fetching profile:", err);
        return sendError(res, 500, "Server error", err);
    }
};

export const getProfileWithCommunity = async (req, res) => {
    try {
        const managerId = req.user.id;
        const manager = await CommunityManager.findById(managerId); // Profile still needs the manager object for name/email
        const community = req.community;

        await community.rotateCodeIfExpired();
        const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

        res.json({
            success: true,
            manager: {
                name: manager.name || "",
                email: manager.email || "",
                contact: manager.contact || "",
                location: manager.location || "",
                address: manager.address || "",
            },
            community: {
                name: community?.name || "",
                communityCode: community.communityCode,
                codeExpiresAt: new Date(
                    community.communityCodeLastRotatedAt.getTime() + SEVEN_DAYS
                ),
            },
        });
    } catch (error) {
        console.error("Error fetching manager profile:", error);
        return sendError(res, 500, "Failed to fetch profile", error);
    }
};

export const updateManagerProfile = async (req, res) => {
    try {
        const { name, email, contact, location, address } = req.body;
        const managerId = req.user.id;
        const safeName = String(name || "").trim();
        const safeEmail = String(email || "").trim().toLowerCase();
        const safeContact = String(contact || "").trim();
        const safeLocation = String(location || "").trim();
        const safeAddress = String(address || "").trim();

        if (safeName && safeName.length < 2) {
            return sendError(res, 400, "Name must be at least 2 characters");
        }
        if (safeEmail && !EMAIL_REGEX.test(safeEmail)) {
            return sendError(res, 400, "Invalid email address");
        }
        if (safeContact && !PHONE_REGEX.test(safeContact)) {
            return sendError(res, 400, "Contact must be a 10-digit number");
        }

        const manager = await CommunityManager.findById(managerId);
        if (!manager) {
            return sendError(res, 404, "Manager not found");
        }

        manager.name = safeName || manager.name;
        manager.email = safeEmail || manager.email;
        manager.contact = safeContact || manager.contact;
        manager.location = safeLocation || manager.location;
        manager.address = safeAddress || manager.address;

        if (req.file && req.file.buffer) {
            try {
                const uploadData = await handleProfileImageUpload(req.file, "profiles/manager");
                if (uploadData) {
                    manager.image = uploadData.url;
                    manager.imagePublicId = uploadData.publicId;
                }
            } catch (err) {
                return sendError(res, 500, err.message, err);
            }
        }

        await manager.save();

        res.json({
            success: true,
            message: "Profile updated successfully",
            manager: {
                name: manager.name,
                email: manager.email,
                contact: manager.contact,
                location: manager.location,
                address: manager.address,
            },
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        return sendError(res, 500, "Failed to update profile", error);
    }
};

export const changePassword = async (req, res) => {
    const { cp, np, cnp } = req.body;
    if (!cp || !np || !cnp) {
        return sendError(res, 400, "Current password, new password, and confirm password are required");
    }
    if (np !== cnp) {
        return sendError(res, 400, "New passwords do not match");
    }
    if (!STRONG_PASSWORD_REGEX.test(np)) {
        return sendError(res, 400, "Password must be at least 8 characters with uppercase, lowercase, and number/special character");
    }
    if (cp === np) {
        return sendError(res, 400, "New password must be different from current password");
    }
    return handlePasswordChange(res, CommunityManager, req.user.id, cp, np);
};
