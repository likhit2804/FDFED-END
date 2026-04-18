import Worker from "../../../models/workers.js";
import Issue from "../../../models/issues.js";

// GET /worker/getDashboardData
export const getDashboardData = async (req, res) => {
    try {
        const t = await Worker.findById(req.user.id);
        const Issues = await Issue.find({ workerAssigned: req.user.id });
        return res.json({ success: true, worker: t, issues: Issues });
    } catch (err) {
        console.error(err);
        return res.json({ success: false, message: "Server error" });
    }
};

// GET /worker/history
export const getHistory = async (req, res) => {
    try {
        const issues = await Issue.find({
            workerAssigned: req.user.id,
            status: { $nin: ["Assigned", "Pending"] },
        })
            .populate("workerAssigned")
            .populate("resident");
        return res.json({ success: true, issues });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Server error while fetching history" });
    }
};
