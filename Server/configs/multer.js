/**
 * Shared Multer Configuration — Urban Ease
 *
 * Single source of truth for file upload middleware.
 * Import `memoryUpload` for Cloudinary-bound routes (most routes).
 * Import `diskUpload` only for legacy routes that write files to disk.
 */

import multer from "multer";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─────────────────────────────────────────────────────────────
// File filter  (images only)
// ─────────────────────────────────────────────────────────────

export const imageFileFilter = (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/i;
    if (allowed.test(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed (jpeg, jpg, png, gif, webp)"), false);
    }
};

// ─────────────────────────────────────────────────────────────
// Memory storage — for Cloudinary uploads (buffer → stream)
// ─────────────────────────────────────────────────────────────

/**
 * Use this for any route where the file is immediately forwarded to Cloudinary.
 * Files are kept in memory as `req.file.buffer` / `req.files[n].buffer`.
 *
 * Usage in a router:
 *   import { memoryUpload } from "../../../configs/multer.js";
 *   router.post("/upload", memoryUpload.single("photo"), controller);
 */
export const memoryUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB hard cap
    fileFilter: imageFileFilter,
});

// ─────────────────────────────────────────────────────────────
// Disk storage — for legacy routes that need a local temp file
// ─────────────────────────────────────────────────────────────

/**
 * Use this only where the file truly needs to end up on disk
 * (e.g. ads that are served locally, docs that need post-processing).
 *
 * Usage in a router:
 *   import { diskUpload } from "../../../configs/multer.js";
 *   router.post("/upload", diskUpload.single("doc"), controller);
 */
const diskStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadsDir = path.resolve(__dirname, "..", "uploads");
        fs.mkdirSync(uploadsDir, { recursive: true });
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const originalExtension = path.extname(file.originalname || "").toLowerCase();
        const safeExtension = originalExtension || ".png";
        cb(null, `${randomUUID()}${safeExtension}`);
    },
});

export const diskUpload = multer({
    storage: diskStorage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB image limit for advertisement uploads
    fileFilter: imageFileFilter,
});
