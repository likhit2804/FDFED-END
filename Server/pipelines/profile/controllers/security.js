import Security from "../../../models/security.js";
import Ad from "../../../models/Ad.js";
import { handleProfileImageUpload, handlePasswordChange } from "../utils/profileShared.js";

/**
 * GET /security/profile
 */
export const getProfile = async (req, res) => {
    try {
        const security = await Security.findById(req.user.id)
            .select("name email contact address image Shift workplace joiningDate community");

        if (!security) {
            return res.status(404).json({ success: false, message: "Security not found" });
        }

        const ads = await Ad.find({
            community: req.user.community,
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() },
        });

        return res.json({ success: true, security, ads });
    } catch (err) {
        console.error("Error loading security profile:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * POST /security/profile
 */
export const updateProfile = async (req, res) => {
    try {
        const { name, email, contact, address } = req.body;

        const security = await Security.findById(req.user.id);
        if (!security) {
            return res.status(404).json({ success: false, message: "Security not found" });
        }

        if (name) security.name = name;
        if (email) security.email = email;
        if (contact) security.contact = contact;
        if (address) security.address = address;

        if (req.file && req.file.buffer) {
            try {
                const uploadData = await handleProfileImageUpload(req.file, "profiles/security");
                if (uploadData) {
                    security.image = uploadData.url;
                    security.imagePublicId = uploadData.publicId;
                }
            } catch (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
        }

        await security.save();
        return res.json({ success: true, message: "Profile updated successfully", security });
    } catch (err) {
        console.error("Error updating profile:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * POST /security/change-password
 */
export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    return handlePasswordChange(res, Security, req.user.id, currentPassword, newPassword);
};
