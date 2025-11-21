import express from "express";
import Community from "../models/communities.js";
import CommunitySubscription from "../models/communitySubscription.js";
import CommunityManager from "../models/cManager.js";
import Resident from "../models/resident.js";
import Security from "../models/security.js";
import Worker from "../models/workers.js";
import Application from "../models/interestForm.js";
import Admin from "../models/admin.js";

const AdminRouter = express.Router();
import bcrypt from 'bcrypt';

const saltRounds = 10;

import {
  getAllApplications,
  getAllApplicationsJSON,
  approveApplication,
  rejectApplication
} from '../controllers/interestForm.js';

AdminRouter.get('/api/interests', getAllApplications);

AdminRouter.get('/interests', getAllApplications);

AdminRouter.post('/interests/:id/approve', approveApplication);
AdminRouter.post('/interests/:id/reject', rejectApplication);

import NodeCache from 'node-cache';
const cache = new NodeCache({ stdTTL: 60 });

AdminRouter.get("/api/dashboard", async (req, res) => {
  try {
    const cachedData = cache.get("admin_dashboard");
    if (cachedData) {
      return res.json({ success: true, data: cachedData, cached: true });
    }

    const [totalCommunities, totalResidents, pendingApplications, activeManagers] =
      await Promise.all([
        Community.countDocuments(),
        Resident.countDocuments(),
        Application.countDocuments({ status: "pending" }),
        CommunityManager.countDocuments({ status: "active" }),
      ]);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch from CommunitySubscription model instead
    const monthlyRevenueAgg = await CommunitySubscription.aggregate([
      {
        $match: {
          "status": "completed",
          "paymentDate": { $gte: startOfMonth },
        },
      },
      {
        $group: { _id: null, total: { $sum: "$amount" } },
      },
    ]);

    const monthlyRevenue = monthlyRevenueAgg[0]?.total || 0;

    // Fetch all subscription payments
    const allPayments = await CommunitySubscription.find().lean();

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

    const appStatusAgg = await Application.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const appStatus = Object.fromEntries(appStatusAgg.map(a => [a._id, a.count]));

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
});

AdminRouter.get("/api/communities/overview", async (req, res) => {
  try {
    // === 1️⃣ Fetch all communities with manager info ===
    const communities = await Community.find()
      .populate("communityManager", "name email")
      .sort({ createdAt: -1 });

    // === 2️⃣ Fetch statistics ===
    const totalCommunities = communities.length;
    const activeCommunities = communities.filter(c =>
      /^active$/i.test(c.subscriptionStatus)
    ).length;
    const pendingCommunities = communities.filter(c =>
      /^pending$/i.test(c.subscriptionStatus)
    ).length;

    // === 3️⃣ Top locations ===
    const topLocationsAgg = await Community.aggregate([
      { $group: { _id: "$location", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    // === 4️⃣ Recent communities ===
    const recentCommunities = communities.slice(0, 5);

    // === 5️⃣ Managers for dropdown ===
    const managers = await CommunityManager.find()
      .select("name email")
      .sort({ name: 1 });

    // === 6️⃣ Combine all data ===
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
    res.status(500).json({
      success: false,
      error: "Server Error"
    });
  }
});

AdminRouter.get("/api/community-managers", async (req, res) => {
  try {
    // === 1️⃣ Fetch all community managers with their assigned communities ===
    const managers = await CommunityManager.find()
      .populate("assignedCommunity", "name location subscriptionStatus")
      .sort({ name: 1 });

    // === 2️⃣ Fetch all active communities (for assignment dropdown etc.) ===
    const communities = await Community.find({ status: "Active" })
      .select("name location subscriptionStatus")
      .sort({ name: 1 });

    // === 3️⃣ Build summary statistics ===
    const totalManagers = managers.length;
    const assignedManagers = managers.filter(
      (m) => m.assignedCommunity !== null
    ).length;
    const unassignedManagers = totalManagers - assignedManagers;

    // === 4️⃣ Response JSON structure (clean + React-friendly) ===
    res.json({
      success: true,
      data: {
        stats: {
          totalManagers,
          assignedManagers,
          unassignedManagers,
        },
        managers,
        communities,
      },
    });
  } catch (error) {
    console.error("Error fetching community managers:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching community managers",
      error: error.message,
    });
  }
});

AdminRouter.get("/api/payments", async (req, res) => {
  try {
    // === 1️⃣ Fetch subscription payments with community info ===
    const payments = await CommunitySubscription.find()
      .populate("communityId", "name subscriptionPlan")
      .sort({ paymentDate: -1 })
      .lean();

    // === 2️⃣ Fetch communities with manager info for payment details ===
    const communities = await Community.find()
      .populate("communityManager", "name email")
      .lean();

    const communityMap = Object.fromEntries(
      communities.map(c => [c._id.toString(), c])
    );

    // === 3️⃣ Calculate payment statistics ===
    let totalRevenue = 0,
      totalTransactions = 0,
      pendingPayments = 0,
      failedPayments = 0;

    const allPayments = [];

    for (const p of payments) {
      const amount = p.amount || 0;
      const status = (p.status || "").toLowerCase();
      const community = communityMap[p.communityId.toString()];

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
        paymentDate: p.paymentDate
          ? new Date(p.paymentDate).toLocaleDateString("en-IN")
          : "N/A",
        status: p.status ? p.status.charAt(0).toUpperCase() + p.status.slice(1) : "Unknown",
        managerName: community?.communityManager?.name || "Unassigned",
        planDuration: p.duration || "monthly",
      });
    }

    // === 4️⃣ Monthly revenue trend ===
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

    // === 5️⃣ Subscription Plan Distribution ===
    const planDistribution = {
      basic: communities.filter((c) => c.subscriptionPlan === "basic").length,
      standard: communities.filter((c) => c.subscriptionPlan === "standard").length,
      premium: communities.filter((c) => c.subscriptionPlan === "premium").length,
    };

    // === 6️⃣ Send clean JSON to React ===
    res.json({
      success: true,
      data: {
        payments: allPayments,
        statistics: {
          totalRevenue,
          totalTransactions,
          pendingPayments,
          failedPayments,
        },
        monthlyRevenue,
        planDistribution,
      },
    });
  } catch (error) {
    console.error("Error fetching payment data:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

import multer from 'multer';
import path from 'path';

// Configure multer for image upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/admin/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'admin-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }
});

AdminRouter.get("/api/profile", async (req, res) => {
  try {
    const admin = await Admin.findOne().select("-password");
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
});

AdminRouter.post("/api/profile/update", upload.single("image"), async (req, res) => {
  try {
    const { name, email } = req.body;
    if (!name || !email)
      return res.status(400).json({ success: false, message: "Name and email are required" });

    const admin = await Admin.findOne();
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });

    if (email !== admin.email) {
      const exists = await Admin.findOne({ email, _id: { $ne: admin._id } });
      if (exists) return res.status(400).json({ success: false, message: "Email already exists" });
    }

    admin.name = name;
    admin.email = email;
    if (req.file) admin.image = `/uploads/admin/${req.file.filename}`;
    await admin.save();

    res.json({
      success: true,
      message: "Profile updated successfully",
      admin: {
        name: admin.name,
        email: admin.email,
        image: admin.image,
      },
    });
  } catch (err) {
    console.error("Profile update error:", err);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
});

AdminRouter.post("/api/profile/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      return res.status(400).json({ success: false, message: "All fields are required" });

    const admin = await Admin.findOne();
    if (!admin) return res.status(404).json({ success: false, message: "Admin not found" });

    const isMatch = await bcrypt.compare(currentPassword, admin.password);
    if (!isMatch)
      return res.status(400).json({ success: false, message: "Current password is incorrect" });

    const same = await bcrypt.compare(newPassword, admin.password);
    if (same)
      return res.status(400).json({ success: false, message: "New password must differ" });

    const strong = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d!@#$%^&*]).{8,}$/;
    if (!strong.test(newPassword))
      return res.status(400).json({
        success: false,
        message: "Password must include upper, lower, number/special char (min 8 chars)",
      });

    const salt = await bcrypt.genSalt(10);
    admin.password = await bcrypt.hash(newPassword, salt);
    await admin.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    console.error("Password change error:", err);
    res.status(500).json({ success: false, message: "Failed to change password" });
  }
});

export default AdminRouter;