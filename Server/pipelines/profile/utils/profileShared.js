import bcrypt from "bcrypt";
import { uploadToCloudinary } from "../../../utils/cloudinaryUpload.js";
import { sendError, sendSuccess } from "../../shared/helpers.js";

/**
 * Shared utility to handle profile image uploads to Cloudinary.
 * @param {Object} file - The req.file object
 * @param {String} folder - The cloudinary folder path (e.g., "profiles/manager")
 * @returns {Object|null} - The upload result { url, publicId } or null if failed/no file
 */
export const handleProfileImageUpload = async (file, folder) => {
    if (!file || !file.buffer) return null;

    try {
        const result = await uploadToCloudinary(file.buffer, folder, {
            transformation: [
                { width: 512, height: 512, crop: "limit" },
                { quality: "auto:good" },
            ],
        });
        return {
            url: result.url,
            publicId: result.publicId
        };
    } catch (err) {
        console.error(`Profile image upload error to ${folder}:`, err);
        throw new Error("Failed to upload profile image");
    }
};

/**
 * Shared utility to handle password changes.
 * @param {Object} res - Express response object
 * @param {Model} Model - The Mongoose model (e.g., Manager, Resident)
 * @param {String} userId - The ID of the user requesting the change
 * @param {String} currentPassword - The unhashed current password for verification
 * @param {String} newPassword - The new password to set
 * @returns {Promise<void>}
 */
export const handlePasswordChange = async (res, Model, userId, currentPassword, newPassword) => {
    try {
        if (!currentPassword || !newPassword) {
            return sendError(res, 400, "Current and new passwords are required");
        }

        const user = await Model.findById(userId);
        if (!user) {
            return sendError(res, 404, "User not found");
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return sendError(res, 400, "Current password does not match");
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        return sendSuccess(res, "Password changed successfully");
    } catch (err) {
        console.error("Shared password change error:", err);
        return sendError(res, 500, "Failed to change password", err);
    }
};
