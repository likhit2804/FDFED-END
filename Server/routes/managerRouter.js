import express from "express";
const managerRouter = express.Router();

import path from "path";
import { fileURLToPath } from "url";
import passport from "passport";
import session from "express-session";
import bcrypt from "bcrypt";
import multer from "multer";
import mongoose from "mongoose";

import Issue from "../models/issues.js";
import Worker from "../models/workers.js";
import Resident from "../models/resident.js";
import Security from "../models/security.js";
import Community from "../models/communities.js";
import CommonSpaces from "../models/commonSpaces.js";
import PaymentController from "../controllers/payments.js";
import CommunityManager from "../models/cManager.js";
import Ad from "../models/Ad.js";
import Payment from "../models/payment.js";
import visitor from "../models/visitors.js";
import PreapprovedResident from "../models/preApprovedResident.js";
import PendingResidentRegistration from "../models/pendingResidentRegistration.js";

import { sendPassword } from "../controllers/OTP.js";

function generateCustomID(userEmail, facility, countOrRandom = null) {
  const id = userEmail.toUpperCase().slice(0, 2);

  const facilityCode = facility.toUpperCase().slice(0, 2);

  const suffix = countOrRandom
    ? String(countOrRandom).padStart(4, "0")
    : String(Math.floor(1000 + Math.random() * 9000));

  return `UE-${id}${facilityCode}${suffix}`;
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + ".png";
    cb(null, uniqueName);
  },
});
const upload = multer({ storage: storage });

managerRouter.get("/commonSpace", async (req, res) => {
  try{
    const c = '68f74d38c06f8c9e8ab68c80';
    const bookings = await CommonSpaces.find({ community: c , status : {$ne : "Rejected"} }).populate('payment').populate("bookedBy", "residentFirstname residentLastname email").sort({
      createdAt: -1,
    });

    const commonSpaces = await Amenity.find({community:c});

    res.status(200).json({
      bookings,
      commonSpaces,
    });
  }catch(err){
    console.error("Error fetching common spaces and bookings:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch common spaces and bookings",
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

managerRouter.get("/commonSpace/api/bookings", async (req, res) => {
  try {
    const c = req.user.community;
    const csb = await CommonSpaces.find({ community: c }).sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      bookings: csb,
    });
  } catch (error) {
    console.error("Error fetching bookings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch bookings",
    });
  }
});

managerRouter.get("/commonSpace/details/:id", async (req, res) => {
  try {
    const booking = await CommonSpaces.findById(req.params.id)
      .populate("bookedBy", "residentFirstname residentLastname email") // fetch resident info
      .populate("payment") // fetch payment info
      .populate("community", "name"); // fetch community info

    if (!booking) {
      return res
        .status(404)
        .json({ success: false, message: "Booking not found" });
    }

    res.json({
      success: true,
      name: booking.name,
      description: booking.description,
      date: booking.Date,
      from: booking.from,
      to: booking.to,
      status: booking.status,
      paymentStatus: booking.paymentStatus,
      payment: booking.payment || null,
      availability: booking.availability,
      ID: booking.ID,
      bookedBy: booking.bookedBy
        ? {
            name:
              booking.bookedBy.residentFirstname +
              " " +
              booking.bookedBy.residentLastname,
            email: booking.bookedBy.email,
          }
        : null,
      community: booking.community?.name || null,
      feedback: booking.feedback,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


managerRouter.post("/commonSpace/reject/:id", async (req, res) => {
  const id = req.params.id;
  const { reason } = req.body;
  try {
    const b = await CommonSpaces.findById(id).populate("bookedBy");

    if (!b) {
      return res.status(404).json({ message: "Booking not found" });
    }

    b.availability = "NO";
    b.paymentStatus = null;
    b.status = "Rejected";
    b.feedback = reason;

    b.bookedBy.notifications.push({
      belongs: "CS",
      n: `Your common space booking ${
        b.ID ? b.ID : b.title
      } has been cancelled`,
      createdAt: new Date(),
    });

    await b.save();

    res
      .status(200)
      .json({ success: true, message: "Booking rejected successfully." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

managerRouter.post("/spaces", async (req, res) => {
  try {
    // Validate required fields
    const { spaceType, spaceName, bookingRent,Type } = req.body;
    console.log("req.body : ", req.body);

    if (!spaceType || !spaceName) {
      console.log("no space name or type");
      
      return res.status(400).json({
        success: false,
        message: "Space type and name are required",
      });
    }


    // if (!req.user || !req.user.community) {
    //   return res.status(401).json({
    //     success: false,
    //     message: "Unauthorized access",
    //   });
    // }


    // Check for duplicate space names
    const existingSpace = await Amenity.find({spaceName,community:'68f74d38c06f8c9e8ab68c80'})
    if (existingSpace.length > 0) {
      console.log("there is already existing",existingSpace);
      
      return res.status(400).json({
        success: false,
        message: "A space with this name already exists",
      });
    }

    const newSpace = await Amenity.create({
      type: spaceType.trim(),
      name: spaceName.trim(),
      bookable:
        req.body.bookable !== undefined ? Boolean(req.body.bookable) : true,
      bookingRules: req.body.bookingRules ? req.body.bookingRules.trim() : "",
      rent: bookingRent,
      community: new mongoose.Types.ObjectId("68f74d38c06f8c9e8ab68c80"),
      createdAt: new Date(),
      updatedAt: new Date(),
      Type
    })

    console.log("new space:",newSpace);
    

    res.status(201).json({
      success: true,
      message: "Space created successfully",
      space: newSpace,
    });
  } catch (error) {
    console.error("Error creating space:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

managerRouter.put("/spaces/:id", async (req, res) => {
  console.log(req.body);
  
  try {
    const spaceId = req.params.id;
    if (!spaceId) {
      return res.status(400).json({
        success: false,
        message: "Space ID is required",
      });
    }

    const space = await Amenity.findById(spaceId)

    // if (!req.user || !req.user.community) {
    //   return res.status(401).json({
    //     success: false,
    //     message: "Unauthorized access",
    //   });
    // }


    const { spaceType, spaceName , bookingRules, bookable, bookingRent } = req.body;
    if (
      (spaceType !== undefined && !spaceType.trim()) ||
      (spaceName !== undefined && !spaceName.trim())
    ) {
      return res.status(400).json({
        success: false,
        message: "Space type and name cannot be empty",
      });
    }


    if (spaceName && spaceName.trim()) {
      const duplicateSpace = await Amenity.find({spaceName , community:'68f74d38c06f8c9e8ab68c80'})
      if (duplicateSpace[0]) {
        return res.status(400).json({
          success: false,
          message: "A space with this name already exists",
        });
      }
    }


    space.name = spaceName;
    space.type = spaceType;
    space.bookingRules = bookingRules;
    space.bookable = bookable;
    space.rent = bookingRent;
    space.updatedAt = new Date();

    await space.save();
    

    res.json({
      success: true,
      message: "Space updated successfully",
      space
    });
  } catch (error) {
    console.error("Error updating space:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

managerRouter.delete("/spaces/:id", async (req, res) => {
  try {
    // Validate space ID
    const spaceId = req.params.id;
    console.log(spaceId);
    if (!spaceId) {
      return res.status(400).json({
        success: false,
        message: "Space ID is required",
      });
    }

    // // Check if user has community access
    // if (!req.user || !req.user.community) {
    //   return res.status(401).json({
    //     success: false,
    //     message: "Unauthorized access",
    //   });
    // }



    const space = await Amenity.findByIdAndDelete(spaceId);
    if (!space) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    res.json({
      success: true,
      message: "Common space deleted successfully",
      deletedSpace: {
        id: spaceId
      },
    });
  } catch (error) {
    console.error("Error deleting common space:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

managerRouter.post("/api/community/booking-rules", async (req, res) => {
  try {
    // Validate input
    if (req.body.rules === undefined) {
      return res.status(400).json({
        success: false,
        message: "Booking rules are required",
      });
    }

    // Check if user has community access
    if (!req.user || !req.user.community) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const community = await Community.findById(req.user.community);
    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    // Sanitize and update booking rules
    const sanitizedRules = req.body.rules ? req.body.rules.trim() : "";
    community.bookingRules = sanitizedRules;
    community.updatedAt = new Date();

    await community.save();

    res.json({
      success: true,
      message: "Booking rules updated successfully",
      rules: sanitizedRules,
    });
  } catch (error) {
    console.error("Error updating booking rules:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

managerRouter.get("/api/community/spaces", async (req, res) => {
  try {
    // Check if user has community access
    if (!req.user || !req.user.community) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access",
      });
    }

    const community = await Community.findById(req.user.community);
    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    res.json({
      success: true,
      spaces: community.commonSpaces,
      totalSpaces: community.commonSpaces.length,
    });
  } catch (error) {
    console.error("Error fetching spaces:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

async function checkSubscription(req, res, next) {
  try {
    // Allow auth-less or excluded routes
    const allowList = [
      "/subscription-plans",
      "/subscription-payment",
      "/subscription-status",
      "/subscription-history",
      "/community-details",
    ];

    // If the current path is in allowList, skip check
    if (allowList.some((p) => req.path.startsWith(p))) {
      return next();
    }

    // Require user context
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const manager = await CommunityManager.findById(req.user.id);
    if (!manager || !manager.assignedCommunity) {
      return res.status(403).json({ success: false, message: "No assigned community" });
    }

    const community = await Community.findById(manager.assignedCommunity).select(
      "subscriptionStatus planEndDate"
    );
    if (!community) {
      return res.status(404).json({ success: false, message: "Community not found" });
    }

    const now = new Date();
    const isExpired = community.planEndDate && new Date(community.planEndDate) < now;
    const isActive = community.subscriptionStatus === "active" && !isExpired;

    if (!isActive) {
      // Block access to other pages until subscription is active
      return res.status(402).json({
        success: false,
        message: "Subscription required. Please subscribe to access this page.",
        redirect: "/manager/subscription",
      });
    }

    return next();
  } catch (err) {
    console.error("Subscription check error:", err);
    return res.status(500).json({ success: false, message: "Subscription check failed" });
  }
}


// Apply checkSubscription middleware to all routes except excluded ones
managerRouter.use(checkSubscription);

async function getSubscriptionStatus(req) {
  try {
    const managerId = req.user.id;
    const manager = await CommunityManager.findById(managerId);

    if (!manager || !manager.assignedCommunity) {
      return null;
    }

    const community = await Community.findById(
      manager.assignedCommunity
    ).select("subscriptionStatus planEndDate subscriptionPlan");

    if (!community) {
      return null;
    }

    const now = new Date();
    const isExpired =
      community.planEndDate && new Date(community.planEndDate) < now;
    const daysUntilExpiry = community.planEndDate
      ? Math.ceil(
          (new Date(community.planEndDate) - now) / (1000 * 60 * 60 * 24)
        )
      : 0;

    return {
      status: isExpired ? "expired" : community.subscriptionStatus,
      plan: community.subscriptionPlan,
      isExpired,
      daysUntilExpiry,
      isExpiringSoon: daysUntilExpiry <= 7 && daysUntilExpiry > 0,
    };
  } catch (error) {
    console.error("Error getting subscription status:", error);
    return null;
  }
}
// Get community details with subscription info
managerRouter.get("/community-details", async (req, res) => {
  try {
    const managerId = req.user.id;
    const manager = await CommunityManager.findById(managerId);

    if (!manager) {
      return res.status(404).json({ message: "Community manager not found" });
    }

    const community = await Community.findById(
      manager.assignedCommunity
    ).select(
      "name subscriptionPlan subscriptionStatus planStartDate planEndDate subscriptionHistory"
    );

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }
    console.log(community);
    res.json(community);
  } catch (error) {
    console.error("Error fetching community details:", error);
    res.status(500).json({ message: "Failed to fetch community details" });
  }
});

// Handle subscription payment
managerRouter.post("/subscription-payment", async (req, res) => {
  try {
    const {
      communityId,
      subscriptionPlan,
      amount,
      paymentMethod,
      planDuration,
      transactionId,
      paymentDate,
      isRenewal,
      cardMeta,
    } = req.body;

    // Validate required fields
    if (!subscriptionPlan || !amount || !paymentMethod) {
      return res
        .status(400)
        .json({ message: "Missing required payment information" });
    }

    // Get the community
    const managerId = req.user.id;
    const manager = await CommunityManager.findById(managerId);

    if (!manager) {
      return res.status(404).json({ message: "Community manager not found" });
    }

    const community = await Community.findById(communityId);
    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    // Calculate plan end date
    const startDate = new Date(paymentDate);
    const endDate = new Date(startDate);

    if (planDuration === "monthly") {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (planDuration === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Create subscription payment record
    const subscriptionPayment = {
      transactionId:
        transactionId ||
        `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      planName: getSubscriptionPlanName(subscriptionPlan),
      planType: subscriptionPlan,
      amount: amount,
      paymentMethod: paymentMethod,

      paymentDate: new Date(paymentDate),
      planStartDate: startDate,
      planEndDate: endDate,
      duration: planDuration,
      status: "completed",
      isRenewal: isRenewal || false,
      processedBy: managerId,
      metadata: {
        userAgent: req.get("User-Agent"),
        ipAddress: req.ip || req.connection.remoteAddress,
        card: paymentMethod === "card" && cardMeta ? {
          brand: cardMeta.brand,
          last4: cardMeta.last4,
          expiry: cardMeta.expiry,
          name: cardMeta.name,
        } : undefined,
      },
    };

    // Update community subscription details
    community.subscriptionPlan = subscriptionPlan;
    community.subscriptionStatus = "active";
    community.planStartDate = startDate;
    community.planEndDate = endDate;

    // Add to subscription history
    if (!community.subscriptionHistory) {
      community.subscriptionHistory = [];
    }
    community.subscriptionHistory.push(subscriptionPayment);

    // Save the community
    await community.save();

    // Prepare response
    const response = {
      success: true,
      message: "Subscription payment processed successfully",
      transactionId: subscriptionPayment.transactionId,
      planName: subscriptionPayment.planName,
      amount: subscriptionPayment.amount,
      planEndDate: subscriptionPayment.planEndDate,
      subscriptionStatus: community.subscriptionStatus,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error("Subscription payment error:", error);
    res.status(500).json({
      message: "Payment processing failed",
      error: error.message,
    });
  }
});

managerRouter.get("/subscription-history", async (req, res) => {
  try {
    const managerId = req.user.id;
    const manager = await CommunityManager.findById(managerId);

    if (!manager) {
      return res.status(404).json({ message: "Community manager not found" });
    }

    const community = await Community.findById(
      manager.assignedCommunity
    ).select("subscriptionHistory");

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    // Sort history by payment date (newest first)
    const sortedHistory = community.subscriptionHistory
      ? community.subscriptionHistory.sort(
          (a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)
        )
      : [];

    res.json({
      success: true,
      history: sortedHistory,
      totalPayments: sortedHistory.length,
    });
  } catch (error) {
    console.error("Error fetching subscription history:", error);
    res.status(500).json({ message: "Failed to fetch subscription history" });
  }
});

managerRouter.get("/subscription-status", async (req, res) => {
  try {
    const managerId = req.user.id;
    const manager = await CommunityManager.findById(managerId);

    if (!manager) {
      return res.status(404).json({ message: "Community manager not found" });
    }

    const community = await Community.findById(
      manager.assignedCommunity
    ).select(
      "name subscriptionPlan subscriptionStatus planStartDate planEndDate"
    );

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    // Check if subscription is expired
    const now = new Date();
    const isExpired =
      community.planEndDate && new Date(community.planEndDate) < now;

    if (isExpired && community.subscriptionStatus === "active") {
      community.subscriptionStatus = "expired";
      await community.save();
    }

    // Calculate days until expiry
    let daysUntilExpiry = null;
    if (community.planEndDate) {
      daysUntilExpiry = Math.ceil(
        (new Date(community.planEndDate) - now) / (1000 * 60 * 60 * 24)
      );
    }

    res.json({
      success: true,
      community: {
        name: community.name,
        subscriptionPlan: community.subscriptionPlan,
        subscriptionStatus: community.subscriptionStatus,
        planStartDate: community.planStartDate,
        planEndDate: community.planEndDate,
        daysUntilExpiry: daysUntilExpiry,
        isExpired: isExpired,
        isExpiringSoon:
          daysUntilExpiry && daysUntilExpiry <= 7 && daysUntilExpiry > 0,
      },
    });
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    res.status(500).json({ message: "Failed to fetch subscription status" });
  }
});
import fs from "fs";
import Amenity from "../models/Amenities.js";

const storage2 = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join("uploads", "something");

    fs.mkdir(dir, { recursive: true }, (err) => {
      if (err) return cb(err);
      cb(null, dir); // ✅ tell multer where to store the file
    });
  },

  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload2 = multer({
  storage: storage2,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10, // Maximum 10 files
  },
});

managerRouter.get("/new-community", (req, res) => {
  res.render("communityManager/new-community");
});

// Create new community with photo upload
managerRouter.post("/communities", async (req, res) => {
  try {
    const { subscriptionPlan, paymentMethod } = req.body;

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Please fill in all required fields.",
      });
    }

    // Plan pricing
    const planPrices = {
      basic: 999,
      standard: 1999,
      premium: 3999,
    };

    const planStartDate = new Date();
    const planEndDate = new Date();
    planEndDate.setMonth(planEndDate.getMonth() + 1);

    const transactionId = `TXN${Date.now()}${Math.random()
      .toString(36)
      .substr(2, 9)
      .toUpperCase()}`;

    // Find the manager and their assigned community

    // Find the community and update it
    const community = req.user.community;
    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Assigned community not found.",
      });
    }

    // Update subscription details
    community.subscriptionPlan = subscriptionPlan;
    community.subscriptionStatus = "active";
    community.planStartDate = planStartDate;
    community.planEndDate = planEndDate;

    // Add subscription history
    community.subscriptionHistory.push({
      transactionId,
      planName: `${
        subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1)
      } Plan`,
      planType: subscriptionPlan,
      amount: planPrices[subscriptionPlan],
      paymentMethod,
      paymentDate: new Date(),
      planStartDate,
      planEndDate,
      duration: "monthly",
      status: "completed",
      isRenewal: true,
      processedBy: req.session?.managerId || null,
      metadata: {
        userAgent: req.get("User-Agent"),
        ipAddress: req.ip,
      },
    });

    // Legacy payment history
    community.paymentHistory.push({
      date: new Date(),
      amount: planPrices[subscriptionPlan],
      method: paymentMethod,
      transactionId,
      invoiceUrl: null,
    });

    await community.save();

    res.status(200).json({
      success: true,
      message: "Community subscription updated successfully!",
      data: {
        communityId: community._id,
        subscriptionPlan: community.subscriptionPlan,
        transactionId,
      },
    });
  } catch (error) {
    console.error("Error updating community:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while updating the community.",
    });
  }
});

// Get community details
managerRouter.get("/communities/:id", async (req, res) => {
  try {
    const community = await Community.findById(req.params.id)
      .populate("communityManager", "name email")
      .lean();

    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found.",
      });
    }

    res.json({
      success: true,
      data: community,
    });
  } catch (error) {
    console.error("Error fetching community:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching community details.",
    });
  }
});

// Get all communities for the logged-in manager
managerRouter.get("/communities", async (req, res) => {
  try {
    const managerId = req.session?.managerId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = managerId ? { communityManager: managerId } : {};

    const communities = await Community.find(query)
      .select(
        "name location email status totalMembers subscriptionPlan subscriptionStatus planEndDate profile.photos"
      )
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Community.countDocuments(query);

    res.json({
      success: true,
      data: {
        communities,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error fetching communities:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching communities.",
    });
  }
});

// Payment stats endpoint
managerRouter.get("/payment-stats", async (req, res) => {
  try {
    const managerId = req.session?.managerId;
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const matchCondition = {
      "subscriptionHistory.paymentDate": { $gte: firstDayOfMonth },
    };

    if (managerId) {
      matchCondition.communityManager = managerId;
    }

    const stats = await Community.aggregate([
      { $match: matchCondition },
      { $unwind: "$subscriptionHistory" },
      {
        $match: {
          "subscriptionHistory.paymentDate": { $gte: firstDayOfMonth },
          "subscriptionHistory.status": "completed",
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$subscriptionHistory.amount" },
          pendingAmount: {
            $sum: {
              $cond: [
                { $eq: ["$subscriptionHistory.status", "pending"] },
                "$subscriptionHistory.amount",
                0,
              ],
            },
          },
          totalTransactions: { $sum: 1 },
        },
      },
    ]);

    res.json({
      success: true,
      data: stats[0] || {
        totalAmount: 0,
        pendingAmount: 0,
        totalTransactions: 0,
      },
    });
  } catch (error) {
    console.error("Error fetching payment stats:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred while fetching payment statistics.",
    });
  }
});
function getSubscriptionPlanName(planType) {
  const planNames = {
    basic: "Basic Plan",
    standard: "Standard Plan",
    premium: "Premium Plan",
  };
  return planNames[planType] || "Unknown Plan";
}
// Helper function to get plan price
function getPlanPrice(planType) {
  const planPrices = {
    basic: 999,
    standard: 1999,
    premium: 3999,
  };
  return planPrices[planType] || 0;
}

managerRouter.get("/all-payments", PaymentController.getAllPayments);

// Create a new payment
managerRouter.post("/payments", PaymentController.createPayment);

// Get all residents
managerRouter.get("/residents", PaymentController.getAllResidents);

// Get current logged-in user information
managerRouter.get("/currentcManager", PaymentController.getCurrentcManager);

// Get a specific payment by ID
managerRouter.get("/payments/:id", PaymentController.getPaymentById);

// Update a payment status
managerRouter.put("/payments/:id", PaymentController.updatePayment);

// Delete a payment
managerRouter.delete("/payments/:id", PaymentController.deletePayment);

managerRouter.get("/userManagement", async (req, res) => {
  const ads = await Ad.find({
    community: req.user.community,
    status: "Active",
  });

  const R = await Resident.find({ community: req.user.community });
  const W = await Worker.find({ community: req.user.community });
  const S = await Security.find({ community: req.user.community });

  res.render("communityManager/userManagement", { path: "um", ads, R, W, S });
});

managerRouter.post("/userManagement/resident", async (req, res) => {
  try {
    const { Rid, residentFirstname, residentLastname, email, uCode, contact } =
      req.body;

    console.log("Incoming Resident ID:", Rid);
    console.log("Request body:", req.body);

    if (Rid) {
      const r = await Resident.findById(Rid);
      if (!r) {
        return res
          .status(404)
          .json({
            success: false,
            message: `Resident with ID ${Rid} not found`,
          });
      }

      r.residentFirstname = residentFirstname;
      r.residentLastname = residentLastname;
      r.email = email;
      r.uCode = uCode;
      r.contact = contact;

      await r.save();
      res.json({ success: true, resident: r, isUpdate: true });
    } else {
      // Create new resident
      const r = await Resident.create({
        residentFirstname,
        residentLastname,
        email,
        contact,
        uCode,
        community: req.user.community,
      });

      const password = await sendPassword({ email, userType: "Resident" });
      const hashedPassword = await bcrypt.hash(password, 10);
      r.password = hashedPassword;
      await r.save();


      res.json({ success: true, resident: r });
    }
  } catch (err) {
    console.error("Error in /userManagement/resident:", err);

    let flashMsg;
    if (err.name === "ValidationError") {
      flashMsg = Object.values(err.errors)
        .map((e) => e.message)
        .join(", ");
    } else if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      flashMsg = `Duplicate value for ${field}: ${err.keyValue[field]}`;
    } else {
      flashMsg = err.message || "Unexpected error occurred";
    }

    req.flash("alert-msg", { text: flashMsg, type: "error" });
    res.json({ success: false, message: flashMsg });
  }
});

managerRouter.get("/userManagement/resident/:id", async (req, res) => {
  const id = req.params.id;

  const r = await Resident.findById(id);

  res.status(200).json({ success: true, r });
});

managerRouter.delete("/userManagement/resident/:id", async (req, res) => {
  const id = req.params.id;

  const r = await Resident.deleteOne({ _id: id });

  res.status(200).json({ ok: true });
});

managerRouter.post("/userManagement/security", async (req, res) => {
  try {
    const {
      Sid,
      securityName,
      securityEmail,
      securityContact,
      securityAddress,
      securityShift,
      gate,
    } = req.body;

    console.log("Incoming Security ID:", Sid);
    console.log("Request body:", req.body);

    if (Sid) {
      const s = await Security.findById(Sid);
      if (!s) {
        return res
          .status(404)
          .json({
            success: false,
            message: `Security staff with ID ${Sid} not found`,
          });
      }

      s.name = securityName;
      s.email = securityEmail;
      s.contact = securityContact;
      s.address = securityAddress;
      s.shift = securityShift;
      s.workplace = gate;

      await s.save();

      res.json({ success: true, security: s, isUpdate: true });
    } else {
      const s = await Security.create({
        name: securityName,
        email: securityEmail,
        contact: securityContact,
        address: securityAddress,
        Shift: securityShift,
        workplace: gate,
        community: req.user.community,
      });

      const password = await sendPassword({
        email: securityEmail,
        userType: "Security",
      });
      const hashedPassword = await bcrypt.hash(password, 10);
      s.password = hashedPassword;
      await s.save();

      console.log("New security staff:", s);

      res.status(200).json({ success: true, security: s });
    }
  } catch (err) {
    console.error("Error in /userManagement/security:", err);

    let flashMsg;
    if (err.name === "ValidationError") {
      flashMsg = Object.values(err.errors)
        .map((e) => e.message)
        .join(", ");
    } else if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      flashMsg = `Duplicate value for ${field}: ${err.keyValue[field]}`;
    } else {
      flashMsg = err.message || "Unexpected error occurred";
    }
    res.status(400).json({ success: false, message: flashMsg });
  }
});

managerRouter.get("/userManagement/security/:id", async (req, res) => {
  const id = req.params.id;

  const r = await Security.findById(id);

  console.log(r);

  res.status(200).json({ success: true, r });
});
managerRouter.delete("/userManagement/security/:id", async (req, res) => {
  const id = req.params.id;

  const r = await Security.deleteOne({ _id: id });

  res.status(200).json({ ok: true });
});

managerRouter.post("/userManagement/worker", async (req, res) => {
  try {
    const {
      Wid,
      workerName,
      workerEmail,
      workerJobRole,
      workerContact,
      workerAddress,
      workerSalary,
    } = req.body;

    console.log("Incoming Worker ID:", Wid);
    console.log("Request body:", req.body);

    if (Wid) {
      const w = await Worker.findById(Wid);
      if (!w) {
        return res
          .status(404)
          .json({ success: false, message: `Worker with ID ${Wid} not found` });
      }

      w.name = workerName;
      w.email = workerEmail;
      w.jobRole = workerJobRole;
      w.contact = workerContact;
      w.address = workerAddress;
      w.salary = workerSalary;
      await w.save();
      return res.json({ success: true, worker: w, isUpdate: true });
    } else {
      const w = await Worker.create({
        name: workerName,
        email: workerEmail,
        jobRole: workerJobRole,
        contact: workerContact,
        address: workerAddress,
        salary: workerSalary,

        community: req.user.community,
      });

      const password = await sendPassword({
        email: workerEmail,
        userType: "Worker",
      });

      const hashedPassword = await bcrypt.hash(password, 10);
      w.password = hashedPassword;
      await w.save();

      console.log("New worker:", w);
      res.json({ success: true, worker: w });
    }
  } catch (err) {
    console.error("Error in /userManagement/worker:", err);

    let flashMsg;
    if (err.name === "ValidationError") {
      flashMsg = Object.values(err.errors)
        .map((e) => e.message)
        .join(", ");
    } else if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0];
      flashMsg = `Duplicate value for ${field}: ${err.keyValue[field]}`;
    } else {
      flashMsg = err.message || "Unexpected error occurred";
    }

    res.status(400).json({ success: false, message: flashMsg });
  }
});

managerRouter.get("/userManagement/worker/:id", async (req, res) => {
  const id = req.params.id;

  const r = await Worker.findById(id);

  res.status(200).json({ success: true, r });
});

managerRouter.delete("/userManagement/worker/:id", async (req, res) => {
  const id = req.params.id;

  const r = await Worker.deleteOne({ _id: id });

  res.status(200).json({ ok: true });
});

managerRouter.get("/dashboard", async (req, res) => {
  const ads = await Ad.find({
    community: req.user.community,
    status: "Active",
  });

  const issues = await Issue.find({
    community: req.user.community,
    status: "Pending",
  }).populate("resident", "residentFirstname residentLastname");
  const residents = await Resident.find({ community: req.user.community });
  const commonSpacesBookings = await CommonSpaces.find({
    community: req.user.community,
    status: "Pending",
  }).populate("bookedBy", "residentFirstname residentLastname");
  const payments = await Payment.find({ community: req.user.community });
  const visitors = await visitor.find({ community: req.user.community });

  const totalResidents = residents.length;
  const totalCommonSpacesBookings = commonSpacesBookings.length;
  const totalPayments = payments.length;

  let Iactions = [...issues];
  let Cactions = [...commonSpacesBookings];

  Iactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  Cactions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const pendingIssues = issues.filter(
    (issue) => issue.status === "Pending" || issue.status === "Assigned"
  ).length;
  const pendingCommonSpacesBookings = commonSpacesBookings.filter(
    (booking) => booking.status === "Pending"
  ).length;
  const pendingPayments = payments.filter(
    (payment) => payment.status === "Pending"
  ).length;
  const completedPayments = payments.filter(
    (payment) => payment.status === "Completed"
  ).length;

  res.render("communityManager/dashboard", {
    path: "d",
    ads,
    totalResidents,
    totalCommonSpacesBookings,
    totalPayments,
    pendingIssues,
    pendingCommonSpacesBookings,
    pendingPayments,
    completedPayments,
    visitors,
    Iactions,
    Cactions,
  });
});

managerRouter.get("/", (req, res) => {
  res.redirect("dashboard");
});

managerRouter.get("/issueResolving", async (req, res) => {
  try {
    const managerId = req.user.id;
    const manager = await CommunityManager.findById(managerId);

    const ads = await Ad.find({
      community: req.user.community,
      status: "Active",
    });

    if (!manager) {
      return res.status(404).json({ message: "Community manager not found" });
    }
    const community = manager.assignedCommunity;

    if (!community) {
      return res.status(404).json({ message: "Community not found" });
    }

    const workers = await Worker.find({ community: community });
    const issues = await Issue.find({ community: community })
      .populate("resident")
      .populate("workerAssigned");

    console.log(issues);

    res.render("communityManager/issueResolving", {
      path: "ir",
      issues: issues,
      workers: workers,
      ads,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
});

// API endpoint to fetch issues data for auto-refresh
managerRouter.get("/issueResolving/api/issues", async (req, res) => {
  try {
    const managerId = req.user.id;
    const manager = await CommunityManager.findById(managerId);

    if (!manager) {
      return res
        .status(404)
        .json({ success: false, message: "Community manager not found" });
    }

    const community = manager.assignedCommunity;
    if (!community) {
      return res
        .status(404)
        .json({ success: false, message: "Community not found" });
    }

    const issues = await Issue.find({ community: community })
      .populate("resident")
      .populate("workerAssigned")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      issues: issues,
    });
  } catch (error) {
    console.error("Error fetching issues:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch issues",
    });
  }
});
import {assignIssue,getManagerIssues,reassignIssue,closeIssueByManager,holdIssue,getIssueById} from "../controllers/issueController.js";
managerRouter.get("/issue/myIssues", getManagerIssues);
managerRouter.post("/issue/assign/:id", assignIssue);
managerRouter.post("/issue/reassign/:id", reassignIssue);
managerRouter.post("/issue/close/:id", closeIssueByManager);
managerRouter.post("/issue/hold/:id", holdIssue);
managerRouter.get("/issue/:id", getIssueById);

// NEW: Route for handling rejected auto-assigned issues (resident rejects → goes to manager)
managerRouter.get("/issue/rejected/pending", async (req, res) => {
  try {
    const managerId = req.user.id;
    const manager = await CommunityManager.findById(managerId);

    if (!manager) {
      return res.status(404).json({ success: false, message: "Manager not found" });
    }

    const community = manager.assignedCommunity;

    // Issues that were auto-assigned but rejected by resident
    const rejectedIssues = await Issue.find({
      community,
      status: "Reopened",
      autoAssigned: true,
    })
      .populate("resident")
      .populate("workerAssigned")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: rejectedIssues.length,
      issues: rejectedIssues,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


managerRouter.get("/payments", async (req, res) => {
  try {
    const ads = await Ad.find({
      community: req.user.community,
      status: "Active",
    });

    const managerId = req.user.id;
    const manager = await CommunityManager.findById(managerId);

    if (!manager) {
      return res
        .status(404)
        .render("error", { message: "Community manager not found" });
    }

    const community = await Community.findById(
      manager.assignedCommunity
    ).select(
      "name subscriptionPlan subscriptionStatus planStartDate planEndDate subscriptionHistory"
    );

    if (!community) {
      return res
        .status(404)
        .render("error", { message: "Community not found" });
    }

    const payments = community.subscriptionHistory || [];
    const hasPayments = payments.length > 0;

    const now = new Date();
    const isExpired =
      community?.planEndDate && new Date(community.planEndDate) < now;

    const x = !hasPayments; // No payment yet
    const y = hasPayments && isExpired; // Paid but expired

    const planPrices = {
      basic: 999,
      standard: 1999,
      premium: 3999,
    };

    const currentPlan = community.subscriptionPlan || "basic";
    const currentPlanPrice = planPrices[currentPlan];

    res.render("communityManager/Payments", {
      path: "p",
      ads,
      x,
      y,
      plan: currentPlan,
      planPrice: currentPlanPrice,
      planPrices,
      community: {
        name: community.name,
        subscriptionStatus: community.subscriptionStatus,
        planEndDate: community.planEndDate,
      },
    });
  } catch (error) {
    console.error("Error loading payments page:", error);
    res.status(500).render("error", { message: "Error loading payments page" });
  }
});

// Get available subscription plans
managerRouter.get("/subscription-plans", async (req, res) => {
  try {
    const planPrices = {
      basic: 999,
      standard: 1999,
      premium: 3999,
    };

    const planDetails = {
      basic: {
        name: "Basic Plan",
        price: 999,
        features: [
          "Up to 50 residents",
          "Basic payment tracking",
          "Email support",
        ],
        duration: "monthly",
      },
      standard: {
        name: "Standard Plan",
        price: 1999,
        features: [
          "Up to 200 residents",
          "Advanced payment tracking",
          "SMS notifications",
          "Priority support",
        ],
        duration: "monthly",
      },
      premium: {
        name: "Premium Plan",
        price: 3999,
        features: [
          "Unlimited residents",
          "Full payment suite",
          "SMS + Email notifications",
          "Dedicated support",
          "Analytics dashboard",
        ],
        duration: "monthly",
      },
    };

    res.json({
      success: true,
      plans: planDetails,
      planPrices,
    });
  } catch (error) {
    console.error("Error fetching subscription plans:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch subscription plans",
    });
  }
});

// Handle plan change request
managerRouter.post("/change-plan", async (req, res) => {
  try {
    const { newPlan, changeOption, paymentMethod } = req.body;

    // Validate required fields
    if (!newPlan || !changeOption) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: newPlan and changeOption",
      });
    }

    // Get manager and community info
    const managerId = req.user.id;
    const manager = await CommunityManager.findById(managerId);

    if (!manager) {
      return res.status(404).json({
        success: false,
        message: "Community manager not found",
      });
    }

    const community = await Community.findById(manager.assignedCommunity);
    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    // Plan pricing
    const planPrices = {
      basic: 999,
      standard: 1999,
      premium: 3999,
    };

    const currentPlan = community.subscriptionPlan || "basic";
    const currentPrice = planPrices[currentPlan];
    const newPrice = planPrices[newPlan];

    if (!newPrice) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan selected",
      });
    }

    if (currentPlan === newPlan) {
      return res.status(400).json({
        success: false,
        message: "You are already on this plan",
      });
    }

    const now = new Date();
    const planEndDate = new Date(community.planEndDate);
    const isExpired = planEndDate < now;

    if (changeOption === "immediate") {
      // Immediate change - charge difference and update immediately
      const priceDifference = newPrice - currentPrice;

      if (paymentMethod && priceDifference > 0) {
        // Process payment for the difference
        const transactionId = `PLAN_CHANGE_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        // Create payment record for the difference
        const paymentRecord = {
          transactionId,
          planName: `${
            newPlan.charAt(0).toUpperCase() + newPlan.slice(1)
          } Plan (Upgrade)`,
          planType: newPlan,
          amount: priceDifference,
          paymentMethod,
          paymentDate: now,
          planStartDate: now,
          planEndDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
          duration: "monthly",
          status: "completed",
          isRenewal: false,
          isPlanChange: true,
          changeType: "immediate",
          previousPlan: currentPlan,
          processedBy: managerId,
          metadata: {
            userAgent: req.get("User-Agent"),
            ipAddress: req.ip || req.connection.remoteAddress,
          },
        };

        // Update community subscription
        community.subscriptionPlan = newPlan;
        community.subscriptionStatus = "active";
        community.planStartDate = now;
        community.planEndDate = new Date(
          now.getTime() + 30 * 24 * 60 * 60 * 1000
        );

        // Add to subscription history
        if (!community.subscriptionHistory) {
          community.subscriptionHistory = [];
        }
        community.subscriptionHistory.push(paymentRecord);

        await community.save();

        res.json({
          success: true,
          message: "Plan changed successfully! Your new plan is now active.",
          transactionId,
          newPlan,
          amountCharged: priceDifference,
          planEndDate: community.planEndDate,
        });
      } else if (priceDifference <= 0) {
        // Downgrade - no payment needed, just update plan
        community.subscriptionPlan = newPlan;
        community.planStartDate = now;
        community.planEndDate = new Date(
          now.getTime() + 30 * 24 * 60 * 60 * 1000
        );

        // Add change record to history
        if (!community.subscriptionHistory) {
          community.subscriptionHistory = [];
        }
        community.subscriptionHistory.push({
          transactionId: `PLAN_CHANGE_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          planName: `${
            newPlan.charAt(0).toUpperCase() + newPlan.slice(1)
          } Plan (Downgrade)`,
          planType: newPlan,
          amount: 0,
          paymentMethod: "No Payment Required",
          paymentDate: now,
          planStartDate: now,
          planEndDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
          duration: "monthly",
          status: "completed",
          isRenewal: false,
          isPlanChange: true,
          changeType: "immediate",
          previousPlan: currentPlan,
          processedBy: managerId,
        });

        await community.save();

        res.json({
          success: true,
          message: "Plan changed successfully! Your new plan is now active.",
          newPlan,
          amountCharged: 0,
          planEndDate: community.planEndDate,
        });
      } else {
        return res.status(400).json({
          success: false,
          message: "Payment method required for plan upgrade",
        });
      }
    } else if (changeOption === "nextCycle") {
      // Schedule change for next billing cycle
      const nextCycleDate = isExpired ? now : planEndDate;

      // Store pending plan change
      community.pendingPlanChange = {
        newPlan,
        effectiveDate: nextCycleDate,
        requestedDate: now,
        requestedBy: managerId,
        status: "pending",
      };

      await community.save();

      res.json({
        success: true,
        message: `Plan change scheduled for ${nextCycleDate.toLocaleDateString()}. Your current plan will remain active until then.`,
        newPlan,
        effectiveDate: nextCycleDate,
        currentPlanEndDate: community.planEndDate,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid change option",
      });
    }
  } catch (error) {
    console.error("Plan change error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process plan change",
      error: error.message,
    });
  }
});

managerRouter.get("/ad", async (req, res) => {
  const ads = await Ad.find({
    community: req.user.community,
    status: "Active",
  });

  res.render("communityManager/Advertisement", { path: "ad", ads });
});

managerRouter.post("/ad", upload.single("image"), async (req, res) => {
  const { title, sdate, edate, link } = req.body;
  const file = req.file.path;

  const ad = await Ad.create({
    title,
    startDate: new Date(sdate), // directly save as Date object
    endDate: new Date(edate),

    link,
    imagePath: file,
    community: req.user.community,
  });

  console.log("new ad : ", ad);
  res.redirect("ad");
});

// ================= Pre-Approved Residents =================
// Upload bulk pre-approved residents (CSV or JSON array)
// Accepts either multipart file (CSV) or JSON body: [{ phone, unit, name }]
managerRouter.post("/preapproved/residents/bulk", upload.single("file"), async (req, res) => {
  try {
    const managerId = req.user.id;
    const manager = await CommunityManager.findById(managerId);
    if (!manager || !manager.assignedCommunity) {
      return res.status(401).json({ success: false, message: "Unauthorized or no assigned community" });
    }

    const communityId = manager.assignedCommunity;
    let entries = [];

    if (req.file) {
      // Parse CSV: headers phone,unit,name (optional)
      const content = fs.readFileSync(req.file.path, "utf8");
      const lines = content.split(/\r?\n/).filter(Boolean);
      const header = lines.shift().split(",").map(h => h.trim().toLowerCase());
      const idxPhone = header.indexOf("phone");
      const idxUnit = header.indexOf("unit");
      const idxName = header.indexOf("name");
      if (idxPhone === -1 || idxUnit === -1) {
        return res.status(400).json({ success: false, message: "CSV must include 'phone' and 'unit' headers" });
      }
      for (const line of lines) {
        const cols = line.split(",").map(c => c.trim());
        if (!cols[idxPhone] || !cols[idxUnit]) continue;
        entries.push({ phone: cols[idxPhone], unit: cols[idxUnit], name: idxName !== -1 ? cols[idxName] : undefined });
      }
    } else if (Array.isArray(req.body)) {
      entries = req.body;
    } else if (Array.isArray(req.body?.entries)) {
      entries = req.body.entries;
    } else {
      return res.status(400).json({ success: false, message: "Provide a CSV file or JSON array under 'entries'" });
    }

    // Normalize and validate
    const clean = entries
      .map(e => ({
        phone: String(e.phone || "").replace(/\s+/g, ""),
        unit: String(e.unit || "").trim(),
        name: e.name ? String(e.name).trim() : undefined
      }))
      .filter(e => e.phone && e.unit);

    if (!clean.length) {
      return res.status(400).json({ success: false, message: "No valid entries found" });
    }

    // Upsert entries, skip duplicates
    const results = { inserted: 0, duplicates: 0, errors: 0 };
    for (const e of clean) {
      try {
        await PreapprovedResident.updateOne(
          { community: communityId, phone: e.phone, unit: e.unit },
          { $setOnInsert: { community: communityId, phone: e.phone, unit: e.unit, name: e.name } },
          { upsert: true }
        );
        results.inserted += 1;
      } catch (err) {
        if (err.code === 11000) results.duplicates += 1; else results.errors += 1;
      }
    }

    res.json({ success: true, message: "Pre-approved residents processed", results });
  } catch (error) {
    console.error("Bulk preapproved upload error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// List pre-approved residents for current manager's community
managerRouter.get("/preapproved/residents", async (req, res) => {
  try {
    const managerId = req.user.id;
    const manager = await CommunityManager.findById(managerId);
    if (!manager || !manager.assignedCommunity) {
      return res.status(401).json({ success: false, message: "Unauthorized or no assigned community" });
    }
    const communityId = manager.assignedCommunity;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      PreapprovedResident.find({ community: communityId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      PreapprovedResident.countDocuments({ community: communityId })
    ]);

    res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch (error) {
    console.error("List preapproved error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

// Delete a pre-approved entry
managerRouter.delete("/preapproved/residents/:id", async (req, res) => {

  // ================= Pending Resident Registrations (Manager Review) =================
  // List pending registrations for this manager's community
  managerRouter.get("/registrations/pending", async (req, res) => {
    try {
      const manager = await CommunityManager.findById(req.user.id);
      if (!manager?.assignedCommunity) {
        return res.status(401).json({ success: false, message: "Unauthorized or no assigned community" });
      }
      const communityId = manager.assignedCommunity;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const skip = (page - 1) * limit;
      const [items, total] = await Promise.all([
        PendingResidentRegistration.find({ community: communityId, status: "pending" }).sort({ createdAt: -1 }).skip(skip).limit(limit),
        PendingResidentRegistration.countDocuments({ community: communityId, status: "pending" })
      ]);
      res.json({ success: true, data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
    } catch (error) {
      console.error("List pending registrations error:", error);
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  });

  // Approve a pending registration → create Resident and mark approved
  managerRouter.post("/registrations/:id/approve", async (req, res) => {
    try {
      const manager = await CommunityManager.findById(req.user.id);
      if (!manager?.assignedCommunity) {
        return res.status(401).json({ success: false, message: "Unauthorized or no assigned community" });
      }
      const pr = await PendingResidentRegistration.findById(req.params.id);
      if (!pr || String(pr.community) !== String(manager.assignedCommunity) || pr.status !== "pending") {
        return res.status(404).json({ success: false, message: "Pending registration not found" });
      }
      // Create resident
      const resident = await Resident.create({
        residentFirstname: pr.residentFirstname,
        residentLastname: pr.residentLastname,
        email: pr.email,
        contact: pr.phone,
        uCode: pr.unit,
        community: pr.community,
      });
      // Update pending record
      pr.status = "approved";
      pr.managerReviewedBy = req.user.id;
      pr.managerReviewedAt = new Date();
      await pr.save();
      res.json({ success: true, message: "Registration approved", residentId: resident._id });
    } catch (error) {
      console.error("Approve registration error:", error);
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  });

  // Reject a pending registration
  managerRouter.post("/registrations/:id/reject", async (req, res) => {
    try {
      const manager = await CommunityManager.findById(req.user.id);
      if (!manager?.assignedCommunity) {
        return res.status(401).json({ success: false, message: "Unauthorized or no assigned community" });
      }
      const { reason } = req.body;
      const pr = await PendingResidentRegistration.findById(req.params.id);
      if (!pr || String(pr.community) !== String(manager.assignedCommunity) || pr.status !== "pending") {
        return res.status(404).json({ success: false, message: "Pending registration not found" });
      }
      pr.status = "rejected";
      pr.reason = reason || "";
      pr.managerReviewedBy = req.user.id;
      pr.managerReviewedAt = new Date();
      await pr.save();
      res.json({ success: true, message: "Registration rejected" });
    } catch (error) {
      console.error("Reject registration error:", error);
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  });

  // Update unit for a pending registration
  managerRouter.patch("/registrations/:id/unit", async (req, res) => {
    try {
      const manager = await CommunityManager.findById(req.user.id);
      if (!manager?.assignedCommunity) {
        return res.status(401).json({ success: false, message: "Unauthorized or no assigned community" });
      }
      const { unit } = req.body;
      if (!unit || typeof unit !== "string") {
        return res.status(400).json({ success: false, message: "Valid unit is required" });
      }
      const pr = await PendingResidentRegistration.findById(req.params.id);
      if (!pr || String(pr.community) !== String(manager.assignedCommunity) || pr.status !== "pending") {
        return res.status(404).json({ success: false, message: "Pending registration not found" });
      }
      pr.unit = unit.trim();
      pr.updatedAt = new Date();
      await pr.save();
      res.json({ success: true, message: "Unit updated", data: { id: pr._id, unit: pr.unit } });
    } catch (error) {
      console.error("Update unit error:", error);
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  });

  // Add or update manager note for a pending registration
  managerRouter.patch("/registrations/:id/note", async (req, res) => {
    try {
      const manager = await CommunityManager.findById(req.user.id);
      if (!manager?.assignedCommunity) {
        return res.status(401).json({ success: false, message: "Unauthorized or no assigned community" });
      }
      const { note } = req.body;
      const pr = await PendingResidentRegistration.findById(req.params.id);
      if (!pr || String(pr.community) !== String(manager.assignedCommunity) || pr.status !== "pending") {
        return res.status(404).json({ success: false, message: "Pending registration not found" });
      }
      pr.managerNote = typeof note === "string" ? note : "";
      pr.updatedAt = new Date();
      await pr.save();
      res.json({ success: true, message: "Note saved", data: { id: pr._id, note: pr.managerNote } });
    } catch (error) {
      console.error("Save note error:", error);
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  });

  // Resend OTP to applicant (stubbed using existing OTP controller)
  managerRouter.post("/registrations/:id/resend-otp", async (req, res) => {
    try {
      const manager = await CommunityManager.findById(req.user.id);
      if (!manager?.assignedCommunity) {
        return res.status(401).json({ success: false, message: "Unauthorized or no assigned community" });
      }
      const pr = await PendingResidentRegistration.findById(req.params.id);
      if (!pr || String(pr.community) !== String(manager.assignedCommunity) || pr.status !== "pending") {
        return res.status(404).json({ success: false, message: "Pending registration not found" });
      }
      // Using email-based OTP as stub. Replace with SMS integration if available.
      const otp = await sendPassword({ email: pr.email, userType: "Resident" });
      res.json({ success: true, message: "OTP resent to applicant", meta: { email: pr.email } });
    } catch (error) {
      console.error("Resend OTP error:", error);
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  });

  // Bulk approve pending registrations
  managerRouter.post("/registrations/bulk-approve", async (req, res) => {
    try {
      const manager = await CommunityManager.findById(req.user.id);
      if (!manager?.assignedCommunity) {
        return res.status(401).json({ success: false, message: "Unauthorized or no assigned community" });
      }
      const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
      if (!ids.length) return res.status(400).json({ success: false, message: "No IDs provided" });
      const communityId = manager.assignedCommunity;
      const pendings = await PendingResidentRegistration.find({ _id: { $in: ids }, community: communityId, status: "pending" });
      const created = [];
      for (const pr of pendings) {
        const resident = await Resident.create({
          residentFirstname: pr.residentFirstname,
          residentLastname: pr.residentLastname,
          email: pr.email,
          contact: pr.phone,
          uCode: pr.unit,
          community: pr.community,
        });
        pr.status = "approved";
        pr.managerReviewedBy = req.user.id;
        pr.managerReviewedAt = new Date();
        await pr.save();
        created.push(resident._id);
      }
      res.json({ success: true, message: "Bulk approved", count: created.length, residents: created });
    } catch (error) {
      console.error("Bulk approve error:", error);
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  });

  // Bulk reject pending registrations
  managerRouter.post("/registrations/bulk-reject", async (req, res) => {
    try {
      const manager = await CommunityManager.findById(req.user.id);
      if (!manager?.assignedCommunity) {
        return res.status(401).json({ success: false, message: "Unauthorized or no assigned community" });
      }
      const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
      const reason = req.body?.reason || "";
      if (!ids.length) return res.status(400).json({ success: false, message: "No IDs provided" });
      const communityId = manager.assignedCommunity;
      const result = await PendingResidentRegistration.updateMany(
        { _id: { $in: ids }, community: communityId, status: "pending" },
        { $set: { status: "rejected", reason, managerReviewedBy: req.user.id, managerReviewedAt: new Date() } }
      );
      res.json({ success: true, message: "Bulk rejected", modified: result.modifiedCount });
    } catch (error) {
      console.error("Bulk reject error:", error);
      res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
  });
  try {
    const managerId = req.user.id;
    const manager = await CommunityManager.findById(managerId);
    if (!manager || !manager.assignedCommunity) {
      return res.status(401).json({ success: false, message: "Unauthorized or no assigned community" });
    }
    const communityId = manager.assignedCommunity;
    const entry = await PreapprovedResident.findOne({ _id: req.params.id, community: communityId });
    if (!entry) return res.status(404).json({ success: false, message: "Entry not found" });
    await PreapprovedResident.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: "Entry deleted" });
  } catch (error) {
    console.error("Delete preapproved error:", error);
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
});

managerRouter.get("/profile", async (req, res) => {
  const ads = await Ad.find({
    community: req.user.community,
    status: "Active",
  });

  const r = await CommunityManager.findById(req.user.id);

  console.log(r);

  res.render("communityManager/Profile", { path: "pr", ads, r });
});

managerRouter.post("/profile", upload.single("image"), async (req, res) => {
  const { name, email, contact } = req.body;

  let image = "";

  const r = await CommunityManager.findById(req.user.id);
  if (req.file) {
    image = req.file.path;
  }

  r.name = name;
  r.email = email;
  r.contact = contact;
  r.image = image;

  await r.save();

  res.json({ success: true, r, message: "Profile updated" });
});

managerRouter.post("/profile/changePassword", async (req, res) => {
  const { cp, np, cnp } = req.body;

  console.log(np, cp);

  const r = await CommunityManager.findById(req.user.id);

  const isMatch = await bcrypt.compare(cp, r.password);

  if (!isMatch) {
    return res.json({ success: false, message: "current password does not match" });
  }


  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(np, salt);
  r.password = hashedPassword;

  await r.save();

  return res.json({ success: true, message: "password changed" });
});

export default managerRouter;