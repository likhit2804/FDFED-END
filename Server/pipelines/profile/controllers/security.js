import Security from "../../../models/security.js";
import { handleProfileImageUpload, handlePasswordChange } from "../utils/profileShared.js";

/**
 * GET /security/profile
 */
export const getProfile = async (req, res) => {
    try {
        const security = await Security.findById(req.user.id)
            .select("name email contact address image Shift workplace joiningDate community")
            .populate("community", "name"); // populate so community.name is available

        if (!security) {
            return res.status(404).json({ success: false, message: "Security not found" });
        }

        // Flatten community name so frontend can read s.community?.communityName
        const securityObj = security.toObject();
        securityObj.community = {
            ...securityObj.community,
            communityName: security.community?.name || "",
        };

        return res.json({ success: true, security: securityObj });
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
