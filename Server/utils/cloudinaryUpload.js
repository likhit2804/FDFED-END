/**
 * Shared Cloudinary Upload Helper — Urban Ease
 *
 * Wraps cloudinary.uploader.upload_stream in a Promise so every
 * controller can do:
 *
 *   const { url, publicId } = await uploadToCloudinary(req.file.buffer, "profiles");
 *
 * instead of copy-pasting the same callback-based Promise wrapper.
 */

import cloudinary from "../configs/cloudinary.js";

// ─────────────────────────────────────────────────────────────
// Upload
// ─────────────────────────────────────────────────────────────

/**
 * Upload a file buffer to Cloudinary.
 *
 * @param {Buffer} buffer       - File buffer (from multer memoryStorage)
 * @param {string} [folder]     - Cloudinary folder, e.g. "profiles" or "communities"
 * @param {Object} [options]    - Extra Cloudinary upload options (merged with defaults)
 * @returns {Promise<{ url: string, publicId: string }>}
 */
export function uploadToCloudinary(buffer, folder = "general", options = {}) {
    return new Promise((resolve, reject) => {
        const uploadOptions = {
            folder,
            resource_type: "image",
            ...options,
        };

        const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) {
                    console.error("Cloudinary upload error:", error);
                    return reject(error);
                }
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                });
            }
        );

        uploadStream.end(buffer);
    });
}

// ─────────────────────────────────────────────────────────────
// Delete
// ─────────────────────────────────────────────────────────────

/**
 * Delete an asset from Cloudinary by its public_id.
 *
 * @param {string} publicId  - The Cloudinary public_id of the resource
 * @returns {Promise<Object>} Cloudinary deletion result
 */
export async function deleteFromCloudinary(publicId) {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return result;
    } catch (error) {
        console.error("Cloudinary delete error:", error);
        throw error;
    }
}
