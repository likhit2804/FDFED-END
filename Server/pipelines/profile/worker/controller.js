import Ad from "../../../core/models/Ad.js";
import Worker from "../../../core/models/workers.js";
import bcrypt from "bcrypt";
import cloudinary from "../../../core/configs/cloudinary.js";

export const getProfile = async (req, res) => {
  try {
    const ads = await Ad.find({
      community: req.user.community,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });
    const worker = await Worker.findById(req.user.id);
    return res.json({ success: true, worker, ads });
  } catch (err) {
    console.error("Worker get profile error:", err);
    return res.json({ success: false, message: "Server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email, contact, address } = req.body;
    const worker = await Worker.findById(req.user.id);

    if (!worker) {
      return res
        .status(404)
        .json({ success: false, message: "Worker not found." });
    }

    let image = worker.image;

    if (req.file?.buffer) {
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
            (error, uploadedResult) => {
              if (error) return reject(error);
              return resolve(uploadedResult);
            }
          );

          uploadStream.end(req.file.buffer);
        });

        image = result.secure_url;
        worker.imagePublicId = result.public_id;
      } catch (err) {
        console.error("Worker profile image upload error:", err);
        return res.status(500).json({
          success: false,
          message: "Failed to upload profile image.",
        });
      }
    }

    worker.name = name;
    worker.email = email;
    worker.contact = contact;
    worker.address = address;

    if (image) {
      worker.image = image;
    }

    await worker.save();
    return res.json({
      success: true,
      message: "Profile updated successfully",
      worker,
    });
  } catch (err) {
    console.error("Worker update profile error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { cp, np } = req.body;
    const worker = await Worker.findById(req.user.id);

    if (!worker) {
      return res.json({ success: false, message: "Worker not found." });
    }

    const isMatch = await bcrypt.compare(cp, worker.password);
    if (!isMatch) {
      return res.json({
        success: false,
        message: "Current password does not match.",
      });
    }

    const salt = await bcrypt.genSalt(10);
    worker.password = await bcrypt.hash(np, salt);
    await worker.save();

    return res.json({ success: true, message: "Password changed successfully." });
  } catch (err) {
    console.error("Worker change password error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
