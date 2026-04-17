import Resident from "../../../models/resident.js";
import { handleProfileImageUpload, handlePasswordChange } from "../utils/profileShared.js";

export const updateProfile = async (req, res) => {
    const resident = await Resident.findById(req.user.id);
    if (!resident) {
        return res.status(404).json({ message: "Resident not found" });
    }

    const { firstName, lastName, contact, email } = req.body;

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

    resident.residentFirstname = firstName;
    resident.residentLastname = lastName;
    resident.contact = contact;
    resident.email = email;

    await resident.save();

    res.json({ success: true, resident });
};

export const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
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
