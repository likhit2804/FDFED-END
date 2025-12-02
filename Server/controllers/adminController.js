
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
