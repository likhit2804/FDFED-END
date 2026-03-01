import Issue from "../../../core/models/issues.js";
import Ad from "../../../core/models/Ad.js";
import Worker from "../../../core/models/workers.js";

export const getWorkerDashboardData = async (req, res) => {
  try {
    const worker = await Worker.findById(req.user.id);
    const issues = await Issue.find({ workerAssigned: req.user.id });
    const ads = await Ad.find({
      community: req.user.community,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    return res.json({ success: true, worker, issues, ads });
  } catch (err) {
    console.error("Worker dashboard error:", err);
    return res.json({ success: false, message: "Server error" });
  }
};

export const getDashboardData = getWorkerDashboardData;
