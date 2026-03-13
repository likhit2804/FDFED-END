import Ad from "../../../models/Ad.js";

/**
 * Shared helper: returns active ads for the requesting user's community.
 */
export const getActiveAds = async (req, res) => {
    try {
        const ads = await Ad.find({
            community: req.user.community,
            startDate: { $lte: new Date() },
            endDate: { $gte: new Date() },
        });
        return res.json({ success: true, ads });
    } catch (err) {
        console.error("Ads fetch error:", err);
        return res.status(500).json({ success: false, message: "Failed to fetch ads" });
    }
};
