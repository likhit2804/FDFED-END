import Community from "../models/communities.js";
import CommunityManager from "../models/cManager.js";
import Resident from "../models/resident.js";
import Application from "../models/interestForm.js";

export const getDashboardData = async (req, res) => {
  try {
    const totalCommunities = await Community.countDocuments();
    const totalResidents = await Resident.countDocuments();
    const pendingApplications = await Application.countDocuments({ status: "pending" });

    // Monthly revenue (this month)
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthlyRevenueAgg = await Community.aggregate([
      { $unwind: "$subscriptionHistory" },
      {
        $match: {
          "subscriptionHistory.status": "completed",
          "subscriptionHistory.paymentDate": { $gte: startOfMonth },
        },
      },
      { $group: { _id: null, total: { $sum: "$subscriptionHistory.amount" } } },
    ]);
    const monthlyRevenue = monthlyRevenueAgg[0]?.total || 0;

    // Application status breakdown
    const appStatus = await Application.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const appStatusMap = appStatus.reduce((acc, cur) => {
      acc[cur._id] = cur.count;
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        kpis: { totalCommunities, totalResidents, pendingApplications, monthlyRevenue },
        chartData: {
          applicationsStatus: {
            approved: appStatusMap.approved || 0,
            pending: appStatusMap.pending || 0,
            rejected: appStatusMap.rejected || 0,
          },
        },
      },
    });
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getKpis = async (req, res) => {
  try {
    const totalCommunities = await Community.countDocuments();
    const totalResidents = await Resident.countDocuments();
    const pendingApplications = await Application.countDocuments({ status: "pending" });
    const activeManagers = await CommunityManager.countDocuments({ status: "active" });

    res.json({
      success: true,
      data: { totalCommunities, totalResidents, pendingApplications, activeManagers },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getCharts = async (req, res) => {
  try {
    const { period = "6M" } = req.query;
    const communities = await Community.find().lean();

    let allPayments = [];
    for (const c of communities) {
      if (Array.isArray(c.subscriptionHistory)) {
        allPayments.push(...c.subscriptionHistory);
      }
    }

    const now = new Date();
    let labels = [],
      revenueTrend = [];

    const generateMonthLabel = (date) => date.toLocaleDateString("en-US", { month: "short" });

    const periods = { "6M": 6, "1Y": 12 };

    if (period === "All") {
      for (let i = 4; i >= 0; i--) {
        const year = now.getFullYear() - i;
        const payments = allPayments.filter(
          (p) => new Date(p.paymentDate).getFullYear() === year && p.status === "completed"
        );
        labels.push(year.toString());
        revenueTrend.push(payments.reduce((sum, p) => sum + (p.amount || 0), 0));
      }
    } else {
      const months = periods[period] || 6;
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = generateMonthLabel(date);
        const payments = allPayments.filter(
          (p) =>
            new Date(p.paymentDate).getFullYear() === date.getFullYear() &&
            new Date(p.paymentDate).getMonth() === date.getMonth() &&
            p.status === "completed"
        );
        labels.push(label);
        revenueTrend.push(payments.reduce((sum, p) => sum + (p.amount || 0), 0));
      }
    }

    res.json({
      success: true,
      data: { growthChart: { labels, revenue: revenueTrend } },
    });
  } catch (error) {
    console.error("Chart fetch error:", error);
    res.status(500).json({ success: false, message: "Chart fetch failed" });
  }
};
// controllers/admin/communityController.js
import Community from "../models/communities.js";
import CommunityManager from "../models/cManager.js";

// Get all communities
export const getAllCommunities = async (req, res) => {
  try {
    const communities = await Community.find()
      .populate("communityManager", "name email")
      .sort({ createdAt: -1 });
    res.json({ success: true, communities });
  } catch (error) {
    console.error("Error fetching communities:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// Get single community
export const getCommunityById = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate("communityManager", "name email");
    if (!community)
      return res.status(404).json({ success: false, error: "Community not found" });
    res.json({ success: true, community });
  } catch (error) {
    console.error("Error fetching community:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// Create community
export const createCommunity = async (req, res) => {
  try {
    const { name, location, description, communityManager, subscriptionStatus } = req.body;
    if (!name || !location)
      return res.status(400).json({ success: false, error: "Name and location are required" });

    const newCommunity = new Community({
      name,
      location,
      description,
      communityManager: communityManager || null,
      subscriptionStatus: subscriptionStatus || "pending",
      totalMembers: 0,
    });

    await newCommunity.save();
    await newCommunity.populate("communityManager", "name email");

    res.status(201).json({
      success: true,
      message: "Community created successfully",
      community: newCommunity,
    });
  } catch (error) {
    console.error("Error creating community:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// Update community
export const updateCommunity = async (req, res) => {
  try {
    const { name, location, description, communityManager, subscriptionStatus } = req.body;
    const community = await Community.findById(req.params.id);

    if (!community)
      return res.status(404).json({ success: false, error: "Community not found" });

    if (name) community.name = name;
    if (location) community.location = location;
    if (description !== undefined) community.description = description;
    if (communityManager !== undefined)
      community.communityManager = communityManager || null;
    if (subscriptionStatus) community.subscriptionStatus = subscriptionStatus;

    await community.save();
    await community.populate("communityManager", "name email");

    res.json({ success: true, message: "Community updated successfully", community });
  } catch (error) {
    console.error("Error updating community:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// Delete community
export const deleteCommunity = async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);
    if (!community)
      return res.status(404).json({ success: false, error: "Community not found" });

    if (community.totalMembers > 0)
      return res.status(400).json({
        success: false,
        error: "Cannot delete community with existing members",
      });

    await Community.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Community deleted successfully" });
  } catch (error) {
    console.error("Error deleting community:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// Get managers
export const getManagersList = async (req, res) => {
  try {
    const managers = await CommunityManager.find().select("name email").sort({ name: 1 });
    res.json({ success: true, managers });
  } catch (error) {
    console.error("Error fetching managers:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// Stats overview
export const getCommunityStats = async (req, res) => {
  try {
    const totalCommunities = await Community.countDocuments();
    const activeCommunities = await Community.countDocuments({
      subscriptionStatus: { $regex: /^active$/i },
    });
    const pendingCommunities = await Community.countDocuments({
      subscriptionStatus: { $regex: /^pending$/i },
    });

    const topLocations = await Community.aggregate([
      { $group: { _id: "$location", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    const recentCommunities = await Community.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("communityManager", "name email");

    res.json({
      success: true,
      stats: {
        totalCommunities,
        activeCommunities,
        pendingCommunities,
        topLocations,
        recentCommunities,
      },
    });
  } catch (error) {
    console.error("Error fetching community stats:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

// Bulk update
export const bulkUpdateStatus = async (req, res) => {
  try {
    const { communityIds, status } = req.body;
    if (!communityIds?.length)
      return res.status(400).json({ success: false, error: "Community IDs required" });

    if (!["active", "pending"].includes(status?.toLowerCase()))
      return res.status(400).json({ success: false, error: "Invalid status value" });

    const result = await Community.updateMany(
      { _id: { $in: communityIds } },
      { $set: { subscriptionStatus: status } }
    );

    res.json({
      success: true,
      message: `Updated ${result.modifiedCount} communities`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error bulk updating:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};
