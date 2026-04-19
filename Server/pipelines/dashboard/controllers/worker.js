import Worker from "../../../models/workers.js";
import Issue from "../../../models/issues.js";
import { parseDateRangeFromQuery, withDateRangeMatch } from "../../../utils/dateRange.js";

// GET /worker/getDashboardData
export const getDashboardData = async (req, res) => {
    try {
        const dateRange = parseDateRangeFromQuery(req.query);
        if (dateRange.error) {
            return res.status(400).json({ success: false, message: dateRange.error });
        }

        const t = await Worker.findById(req.user.id);
        const issueQuery = withDateRangeMatch({ workerAssigned: req.user.id }, "createdAt", dateRange.range);
        const Issues = await Issue.find(issueQuery).sort({ createdAt: -1 });
        return res.json({
            success: true,
            worker: t,
            issues: Issues,
            appliedRange: { from: dateRange.from, to: dateRange.to },
        });
    } catch (err) {
        console.error(err);
        return res.json({ success: false, message: "Server error" });
    }
};

// GET /worker/history
export const getHistory = async (req, res) => {
    try {
        const dateRange = parseDateRangeFromQuery(req.query);
        if (dateRange.error) {
            return res.status(400).json({ success: false, message: dateRange.error });
        }

        const issueQuery = withDateRangeMatch({
            workerAssigned: req.user.id,
            status: { $nin: ["Assigned", "Pending"] },
        }, "createdAt", dateRange.range);

        const issues = await Issue.find(issueQuery)
            .populate("workerAssigned")
            .populate("resident");
        return res.json({
            success: true,
            issues,
            appliedRange: { from: dateRange.from, to: dateRange.to },
        });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server error while fetching history" });
    }
};
