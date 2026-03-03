import Worker from "../../models/workers.js";
import Issue from "../../models/issues.js";
import Ad from "../../models/Ad.js";

// GET /worker/getDashboardData
export const getDashboardData = async (req, res) => {
    try {
        const t = await Worker.findById(req.user.id);
        const Issues = await Issue.find({ workerAssigned: req.user.id });
        const ads = await Ad.find({ community: req.user.community, startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });
        return res.json({ success: true, worker: t, issues: Issues, ads });
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
