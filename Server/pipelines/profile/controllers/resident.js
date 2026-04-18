import Resident from "../../../models/resident.js";
import { handleProfileImageUpload, handlePasswordChange } from "../utils/profileShared.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9]{10}$/;
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d!@#$%^&*]).{8,}$/;

export const updateProfile = async (req, res) => {
    const resident = await Resident.findById(req.user.id);
    if (!resident) {
        return res.status(404).json({ message: "Resident not found" });
    }

    const { firstName, lastName, contact, email } = req.body;
    const safeFirstName = String(firstName || "").trim();
    const safeLastName = String(lastName || "").trim();
    const safeContact = String(contact || "").trim();
    const safeEmail = String(email || "").trim().toLowerCase();

    if (!safeFirstName || !safeLastName || !safeEmail) {
        return res.status(400).json({ success: false, message: "First name, last name, and email are required" });
    }
    if (!EMAIL_REGEX.test(safeEmail)) {
        return res.status(400).json({ success: false, message: "Invalid email address" });
    }
    if (safeContact && !PHONE_REGEX.test(safeContact)) {
        return res.status(400).json({ success: false, message: "Contact must be a 10-digit number" });
    }

    if (req.file && req.file.buffer) {
        try {
            const uploadData = await handleProfileImageUpload(req.file, "profiles/resident");
            if (uploadData) {
                resident.image = uploadData.url;
                resident.imagePublicId = uploadData.publicId;
            }
        } catch (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
    }

    resident.residentFirstname = safeFirstName;
    resident.residentLastname = safeLastName;
    resident.contact = safeContact;
    resident.email = safeEmail;

    await resident.save();

    res.json({ success: true, resident });
};

export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return res.status(400).json({ success: false, message: "Current and new passwords are required" });
    }
    if (!STRONG_PASSWORD_REGEX.test(newPassword)) {
        return res.status(400).json({ success: false, message: "New password must be at least 8 characters with uppercase, lowercase, and number/special character" });
    }
    if (currentPassword === newPassword) {
        return res.status(400).json({ success: false, message: "New password must be different from current password" });
    }
    return handlePasswordChange(res, Resident, req.user.id, currentPassword, newPassword);
};

export const getResidentProfile = async (req, res) => {
    try {
        const resident = await Resident.findById(req.user.id)
            .populate("community");

        if (!resident) {
            return res.json({
                success: false,
                message: "Resident not found"
            });
        }

        return res.json({
            success: true,
            resident: {
                firstname: resident.residentFirstname,
                lastname: resident.residentLastname,
                email: resident.email,
                contact: resident.contact,
                uCode: resident.uCode,
                communityName: resident.community?.name || "",
                image: resident.image || null
            }
        });

    } catch (err) {
        console.error("Error fetching profile:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
