import cloudinary from "../configs/cloudinary.js";
import bcrypt from 'bcrypt';
import NodeCache from 'node-cache';

// CRUD helpers
import {
  listCommunities,
  listCommunityManagers,
  listInterestForms,
  countResidents,
  listCommunitySubscriptions,
  aggregateCommunitySubscriptions,
  aggregateCommunities,
  listAdmins,
  updateAdminById,
  createCommunity as createCommunityCrud,
  updateCommunityById,
  countCommunities,
  updateManyCommunities,
  getCommunityById as getCommunityByIdCrud,
} from "../crud/index.js";

const cache = new NodeCache({ stdTTL: 60 });

export const getDashboard = async (req, res) => {
  try {
    const cachedData = cache.get("admin_dashboard");
    if (cachedData) {
      return res.json({ success: true, data: cachedData, cached: true });
    }

    const [communities, residentsCount, pendingApplicationsList, activeManagersList] =
      await Promise.all([
        listCommunities({}, null, {}),
        countResidents(),
        listInterestForms({ status: "pending" }, null, {}),
        listCommunityManagers({ status: "active" }, null, {}),
      ]);

    const totalCommunities = communities.length;
    const totalResidents = residentsCount;
    const pendingApplications = pendingApplicationsList.length;
    const activeManagers = activeManagersList.length;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyRevenueAgg = await aggregateCommunitySubscriptions([
      {
        $match: {
          status: "completed",
          paymentDate: { $gte: startOfMonth },
        },
      },
      {
        $group: { _id: null, total: { $sum: "$amount" } },
      },
    ]);

    const monthlyRevenue = monthlyRevenueAgg[0]?.total || 0;

    const allPayments = await listCommunitySubscriptions({}, null, { lean: true });

    const labels = Array.from({ length: 12 }, (_, i) =>
      new Date(2000, i, 1).toLocaleString("en", { month: "short" })
    );
    const revenueTrend = Array(12).fill(0);
    const communityTrend = Array(12).fill(0);

    for (const p of allPayments) {
      if (p.status !== "completed" || !p.paymentDate) continue;
      const month = new Date(p.paymentDate).getMonth();
      revenueTrend[month] += p.amount || 0;
      communityTrend[month] += 1;
    }

    const allApplications = await listInterestForms({}, "status", {});
    const appStatus = allApplications.reduce((acc, app) => {
      const key = app.status || "unknown";
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const responseData = {
      kpis: {
        totalCommunities,
        totalResidents,
        pendingApplications,
        activeManagers,
        monthlyRevenue,
      },
      chartData: {
        applicationsStatus: {
          approved: appStatus.approved || 0,
          pending: appStatus.pending || 0,
          rejected: appStatus.rejected || 0,
        },
        growthChart: {
          labels,
          revenue: revenueTrend,
          communities: communityTrend,
        },
      },
    };

    cache.set("admin_dashboard", responseData);
    res.json({ success: true, data: responseData, cached: false });
  } catch (error) {
    console.error("Optimized Dashboard Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const getCommunitiesOverview = async (req, res) => {
  try {
    const communities = await listCommunities({}, null, {
      sort: { createdAt: -1 },
      populate: [{ path: "communityManager", select: "name email" }],
    });

    const totalCommunities = communities.length;
    const activeCommunities = communities.filter(c =>
      /^active$/i.test(c.subscriptionStatus)
    ).length;
    const pendingCommunities = communities.filter(c =>
      /^pending$/i.test(c.subscriptionStatus)
    ).length;

    const topLocationsAgg = await aggregateCommunities([
      { $group: { _id: "$location", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const recentCommunities = communities.slice(0, 5);

    const managers = await listCommunityManagers({}, "name email", {
      sort: { name: 1 },
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalCommunities,
          activeCommunities,
          pendingCommunities,
          topLocations: topLocationsAgg,
        },
        recentCommunities,
        allCommunities: communities,
        managers
      }
    });
  } catch (error) {
    console.error("Error fetching communities overview:", error);
    res.status(500).json({ success: false, error: "Server Error" });
  }
};

export const getCommunityManagers = async (req, res) => {
  try {
    const managers = await listCommunityManagers({}, null, {
      sort: { name: 1 },
      populate: [{ path: "assignedCommunity", select: "name location subscriptionStatus" }],
    });

    const communities = await listCommunities(
      { status: "Active" },
      "name location subscriptionStatus",
      { sort: { name: 1 } }
    );

    const totalManagers = managers.length;
    const assignedManagers = managers.filter(
      (m) => m.assignedCommunity !== null
    ).length;
    const unassignedManagers = totalManagers - assignedManagers;

    res.json({
      success: true,
      data: {
        stats: { totalManagers, assignedManagers, unassignedManagers },
        managers,
        communities,
      },
    });
  } catch (error) {
    console.error("Error fetching community managers:", error);
    res.status(500).json({ success: false, message: "Server error while fetching community managers", error: error.message });
  }
};

export const getPayments = async (req, res) => {
  try {
    const payments = await listCommunitySubscriptions({}, null, {
      populate: [{ path: "communityId", select: "name subscriptionPlan" }],
      sort: { paymentDate: -1 },
      lean: true
    });

    const communities = await listCommunities({}, null, {
      populate: [{ path: "communityManager", select: "name email" }],
      lean: true
    });

    const communityMap = Object.fromEntries(
      communities.map(c => [c._id.toString(), c])
    );

    let totalRevenue = 0, totalTransactions = 0, pendingPayments = 0, failedPayments = 0;
    const allPayments = [];

    for (const p of payments) {
      const amount = p.amount || 0;
      const status = (p.status || "").toLowerCase();

      // Safely resolve community (some legacy payments might not have communityId populated)
      let community = null;
      if (p.communityId) {
        const key = (p.communityId._id || p.communityId).toString();
        community = communityMap[key] || null;
      }

      if (status === "completed") {
        totalRevenue += amount;
        totalTransactions++;
      } else if (status === "pending") {
        pendingPayments++;
      } else if (status === "failed") {
        failedPayments++;
      }

      allPayments.push({
        transactionId: p.transactionId || "N/A",
        communityName: p.communityId?.name || "Unknown",
        communityId: p.communityId?._id || "N/A",
        plan: p.planType || "Unknown",
        amount: amount,
        paymentMethod: p.paymentMethod || "N/A",
        paymentDate: p.paymentDate ? new Date(p.paymentDate).toLocaleDateString("en-IN") : "N/A",
        status: p.status ? p.status.charAt(0).toUpperCase() + p.status.slice(1) : "Unknown",
        managerName: community?.communityManager?.name || "Unassigned",
        planDuration: p.duration || "monthly",
      });
    }

    const now = new Date();
    const monthlyRevenue = [];

    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const monthRevenue = allPayments.reduce((sum, p) => {
        if (
          p.status === "Completed" &&
          new Date(p.paymentDate) >= start &&
          new Date(p.paymentDate) <= end
        ) {
          return sum + p.amount;
        }
        return sum;
      }, 0);

      monthlyRevenue.push({
        month: start.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
        revenue: monthRevenue,
      });
    }

    const planDistribution = {
      basic: communities.filter((c) => c.subscriptionPlan === "basic").length,
      standard: communities.filter((c) => c.subscriptionPlan === "standard").length,
      premium: communities.filter((c) => c.subscriptionPlan === "premium").length,
    };

    res.json({
      success: true,
      data: {
        payments: allPayments,
        statistics: { totalRevenue, totalTransactions, pendingPayments, failedPayments },
        monthlyRevenue,
        planDistribution,
      },
    });
  } catch (error) {
    console.error("Error fetching payment data:", error);
    res.status(500).json({ success: false, message: "Internal Server Error", error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const admin = (await listAdmins({}, "-password"))[0];
    if (!admin) return res.status(404).json({ message: "Admin not found" });

    res.json({
      success: true,
      admin: {
        name: admin.name,
        email: admin.email,
        image: admin.image || "/default-profile.png",
      },
    });
  } catch (err) {
    console.error("Profile fetch error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email)
      return res.status(400).json({ success: false, message: "Name and email are required" });

    const admin = (await listAdmins({}, null))[0];
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });

    if (email !== admin.email) {
      const exists = (await listAdmins({ email, _id: { $ne: admin._id } }, null)).length > 0;
      if (exists) return res.status(400).json({ success: false, message: "Email already exists" });
    }

    const updates = { name, email };

    if (req.file && req.file.buffer) {
      try {
        const result = await new Promise((resolve, reject) => {
          const uploadStream = cloudinary.uploader.upload_stream(
            {
              folder: "profiles/admin",
              resource_type: "image",
              transformation: [
                { width: 512, height: 512, crop: "limit" },
                { quality: "auto:good" },
              ],
            },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            }
          );

          uploadStream.end(req.file.buffer);
        });

        updates.image = result.secure_url;
        updates.imagePublicId = result.public_id;
      } catch (uploadError) {
        console.error("Admin profile image upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload profile image.",
        });
      }
    }

    const updatedAdmin = await updateAdminById(admin._id, updates);

    res.json({
      success: true,
      message: "Profile updated successfully",
      admin: { name: updatedAdmin.name, email: updatedAdmin.email, image: updatedAdmin.image },
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: "All fields are required" });

    const admin = (await listAdmins({}, null))[0];
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch)
      return res.status(400).json({ success: false, message: "Current password is incorrect" });

    const same = await bcrypt.compare(newPassword, admin.password);
    if (same)
      return res.status(400).json({ success: false, message: "New password must differ" });

    const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d!@#$%^&*]).{8,}$/;
    if (!strong.test(newPassword))
      return res.status(400).json({ success: false, message: "Password must include upper, lower, number/special char (min 8 chars)" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await updateAdminById(admin._id, { password: hashedPassword });

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("Password change error:", err);
    res.status(500).json({ success: false, message: "Failed to change password" });
  }
};

export const getAllCommunities = async (req, res) => {
  try {
    const communities = await listCommunities({}, null, {});
    res.json({ success: true, communities });
  } catch (err) {
    console.error("Get all communities error:", err);
    res.status(500).json({ success: false, message: "Failed to get communities" });
  }
};

export const getCommunityById = async (req, res) => {
  try {
    const { id } = req.params;
    const community = await getCommunityByIdCrud(id, null, {});
    if (!community) {
      return res.status(404).json({ success: false, message: "Community not found" });
    }
    res.json({ success: true, community });
  } catch (err) {
    console.error("Get community by id error:", err);
    res.status(500).json({ success: false, message: "Failed to get community" });
  }
};

export const createCommunity = async (req, res) => {
  try {
    const communityData = req.body;
    const newCommunity = await createCommunityCrud(communityData);
    res.json({ success: true, message: "Community created successfully", community: newCommunity });
  } catch (err) {
    console.error("Create community error:", err);
    res.status(500).json({ success: false, message: "Failed to create community" });
  }
};

export const updateCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updatedCommunity = await updateCommunityById(id, updates);
    if (!updatedCommunity) {
      return res.status(404).json({ success: false, message: "Community not found" });
    }
    res.json({ success: true, message: "Community updated successfully", community: updatedCommunity });
  } catch (err) {
    console.error("Update community error:", err);
    res.status(500).json({ success: false, message: "Failed to update community" });
  }
};

export const deleteCommunity = async (req, res) => {
  try {
    const { id } = req.params;
    const community = await updateCommunityById(id, { status: "deleted" }); // Soft delete
    if (!community) {
      return res.status(404).json({ success: false, message: "Community not found" });
    }
    res.json({ success: true, message: "Community deleted successfully" });
  } catch (err) {
    console.error("Delete community error:", err);
    res.status(500).json({ success: false, message: "Failed to delete community" });
  }
};

export const getManagersList = async (req, res) => {
  try {
    const managers = await listCommunityManagers({}, null, {});
    res.json({ success: true, managers });
  } catch (err) {
    console.error("Get managers list error:", err);
    res.status(500).json({ success: false, message: "Failed to get managers list" });
  }
};

export const getCommunityStats = async (req, res) => {
  try {
    const totalCommunities = await countCommunities();
    const activeCommunities = await countCommunities({ status: "active" });
    const totalResidents = await countResidents();
    res.json({
      success: true,
      stats: {
        totalCommunities,
        activeCommunities,
        totalResidents,
      },
    });
  } catch (err) {
    console.error("Get community stats error:", err);
    res.status(500).json({ success: false, message: "Failed to get community stats" });
  }
};

export const bulkUpdateStatus = async (req, res) => {
  try {
    const { ids, status } = req.body;
    if (!ids || !Array.isArray(ids) || !status) {
      return res.status(400).json({ success: false, message: "IDs array and status are required" });
    }
    const result = await updateManyCommunities({ _id: { $in: ids } }, { status });
    res.json({ success: true, message: `${result.modifiedCount} communities updated successfully` });
  } catch (err) {
    console.error("Bulk update status error:", err);
    res.status(500).json({ success: false, message: "Failed to bulk update status" });
  }
};
