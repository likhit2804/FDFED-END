import Worker from "../../models/workers.js";
import Ad from "../../models/Ad.js";
import bcrypt from "bcrypt";
import cloudinary from "../../configs/cloudinary.js";

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
                const result = await new Promise((resolve, reject) => {
                    const uploadStream = cloudinary.uploader.upload_stream(
                        {
                            folder: "profiles/worker",
                            resource_type: "image",
                            transformation: [
                                { width: 512, height: 512, crop: "limit" },
                                { quality: "auto:good" },
                            ],
                        },
                        (error, result) => {
                            if (error) return reject(error);
                            resolve(result);
                        }
                    );
                    uploadStream.end(req.file.buffer);
                });

                image = result.secure_url;
                r.imagePublicId = result.public_id;
            } catch (err) {
                console.error("Worker profile image upload error:", err);
                return res.status(500).json({
                    success: false,
                    message: "Failed to upload profile image.",
                });
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
    try {
        const { cp, np } = req.body;
        const security = await Worker.findById(req.user.id);

        if (!security) {
            return res.json({ success: false, message: "Worker not found." });
        }

        const isMatch = await bcrypt.compare(cp, security.password);
        if (!isMatch) {
            return res.json({
                success: false,
                message: "Current password does not match.",
            });
        }

        const salt = await bcrypt.genSalt(10);
        security.password = await bcrypt.hash(np, salt);
        await security.save();

        res.json({ success: true, message: "Password changed successfully." });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Failed to change password" });
    }
};
