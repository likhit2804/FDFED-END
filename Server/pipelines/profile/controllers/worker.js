import Worker from "../../../models/workers.js";
import Ad from "../../../models/Ad.js";
import { handleProfileImageUpload, handlePasswordChange } from "../utils/profileShared.js";

// GET /worker/profile
export const getProfile = async (req, res) => {
    try {
        const ads = await Ad.find({ community: req.user.community, startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });
        const r = await Worker.findById(req.user.id);
        return res.json({ success: true, worker: r, ads: ads });
    } catch (err) {
        console.error(err);
        return res.json({ success: false, message: "Server error" });
    }
};

// POST /worker/profile
export const updateProfile = async (req, res) => {
    try {
        const { name, email, contact, address } = req.body;
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

        r.name = name;
        r.email = email;
        r.contact = contact;
        r.address = address;

        if (image) {
            r.image = image;
        }

        await r.save();
        return res.json({ success: true, message: "Profile updated successfully", r });
    } catch (err) {
        console.error(err);
        return res.json({ success: false, message: "Server error" });
    }
};

// POST /worker/change-password
export const changePassword = async (req, res) => {
    const { cp, np } = req.body;
    return handlePasswordChange(res, Worker, req.user.id, cp, np);
};
