import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import rateLimit from "express-rate-limit";

import auth from "../controllers/shared/auth.js";
import {
  VerifyA,
  VerifyC,
  VerifyR,
  VerifyS,
  VerifyW
} from "../controllers/shared/loginController.js";
import {
  sendLoginOtp,
  verifyOtp,
  resendOtp,
  sendTemporaryPassword
} from "../utils/otp.js";
import { cacheRoute } from "../middleware/cacheMiddleware.js";

import Community from "../models/communities.js";
import SystemSettings from "../models/systemSettings.js";

const authRouter = express.Router();

// ---------------- RATE LIMITERS FOR AUTH ENDPOINTS ----------------

const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100, // relaxed for development testing
  message: {
    success: false,
    message: "Too many login attempts, please try again after 5 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    console.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      path: req.path,
      email: req.body?.email,
    });
    res.status(429).json({
      success: false,
      message: "Too many login attempts, please try again after 5 minutes",
    });
  },
});

const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 5 minutes
  max: 3, // 3 OTP requests per window
  message: {
    success: false,
    message: "Too many OTP requests, please try again after 5 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 attempts per window
  message: {
    success: false,
    message: "Too many password reset requests, please try again after 15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`Forgot password rate limit exceeded for IP: ${req.ip}`, {
      email: req.body?.email,
    });
    res.status(429).json({
      success: false,
      message: "Too many password reset requests, please try again after 15 minutes",
    });
  },
});

/**
 * @swagger
 * /api/AdminLogin:
 *   post:
 *     summary: Admin login (triggers 2FA OTP)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent, returns tempToken for verification
 *       401:
 *         description: Invalid credentials
 *       429:
 *         description: Rate limited
 */
authRouter.post("/api/AdminLogin", authLimiter, async (req, res) => {
  console.log("HIT /api/AdminLogin route", req.body);
  try {
    const { email, password } = req.body;
    const verified = await VerifyA(email, password);
    console.log("VerifyA result:", !!verified);

    if (!verified) {
      console.log("Admin login failed for", email, { ip: req.ip });
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Send OTP for 2FA
    console.log("Sending OTP to:", email);
    await sendLoginOtp(email, {
      username: email,
      userType: "Admin",
    });
    console.log("OTP sent successfully");

    // Create a temp token for OTP verification
    const tempToken = jwt.sign(
      { ...verified.userPayload, purpose: "2fa" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    console.log("Returning requiresOtp: true");
    return res.json({ requiresOtp: true, user: verified.userPayload, tempToken });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: User login (all roles, 2FA)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password, userType]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               userType:
 *                 type: string
 *                 enum: [Resident, Security, Worker, communityManager, Admin]
 *     responses:
 *       200:
 *         description: Returns requiresOtp flag, user payload, and tempToken
 *       401:
 *         description: Invalid email or password
 *       429:
 *         description: Rate limited
 */
authRouter.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password, userType } = req.body || {};
    const normalizedRole = String(userType || "").trim().toLowerCase();
    let verified;
    if (normalizedRole === "resident") verified = await VerifyR(email, password);
    else if (normalizedRole === "security") verified = await VerifyS(email, password);
    else if (normalizedRole === "worker") verified = await VerifyW(email, password);
    else if (normalizedRole === "communitymanager" || normalizedRole === "manager") {
      console.log(email, password, userType);
      verified = await VerifyC(email, password);
    } else if (normalizedRole === "admin") {
      verified = await VerifyA(email, password);
    } else {
      return res.status(400).json({ message: "Invalid user type" });
    }

    if (!verified) {
      console.log(`${userType} login failed for ${email}`, { ip: req.ip });
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if 2FA should be skipped for non-admins
    const settings = await SystemSettings.findOne({ key: "global_settings" });
    const skip2FA = settings?.skip2FA && userType !== "Admin";

    if (skip2FA) {
      // Issue final token immediately
      const finalToken = jwt.sign(
        {
          id: verified.userPayload.id,
          email: verified.userPayload.email,
          userType: verified.userPayload.userType,
          community: verified.userPayload.community ?? null,
        },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.cookie("token", finalToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        secure: process.env.NODE_ENV === "production",
      });

      return res.json({
        requiresOtp: false,
        token: finalToken,
        user: { ...verified.userPayload, subscriptionStatus: "active" },
      });
    }

    await sendLoginOtp(email, {
      username: email,
      userType: verified.userPayload.userType || userType,
    });

    const tempToken = jwt.sign(
      { ...verified.userPayload, purpose: "2fa" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({ requiresOtp: true, user: verified.userPayload, tempToken });
  } catch (err) {
    console.error("/login error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /logout:
 *   post:
 *     summary: Logout (clears auth cookie)
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Successfully logged out
 */
authRouter.post("/logout", (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
    return res.status(200).json({ success: true, message: "Logged out" });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ success: false, message: "Logout failed" });
  }
});

/**
 * @swagger
 * /api/verify-otp:
 *   post:
 *     summary: Verify OTP and get final JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [otp, tempToken]
 *             properties:
 *               otp:
 *                 type: string
 *               tempToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Returns final JWT token and user data
 *       401:
 *         description: Invalid OTP or expired session
 */
authRouter.post(["/api/verify-otp", "/verify-otp"], async (req, res) => {
  try {
    const { otp, tempToken } = req.body;

    let payload;
    try {
      payload = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ message: "Invalid or expired session" });
    }

    if (payload.purpose !== "2fa")
      return res.status(400).json({ message: "Invalid token purpose" });

    const result = verifyOtp(payload.email, otp);
    if (!result.ok) {
      return res.status(401).json({ message: "Invalid OTP" });
    }

    // Determine subscription status for any user tied to a community
    let subscriptionStatus = "active";
    if (payload.community) {
      try {
        const community = await Community.findById(payload.community).select(
          "subscriptionStatus"
        );
        if (community && community.subscriptionStatus) {
          subscriptionStatus = community.subscriptionStatus;
        }
      } catch (e) {
        console.error("Error fetching community subscription status", e);
      }
    }

    const finalToken = jwt.sign(
      {
        id: payload.id,
        email: payload.email,
        userType: payload.userType,
        community: payload.community ?? null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.cookie("token", finalToken, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });

    return res.json({
      token: finalToken,
      user: {
        id: payload.id,
        email: payload.email,
        userType: payload.userType,
        community: payload.community ?? null,
        subscriptionStatus,
      },
    });
  } catch (err) {
    console.error("/verify-otp error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /api/resend-otp:
 *   post:
 *     summary: Resend OTP for 2FA verification
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [tempToken]
 *             properties:
 *               tempToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP resent successfully
 *       401:
 *         description: Invalid or expired session
 */
authRouter.post(["/api/resend-otp", "/resend-otp"], async (req, res) => {
  try {
    const { tempToken } = req.body;

    let payload;
    try {
      payload = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ message: "Invalid or expired session" });
    }

    if (payload.purpose !== "2fa")
      return res.status(400).json({ message: "Invalid token purpose" });

    await resendOtp(payload.email, {
      username: payload.email,
      userType: payload.userType,
    });
    return res.json({ success: true });
  } catch (err) {
    console.error("/resend-otp error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

/**
 * @swagger
 * /forgot-password:
 *   post:
 *     summary: Request password reset (sends new temp password via email)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, userType]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               userType:
 *                 type: string
 *                 enum: [Resident, Security, Worker, communityManager]
 *     responses:
 *       200:
 *         description: If email exists, a new password is sent
 *       400:
 *         description: Missing fields or invalid email
 *       429:
 *         description: Rate limited
 */
authRouter.post("/forgot-password", forgotPasswordLimiter, async (req, res) => {
  try {
    const { email, userType } = req.body;

    // Validate input
    if (!email || !userType) {
      return res.status(400).json({
        success: false,
        message: "Email and user type are required",
      });
    }

    // Email format validation
    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Import appropriate model based on user type
    const normalizedUserType = String(userType).trim().toLowerCase();
    let UserModel;
    if (normalizedUserType === "resident") {
      UserModel = (await import("../models/resident.js")).default;
    } else if (normalizedUserType === "security") {
      UserModel = (await import("../models/security.js")).default;
    } else if (normalizedUserType === "worker") {
      UserModel = (await import("../models/workers.js")).default;
    } else if (
      normalizedUserType === "communitymanager" ||
      normalizedUserType === "community manager" ||
      normalizedUserType === "community_manager"
    ) {
      UserModel = (await import("../models/cManager.js")).default;
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid user type",
      });
    }

    // Find user by email
    const user = await UserModel.findOne({ email });

    // Security: Don't reveal if email exists or not
    if (!user) {
      console.warn(
        `Forgot password attempt for non-existent email: ${email}, userType: ${userType}`
      );
      return res.json({
        success: true,
        message: "If this email exists, a password reset link has been sent",
      });
    }

    // Generate random secure password (12 characters)
    const newPassword =
      Math.random().toString(36).slice(-10) +
      Math.random().toString(36).slice(-2).toUpperCase();
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const oldPasswordHash = user.password;

    // Update user's password
    user.password = hashedPassword;
    await user.save();

    // Send email with new password (and rollback if email fails)
    try {
      await sendTemporaryPassword(email, newPassword);
    } catch (emailError) {
      user.password = oldPasswordHash;
      await user.save();
      console.error("Forgot password email send failed:", emailError.message);
      return res.status(502).json({
        success: false,
        message:
          "Unable to send reset email right now. Please try again later.",
      });
    }

    console.log(
      `Password reset successful for email: ${email}, userType: ${userType}`
    );

    return res.json({
      success: true,
      message: "Password reset email sent. Please check your inbox.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
});

/**
 * @swagger
 * /api/auth/getUser:
 *   get:
 *     summary: Get currently authenticated user from JWT cookie
 *     tags: [Auth]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Returns user data with subscription status
 *       401:
 *         description: Unauthorized — no valid token
 */
authRouter.get("/api/auth/getUser", auth, cacheRoute(180), async (req, res) => {
  try {
    const data = req.user;
    if (!data) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    let subscriptionStatus = "active";
    let hasStructure = true; // Default to true for non-managers to avoid redirect loops

    if (data.community) {
      try {
        const community = await Community.findById(data.community).select(
          "subscriptionStatus hasStructure"
        ).lean();
        if (community) {
          if (community.subscriptionStatus)
            subscriptionStatus = community.subscriptionStatus;
          if (community.hasStructure !== undefined)
            hasStructure = community.hasStructure;
        }
      } catch (communityErr) {
        console.warn("Error fetching community for getUser:", communityErr?.message);
      }
    }

    return res.json({ user: { ...data, subscriptionStatus, hasStructure } });
  } catch (err) {
    console.error("Error in /api/auth/getUser:", err);
    return res.status(401).json({ message: "Unauthorized" });
  }
});

export default authRouter;
