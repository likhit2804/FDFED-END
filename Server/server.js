import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import session from "express-session";
import mongoose from "mongoose";
import cors from "cors";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import helmet from "helmet";
import compression from "compression";
import rateLimit from "express-rate-limit";
import morgan from "morgan";

import http from "http";
import { Server } from "socket.io";
import { setIO } from "./utils/socket.js";



import auth from "./controllers/shared/auth.js";
import {
  authorizeR,
  authorizeS,
  authorizeW,
  authorizeC,
  authorizeA,
} from "./controllers/shared/authorization.js";

import {
  VerifyA,
  VerifyC,
  VerifyR,
  VerifyS,
  VerifyW,
} from "./controllers/shared/loginController.js";

import {
  sendLoginOtp,
  verifyOtp,
  resendOtp,
  sendTemporaryPassword,
} from "./utils/otp.js";

import bcrypt from "bcrypt";

import AdminRouter from "./routes/adminRouter.js";
import residentRouter from "./routes/residentRouter.js";
import securityRouter from "./routes/securityRouter.js";
import workerRouter from "./routes/workerRouter.js";
import managerRouter from "./routes/managerRouter.js";
import interestRouter from "./routes/InterestRouter.js";
import leaveRouter from "./routes/leaveRouter.js";


import { interestUploadRouter } from "./controllers/admin/interestForm.js";
import { initializeDefaultPlans } from "./pipelines/communityRegistration/controllers/manager.js";

import Resident from "./models/resident.js";
import Community from "./models/communities.js";
import Block from "./models/blocks.js";
import Flat from "./models/flats.js";
import SystemSettings from "./models/systemSettings.js";

dotenv.config();

const requiredEnvVars = [
  'JWT_SECRET',
  'MONGO_URI1',
  'EMAIL_USER',
  'EMAIL_PASS'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}


if (process.env.JWT_SECRET.length < 32) {
  console.warn('JWT_SECRET should be at least 32 characters long for security');
}

console.log('Environment variables validated successfully');


mongoose
  .connect(process.env.MONGO_URI1)
  .then(() => {
    console.log('✅ Database connected');
    initializeDefaultPlans();
  })
  .catch((err) => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });

const app = express();
const PORT = 3000;

// SOCKET SERVER CREATION
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});


setIO(io);

// helper: extract JWT token from socket handshake (auth, cookies, or query)
function getTokenFromSocketHandshake(socket) {
  // Priority 1: auth object (sent via socket.io-client config)
  if (socket.handshake.auth?.token) {
    return socket.handshake.auth.token;
  }

  // Priority 2: cookies (httpOnly cookie)
  const cookieHeader = socket.handshake.headers?.cookie;
  if (cookieHeader) {
    const tokenCookie = cookieHeader
      .split(";")
      .map((c) => c.trim())
      .find((c) => c.startsWith("token="));

    if (tokenCookie) {
      const token = tokenCookie.split("=")[1];
      if (token && token !== "undefined") return token;
    }
  }

  return null;
}

io.on("connection", (socket) => {
  console.log("🔥 Socket connected:", socket.id);

  try {
    const token = getTokenFromSocketHandshake(socket);
    console.log("🔍 Token extracted:", token ? "✅ Found" : "❌ Not found");

    if (token) {
      const payload = jwt.verify(token, process.env.JWT_SECRET);
      console.log("✅ Token verified. Payload:", {
        id: payload.id,
        email: payload.email,
        userType: payload.userType,
        community: payload.community,
      });

      if (payload.userType === "CommunityManager" && payload.community) {
        const room = `community_${payload.community}`;
        socket.join(room);
        socket.data.communityId = payload.community;
        socket.data.userId = payload.id;
        socket.data.userType = payload.userType;

        console.log(`✅ Manager (${payload.id}) joined room: ${room}`);
      } else if (payload.userType === "Resident") {
        const room = `resident_${payload.id}`;
        socket.join(room);
        socket.data.userId = payload.id;
        socket.data.userType = payload.userType;

        if (payload.community) {
          socket.data.communityId = payload.community;
        }

        console.log(`✅ Resident (${payload.id}) joined room: ${room}`);
      } else if (payload.userType === "Worker") {
        const room = `worker_${payload.id}`;
        socket.join(room);
        socket.data.userId = payload.id;
        socket.data.userType = payload.userType;

        if (payload.community) {
          socket.data.communityId = payload.community;
        }

        console.log(`✅ Worker (${payload.id}) joined room: ${room}`);
      } else if (!payload.community) {
        console.log(`⚠️ No community ID found in token, skipping room join`);
      } else {
        console.log(
          `ℹ️ User type '${payload.userType}' does not have a room mapping`
        );
      }
    } else {
      console.warn("⚠️ No token provided in socket handshake");
    }
  } catch (err) {
    console.warn("❌ Socket auth failed:", err.message);
  }

  socket.on("disconnect", () => {
    console.log("❌ Socket disconnected:", socket.id);
  });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Security & Performance Middleware ---
// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for now to avoid breaking existing app
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false
}));

// Create a write stream for access logs (append mode)
const accessLogStream = fs.createWriteStream(
  path.join(path.dirname(fileURLToPath(import.meta.url)), 'logs', 'access.log'),
  { flags: 'a' }
);

// Morgan: Log to console (dev format - colored, concise)
app.use(morgan('dev'));

// Morgan: Log to file (combined format - detailed, Apache-style)
app.use(morgan('combined', { stream: accessLogStream }));


app.use(compression());

app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());




// Serve uploaded files (advertisements, etc.) as static files with CORS headers
app.use('/uploads', (req, res, next) => {
  // Set CORS headers for all uploads requests (including 304 cached responses)
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Disable caching for development to avoid CORS issues with cached responses
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
}, express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, "Public")));

app.use((req, res, next) => {
  res.setHeader(
    "Cache-Control",
    "no-store, no-cache, must-revalidate, private"
  );
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

import { attachCommunity } from "./middleware/attachCommunity.js";

// ROUTES
app.use("/admin", auth, authorizeA, AdminRouter);
app.use("/resident", auth, authorizeR, attachCommunity, residentRouter);
app.use("/security", auth, authorizeS, attachCommunity, securityRouter);
app.use("/worker", auth, authorizeW, attachCommunity, workerRouter);
app.use("/manager", auth, authorizeC, attachCommunity, managerRouter);
app.use("/leaves", leaveRouter);

app.use("/interest", interestRouter);
app.use("/interest", interestUploadRouter);

// ---------------- RATE LIMITERS FOR AUTH ENDPOINTS ----------------

const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // 5 attempts per window
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    console.warn(`Rate limit exceeded for IP: ${req.ip}`, {
      path: req.path,
      email: req.body?.email
    });
    res.status(429).json({
      success: false,
      message: 'Too many login attempts, please try again after 5 minutes'
    });
  }
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 OTP requests per window
  message: {
    success: false,
    message: 'Too many OTP requests, please try again after 5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ---------------- PUBLIC RESIDENT REGISTRATION (CODE-BASED) ----------------

// POST /resident-register/validate-code
// Resident enters their physical registration code → returns flat + community info
app.post("/resident-register/validate-code", async (req, res) => {
  try {
    const { code: rawCode } = req.body;
    if (!rawCode)
      return res.status(400).json({ success: false, message: "Registration code is required" });

    const code = rawCode.trim().toLowerCase();

    // Find the flat that owns this code (case-insensitive) and populate related info
    const foundFlat = await Flat.findOne({
      registrationCode: new RegExp(`^${code}$`, 'i')
    }).populate("community block");

    if (!foundFlat)
      return res.status(404).json({ success: false, message: "Invalid or already-used registration code" });

    if (foundFlat.status !== "Vacant")
      return res.status(400).json({ success: false, message: "This code is no longer valid (flat already occupied)" });

    return res.json({
      success: true,
      data: {
        communityId: foundFlat.community._id,
        communityName: foundFlat.community.name,
        block: foundFlat.block.name,
        flatNumber: foundFlat.flatNumber,
        floor: foundFlat.floor,
        registrationCode: code
      }
    });
  } catch (err) {
    console.error("[VALIDATE-CODE] Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// POST /resident-register/complete
// Accepts code + personal details → creates resident, links to flat, marks Occupied
app.post("/resident-register/complete", async (req, res) => {
  try {
    const { residentFirstname, residentLastname, contact, email, registrationCode: rawCode } = req.body;

    if (!residentFirstname || !residentLastname || !email || !rawCode)
      return res.status(400).json({ success: false, message: "Missing required fields" });

    const registrationCode = rawCode.trim().toLowerCase();

    // Re-validate the code (case-insensitive) against the Flat model
    const foundFlat = await Flat.findOne({
      registrationCode: new RegExp(`^${registrationCode}$`, 'i')
    }).populate("community");

    if (!foundFlat)
      return res.status(404).json({ success: false, message: "Invalid or already-used registration code" });

    if (foundFlat.status !== "Vacant")
      return res.status(400).json({ success: false, message: "Code is no longer valid" });

    const community = foundFlat.community;

    // Check email uniqueness
    const existing = await Resident.findOne({ email });
    if (existing && existing.password)
      return res.status(409).json({ success: false, message: "An account with this email already exists" });

    // Create resident
    const tempPassword = Math.random().toString(36).slice(-10);
    const hashed = await bcrypt.hash(tempPassword, 12);

    const resident = new Resident({
      residentFirstname,
      residentLastname,
      uCode: foundFlat.flatNumber,
      contact: contact || "",
      email,
      community: community._id,
      password: hashed,
    });
    await resident.save();

    // Link flat to resident, mark Occupied, clear the code
    foundFlat.residentId = resident._id;
    foundFlat.status = "Occupied";
    foundFlat.registrationCode = undefined;

    // Save the flat directly
    await foundFlat.save();

    await sendTemporaryPassword(email, tempPassword);

    return res.json({
      success: true,
      message: "Registration complete! Temporary password sent to your email.",
      residentId: resident._id,
    });
  } catch (err) {
    console.error("[COMPLETE-REGISTER] Error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// --- Logout route for all users (clears auth cookie) ---
app.post("/logout", (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return res.status(200).json({ success: true, message: "Logged out" });
  } catch (err) {
    console.error("Logout error:", err);
    return res.status(500).json({ success: false, message: "Logout failed" });
  }
});

// ---------------- ADMIN LOGIN (2FA) ----------------
app.post("/AdminLogin", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    const verified = await VerifyA(email, password);
    if (!verified) {
      console.log('Admin login failed for', email, { ip: req.ip });
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Send OTP for 2FA
    await sendLoginOtp(email);

    // Create a temp token for OTP verification
    const tempToken = jwt.sign(
      { ...verified.userPayload, purpose: "2fa" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({ requiresOtp: true, user: verified.userPayload, tempToken });
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});


// ---------------- USER LOGIN (2FA) ----------------

app.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password, userType } = req.body;


    let verified;
    if (userType === "Resident") verified = await VerifyR(email, password);
    else if (userType === "Security") verified = await VerifyS(email, password);
    else if (userType === "Worker") verified = await VerifyW(email, password);
    else if (userType === "communityManager") {
      console.log(email, password, userType);
      verified = await VerifyC(email, password);
    }
    else if (userType === "Admin")
      verified = await VerifyA(email, password);
    else return res.status(400).json({ message: "Invalid user type" });

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
        sameSite: "lax",
      });

      return res.json({
        requiresOtp: false,
        token: finalToken,
        user: { ...verified.userPayload, subscriptionStatus: "active" }, // Simplified
      });
    }

    await sendLoginOtp(email);

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

// ---------------- OTP VERIFY ----------------

app.post("/verify-otp", async (req, res) => {
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
      sameSite: "lax",
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

// ---------------- RESEND OTP ----------------

app.post("/resend-otp", async (req, res) => {
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

    await resendOtp(payload.email);
    return res.json({ success: true });
  } catch (err) {
    console.error("/resend-otp error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ---------------- FORGOT PASSWORD ----------------

const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // 3 attempts per window
  message: {
    success: false,
    message: 'Too many password reset requests, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    console.warn(`Forgot password rate limit exceeded for IP: ${req.ip}`, {
      email: req.body?.email
    });
    res.status(429).json({
      success: false,
      message: 'Too many password reset requests, please try again after 15 minutes'
    });
  }
});

app.post("/forgot-password", forgotPasswordLimiter, async (req, res) => {
  try {
    const { email, userType } = req.body;

    // Validate input
    if (!email || !userType) {
      return res.status(400).json({
        success: false,
        message: "Email and user type are required"
      });
    }

    // Email format validation
    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format"
      });
    }

    // Import appropriate model based on user type
    let UserModel;
    if (userType === 'Resident') {
      UserModel = (await import('./models/resident.js')).default;
    } else if (userType === 'Security') {
      UserModel = (await import('./models/security.js')).default;
    } else if (userType === 'Worker') {
      UserModel = (await import('./models/workers.js')).default;
    } else if (userType === 'communityManager' || userType === 'CommunityManager') {
      UserModel = (await import('./models/cManager.js')).default;
    } else {
      return res.status(400).json({
        success: false,
        message: "Invalid user type"
      });
    }

    // Find user by email
    const user = await UserModel.findOne({ email });

    // Security: Don't reveal if email exists or not
    // Always return success to prevent user enumeration
    if (!user) {
      console.warn(`Forgot password attempt for non-existent email: ${email}, userType: ${userType}`);
      // Return success even if user doesn't exist (security best practice)
      return res.json({
        success: true,
        message: "If this email exists, a password reset link has been sent"
      });
    }

    // Generate random secure password (12 characters)
    const newPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-2).toUpperCase();
    console.log('🔑 Generated new password:', newPassword); // DEBUG
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    console.log('🔒 Hashed password:', hashedPassword); // DEBUG

    // Update user's password
    user.password = hashedPassword;
    await user.save();
    console.log('✅ Password saved to database for user:', email); // DEBUG

    // Send email with new password
    await sendTemporaryPassword(email, newPassword);

    console.log(`Password reset successful for email: ${email}, userType: ${userType}`);

    return res.json({
      success: true,
      message: "Password reset email sent. Please check your inbox."
    });

  } catch (err) {
    console.error("Forgot password error:", err);

    return res.status(500).json({
      success: false,
      message: "Server error. Please try again later."
    });
  }
});


// ---------------- AUTH CHECK ----------------

app.get("/api/auth/getUser", auth, async (req, res) => {
  const cookie = req.cookies.token;

  try {
    const data = jwt.verify(cookie, process.env.JWT_SECRET);

    // Fetch subscription status for any user associated with a community
    // Fetch subscription and structure status for any user associated with a community
    let subscriptionStatus = "active";
    let hasStructure = true; // Default to true for non-managers to avoid redirect loops

    if (data.community) {
      const community = await Community.findById(data.community).select(
        "subscriptionStatus hasStructure"
      );
      if (community) {
        if (community.subscriptionStatus) subscriptionStatus = community.subscriptionStatus;
        if (community.hasStructure !== undefined) hasStructure = community.hasStructure;
      }
    }

    return res.json({ user: { ...data, subscriptionStatus, hasStructure } });
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized" });
  }
});

// ---------------- SERVE STATIC FRONTEND (PRODUCTION PIPELINE) ----------------

// Serve the React Vite build files from the Client/dist directory
app.use(express.static(path.join(__dirname, "../Client/dist")));

// Catch-all route to serve the React index.html for unknown routes
// This delegates routing back to React Router in the browser
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../Client/dist/index.html"));
});

// ---------------- START SERVER WITH SOCKET.IO ----------------

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
