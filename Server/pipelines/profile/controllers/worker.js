import Worker from "../../../models/workers.js";
import { handleProfileImageUpload, handlePasswordChange } from "../utils/profileShared.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{10}$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d!@#$%^&*]).{8,}$/;

// GET /worker/profile
export const getProfile = async (req, res) => {
    try {
        const r = await Worker.findById(req.user.id);
        return res.json({ success: true, worker: r });
    } catch (err) {
        console.error(err);
        return res.json({ success: false, message: "Server error" });
    }
};

// POST /worker/profile
export const updateProfile = async (req, res) => {
    try {
        const { name, email, contact, address } = req.body;
        const safeName = String(name || "").trim();
        const safeEmail = String(email || "").trim().toLowerCase();
        const safeContact = String(contact || "").trim();
        const safeAddress = String(address || "").trim();

        if (!safeName || !safeEmail) {
            return res.status(400).json({ success: false, message: "Name and email are required" });
        }
        if (!EMAIL_REGEX.test(safeEmail)) {
            return res.status(400).json({ success: false, message: "Invalid email address" });
        }
        if (safeContact && !PHONE_REGEX.test(safeContact)) {
            return res.status(400).json({ success: false, message: "Contact must be a 10-digit number" });
        }

        const r = await Worker.findById(req.user.id);
        let image = r.image;

        if (req.file && req.file.buffer) {
            try {
                const uploadData = await handleProfileImageUpload(req.file, "profiles/worker");
                if (uploadData) {
                    image = uploadData.url;
                    r.imagePublicId = uploadData.publicId;
                }
            } catch (err) {
                return res.status(500).json({ success: false, message: err.message });
            }
        }

        r.name = safeName;
        r.email = safeEmail;
        r.contact = safeContact;
        r.address = safeAddress;

        if (image) {
            r.image = image;
        }

        await r.save();
        return res.json({ success: true, message: "Profile updated successfully", worker: r });
    } catch (err) {
        console.error(err);
        return res.json({ success: false, message: "Server error" });
    }
};

// POST /worker/change-password
export const changePassword = async (req, res) => {
    // Accept both { cp, np } (legacy) and { currentPassword, newPassword } (frontend)
    const cp = req.body.cp || req.body.currentPassword;
    const np = req.body.np || req.body.newPassword;
    if (!cp || !np) {
        return res.status(400).json({ success: false, message: "Current and new passwords are required" });
    }
    if (!STRONG_PASSWORD_REGEX.test(np)) {
        return res.status(400).json({ success: false, message: "New password must be at least 8 characters with uppercase, lowercase, and number/special character" });
    }
    if (cp === np) {
        return res.status(400).json({ success: false, message: "New password must be different from current password" });
    }
    return handlePasswordChange(res, Worker, req.user.id, cp, np);
};
