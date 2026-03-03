import Community from "../../../models/communities.js";
import CommunityManager from "../../../models/cManager.js";
import crypto from "crypto";
import { sendError, sendSuccess } from "../../shared/helpers.js";

const generateRegCode = () => `UE-${crypto.randomBytes(4).toString('hex')}`;


export const rotateCommunityCode = async (req, res) => {
    try {
        const managerId = req.user.id;
        const community = req.community;

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

export const getCommunityStructure = async (req, res) => {
    try {
        const community = req.community;

        // Transform blocks to frontend format (just the config, not the flats)
        const blocksConfig = (community.blocks || []).map(block => ({
            name: block.name,
            totalFloors: block.totalFloors,
            flatsPerFloor: block.flatsPerFloor
        }));

        return sendSuccess(res, "Community structure fetched successfully", {
            hasStructure: community.hasStructure,
            blocks: blocksConfig,
            totalBlocks: blocksConfig.length
        });
    } catch (err) {
        console.error("Get community structure error:", err);
        return sendError(res, 500, "Failed to fetch community structure", err);
    }
};

export const setupCommunityStructure = async (req, res) => {
    try {
        const { blocks } = req.body;
        console.log('📦 Setup structure called with blocks:', JSON.stringify(blocks, null, 2));

        if (!blocks || !Array.isArray(blocks) || blocks.length === 0) {
            console.log('❌ Invalid blocks configuration');
            return sendError(res, 400, "Invalid blocks configuration");
        }

        const managerId = req.user.id;
        console.log('👤 Manager ID:', managerId);
        const manager = await CommunityManager.findById(managerId);

        if (!manager || !manager.assignedCommunity) {
            console.log('❌ Manager or community not found');
            return sendError(res, 404, "Community not found");
        }

        console.log('🏘️ Community ID:', manager.assignedCommunity);
        const community = await Community.findById(manager.assignedCommunity);
        if (!community) {
            console.log('❌ Community document not found');
            return sendError(res, 404, "Community not found");
        }

        // Check if this is an update BEFORE modifying blocks
        const isUpdate = community.blocks && community.blocks.length > 0;
        console.log('🔄 Is update:', isUpdate, '(existing blocks:', community.blocks?.length || 0, ')');

        // Allow updates - no longer blocking if hasStructure is true
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
                        status: "Vacant",
                        registrationCode: generateRegCode()
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
        console.log('💾 Saving community with', generatedBlocks.length, 'blocks');
        await community.save();
        console.log('✅ Community saved successfully');

        const successMessage = isUpdate
            ? "Community structure updated successfully!"
            : "Community structure setup successfully!";

        console.log('📤 Sending success response:', successMessage);
        return sendSuccess(res, successMessage, {
            totalBlocks: generatedBlocks.length,
            redirect: "/manager/dashboard"
        });

    } catch (err) {
        console.error("Setup structure error:", err);
        return sendError(res, 500, "Server error during setup", err);
    }
};

// ---- Get Registration Codes (manager view / print) ----
export const getRegistrationCodes = async (req, res) => {
    try {
        const community = req.community;

        const rows = [];
        for (const block of community.blocks || []) {
            for (const flat of block.flats || []) {
                rows.push({
                    block: block.name,
                    flatNumber: flat.flatNumber,
                    floor: flat.floor,
                    status: flat.status,
                    registrationCode: flat.registrationCode || null,
                    hasResident: !!flat.residentId
                });
            }
        }

        return sendSuccess(res, "Registration codes fetched", {
            communityName: community.name,
            flats: rows
        });
    } catch (err) {
        console.error("getRegistrationCodes error:", err);
        return sendError(res, 500, "Server error", err);
    }
};

// ---- Regenerate Registration Codes ----
export const regenerateRegistrationCodes = async (req, res) => {
    try {
        const { flatNumber, flatNumbers } = req.body;
        const managerId = req.user.id;
        const community = req.community;

        let regenerated = 0;
        let newCode = null;

        // Use flatNumbers array if provided, or single flatNumber, or fallback to all vacant
        const targetArray = Array.isArray(flatNumbers) ? flatNumbers : (flatNumber ? [flatNumber] : null);

        for (const block of community.blocks) {
            for (const flat of block.flats) {
                if (targetArray) {
                    if (targetArray.includes(flat.flatNumber)) {
                        const code = generateRegCode();
                        flat.registrationCode = code;
                        regenerated++;
                        if (flat.flatNumber === flatNumber) newCode = code;
                    }
                } else if (flat.status === "Vacant") {
                    flat.registrationCode = generateRegCode();
                    regenerated++;
                }
            }
        }

        await community.save();
        return sendSuccess(res, `Regenerated ${regenerated} code(s)`, { regenerated, newCode });
    } catch (err) {
        console.error("regenerateRegistrationCodes error:", err);
        return sendError(res, 500, "Server error", err);
    }
};
