import Security from "../../../models/security.js";
import visitor from "../../../models/visitors.js";
import { parseDateRangeFromQuery } from "../../../utils/dateRange.js";

const getDashboardInfo = async (req, res) => {
    try {
        const dateRange = parseDateRangeFromQuery(req.query);
        if (dateRange.error) {
            return res.status(400).json({ success: false, message: dateRange.error });
        }

        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        const range = dateRange.range || { $gte: startOfDay, $lte: endOfDay };

        const [
            visitors,
            sec,
            PendingRequests,
            VisitorToday,
            ActiveVisitors,
        ] = await Promise.all([
            visitor.find({
                community: req.user.community,
                status: { $in: ["Active", "CheckedOut"] },
                scheduledAt: range,
            }).sort({ createdAt: -1 }),

            Security.findById(req.user.id),

            visitor.countDocuments({
                community: req.user.community,
                status: "Pending",
                scheduledAt: range,
            }),

            visitor.countDocuments({
                community: req.user.community,
                status: "Approved",
                scheduledAt: range,
            }),

            visitor.countDocuments({
                community: req.user.community,
                status: "Approved",
                isCheckedIn: true,
                scheduledAt: range,
            }),
        ]);

        const stats = {
            Pending: PendingRequests,
            Visitor: VisitorToday,
            Active: ActiveVisitors,
        };

        return res.json({
            success: true,
            stats,
            visitors,
            security: sec,
            appliedRange: {
                from: dateRange.from || startOfDay.toISOString(),
                to: dateRange.to || endOfDay.toISOString(),
            },
        });

    } catch (error) {
        console.error("Error fetching dashboard info:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

export { getDashboardInfo };
