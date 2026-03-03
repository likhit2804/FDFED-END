import express from "express";
import multer from "multer";
import cloudinary from "../../../configs/cloudinary.js";
import Community from "../../../models/communities.js";
import CommunityManager from "../../../models/cManager.js";
import {
    rotateCommunityCode,
    getCommunityStructure,
    setupCommunityStructure,
    getRegistrationCodes,
    regenerateRegistrationCodes,
} from "../controllers/manager.js";

const communityManagerRouter = express.Router();

// Cloudinary upload helper for community images
const uploadCommunityImageToCloudinary = (buffer) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: "communities",
                resource_type: "image",
                transformation: [
                    { width: 1600, crop: "limit" },
                    { quality: "auto:good" },
                ],
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        uploadStream.end(buffer);
    });
};

const upload2 = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 10 },
});

communityManagerRouter.get("/new-community", (req, res) => {
    res.render("communityManager/new-community");
});

// Create new community with photo upload
communityManagerRouter.post("/communities", upload2.array("photos", 10), async (req, res) => {
    try {
        const managerId = req.session?.managerId || req.user?.id;
        const manager = await CommunityManager.findById(managerId);

        if (!manager) {
            return res.status(404).json({ success: false, message: "Community manager not found." });
        }

        const photoUrls = [];
        if (req.files && Array.isArray(req.files)) {
            for (const file of req.files) {
                try {
                    const result = await uploadCommunityImageToCloudinary(file.buffer);
                    photoUrls.push({ url: result.secure_url, publicId: result.public_id });
                } catch (err) {
                    console.error("Error uploading community image:", err);
                    return res.status(500).json({ success: false, message: "Failed to upload community images." });
                }
            }
        }

        const communityData = {
            ...req.body,
            communityManager: manager._id,
            profile: { ...(req.body.profile || {}), photos: photoUrls },
        };

        const community = await Community.create(communityData);
        res.status(201).json({ success: true, message: "Community created successfully!", data: community });
    } catch (error) {
        console.error("Error updating community:", error);
        res.status(500).json({ success: false, message: "An error occurred while creating the community." });
    }
});

// Get community details
communityManagerRouter.get("/communities/:id", async (req, res) => {
    try {
        const community = await Community.findById(req.params.id)
            .populate("communityManager", "name email")
            .lean();

        if (!community) {
            return res.status(404).json({ success: false, message: "Community not found." });
        }

        res.json({ success: true, data: community });
    } catch (error) {
        console.error("Error fetching community:", error);
        res.status(500).json({ success: false, message: "An error occurred while fetching community details." });
    }
});

// Get all communities for the logged-in manager
communityManagerRouter.get("/communities", async (req, res) => {
    try {
        const managerId = req.session?.managerId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const query = managerId ? { communityManager: managerId } : {};

        const communities = await Community.find(query)
            .select("name location email status totalMembers subscriptionPlan subscriptionStatus planEndDate profile.photos")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Community.countDocuments(query);

        res.json({
            success: true,
            data: {
                communities,
                pagination: { page, limit, total, pages: Math.ceil(total / limit) },
            },
        });
    } catch (error) {
        console.error("Error fetching communities:", error);
        res.status(500).json({ success: false, message: "An error occurred while fetching communities." });
    }
});

// Payment stats endpoint
communityManagerRouter.get("/payment-stats", async (req, res) => {
    try {
        const managerId = req.session?.managerId;
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const matchCondition = {
            "subscriptionHistory.paymentDate": { $gte: firstDayOfMonth },
        };

        if (managerId) {
            matchCondition.communityManager = managerId;
        }

        const stats = await Community.aggregate([
            { $match: matchCondition },
            { $unwind: "$subscriptionHistory" },
            {
                $match: {
                    "subscriptionHistory.paymentDate": { $gte: firstDayOfMonth },
                    "subscriptionHistory.status": "completed",
                },
            },
            {
                $group: {
                    _id: null,
                    totalAmount: { $sum: "$subscriptionHistory.amount" },
                    pendingAmount: {
                        $sum: {
                            $cond: [
                                { $eq: ["$subscriptionHistory.status", "pending"] },
                                "$subscriptionHistory.amount",
                                0,
                            ],
                        },
                    },
                    totalTransactions: { $sum: 1 },
                },
            },
        ]);

        res.json({
            success: true,
            data: stats[0] || { totalAmount: 0, pendingAmount: 0, totalTransactions: 0 },
        });
    } catch (error) {
        console.error("Error fetching payment stats:", error);
        res.status(500).json({ success: false, message: "An error occurred while fetching payment statistics." });
    }
});

// Community structure & codes
communityManagerRouter.post("/community/rotate-code", rotateCommunityCode);
communityManagerRouter.get("/get-structure", getCommunityStructure);
communityManagerRouter.post("/setup-structure", setupCommunityStructure);
communityManagerRouter.get("/registration-codes", getRegistrationCodes);
communityManagerRouter.post("/registration-codes/regenerate", regenerateRegistrationCodes);

export default communityManagerRouter;
