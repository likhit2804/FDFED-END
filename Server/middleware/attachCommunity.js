import Community from '../models/communities.js';

/**
 * Middleware to fetch and attach the user's community to the request object.
 * Must be used AFTER auth middleware which sets req.user.
 */
export const attachCommunity = async (req, res, next) => {
    try {
        if (!req.user || !req.user.community) {
            // User might not be tied to a community (e.g. Admin) or missing community
            req.community = null;
            return next();
        }

        const community = await Community.findById(req.user.community);
        if (!community) {
            const accept = req.get("Accept") || "";
            const wantsJSON = req.xhr || accept.includes("application/json") || req.path.startsWith("/api/");

            if (wantsJSON) {
                return res.status(404).json({ success: false, message: "Community not found for this user." });
            }
            return res.status(404).render("error", { message: "Community not found for this user." });
        }

        req.community = community;
        next();
    } catch (error) {
        console.error("attachCommunity middleware error:", error);
        return res.status(500).json({ success: false, message: "Failed to fetch community details." });
    }
};
