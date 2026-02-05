import Community from "../../models/communities.js";
import CommunityManager from "../../models/cManager.js";
import { sendError, sendSuccess } from "./helpers.js";

export const updateBookingRules = async (req, res) => {
    try {
        if (req.body.rules === undefined) {
            return sendError(res, 400, "Booking rules are required");
        }

        const community = await Community.findById(req.user.community);
        if (!community) {
            return sendError(res, 404, "Community not found");
        }

        const sanitizedRules = req.body.rules ? req.body.rules.trim() : "";
        community.bookingRules = sanitizedRules;
        community.updatedAt = new Date();

        await community.save();

        return sendSuccess(res, "Booking rules updated successfully", { rules: sanitizedRules });
    } catch (error) {
        console.error("Error updating booking rules:", error);
        return sendError(res, 500, "Internal server error", error);
    }
};

export const getSpaces = async (req, res) => {
    try {
        const community = await Community.findById(req.user.community);
        if (!community) {
            return sendError(res, 404, "Community not found");
        }

        return sendSuccess(res, "Spaces fetched successfully", {
            spaces: community.commonSpaces,
            totalSpaces: community.commonSpaces.length,
        });
    } catch (error) {
        console.error("Error fetching spaces:", error);
        return sendError(res, 500, "Internal server error", error);
    }
};

export const rotateCommunityCode = async (req, res) => {
    try {
        const managerId = req.user.id;
        const manager = await CommunityManager.findById(managerId);

        if (!manager || !manager.assignedCommunity) {
            return sendError(res, 404, "Community manager not found");
        }

        const community = await Community.findById(manager.assignedCommunity);
        if (!community) {
            return sendError(res, 404, "Community not found");
        }

        const newCode = await community.forceRotateCode();

        return sendSuccess(res, "Community code rotated successfully", {
            communityCode: newCode,
            rotatedAt: community.communityCodeLastRotatedAt,
        });
    } catch (err) {
        console.error("Rotate community code error:", err);
        return sendError(res, 500, "Failed to rotate community code", err);
    }
};

export const setupCommunityStructure = async (req, res) => {
    try {
        const { blocks } = req.body;

        if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
            return sendError(res, 400, "Invalid blocks configuration");
        }

        const managerId = req.user.id;
        const manager = await CommunityManager.findById(managerId);

        if (!manager || !manager.assignedCommunity) {
            return sendError(res, 404, "Community not found");
        }

        const community = await Community.findById(manager.assignedCommunity);
        if (!community) {
            return sendError(res, 404, "Community not found");
        }

        if (community.hasStructure) {
            return sendError(res, 400, "Community structure is already set up.");
        }

        const generatedBlocks = blocks.map(block => {
            const { name, totalFloors, flatsPerFloor } = block;
            const flats = [];

            for (let floor = 1; floor <= totalFloors; floor++) {
                for (let flat = 1; flat <= flatsPerFloor; flat++) {
                    let flatNumberSuffix = (floor * 100) + flat;
                    const flatNumber = `${name}-${flatNumberSuffix}`;

                    flats.push({
                        flatNumber,
                        floor,
                        status: "Vacant"
                    });
                }
            }

            return {
                name,
                totalFloors,
                flatsPerFloor,
                flats
            };
        });

        community.blocks = generatedBlocks;
        community.hasStructure = true;
        await community.save();

        return sendSuccess(res, "Community structure setup successfully!", {
            totalBlocks: generatedBlocks.length,
            redirect: "/manager/dashboard"
        });

    } catch (err) {
        console.error("Setup structure error:", err);
        return sendError(res, 500, "Server error during setup", err);
    }
};
