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
import searchRouter from "./routes/searchRouter.js";
import b2bRouter from "./routes/b2bRouter.js";
import { cacheRoute, clearAllCache, getCacheStats } from "./middleware/cacheMiddleware.js";


import { interestUploadRouter } from "./controllers/admin/interestForm.js";
import { initializeDefaultPlans } from "./pipelines/communityRegistration/controllers/manager.js";
import { apiKeyAuth } from "./middleware/apiKeyAuth.js";

import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './configs/swaggerConfig.js';
import { isRedisReady } from "./configs/redisClient.js";

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
const PORT = Number(process.env.PORT) || 3000;

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
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const CLIENT_DIST_PATH = path.join(__dirname, "../Client/dist");
const CLIENT_INDEX_PATH = path.join(CLIENT_DIST_PATH, "index.html");

// --- Security & Performance Middleware ---
// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable for now to avoid breaking existing app
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: false,
  // Keep COOP compatible with payment popups.
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  originAgentCluster: false,
}));

// Force popup-friendly COOP in case hosting/proxy layers alter defaults.
app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

// Create access log directory/stream safely for fresh environments.
const accessLogDir = path.join(__dirname, "logs");
fs.mkdirSync(accessLogDir, { recursive: true });
const accessLogStream = fs.createWriteStream(
  path.join(accessLogDir, "access.log"),
  { flags: "a" }
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

const allowedOrigins = [
  "http://localhost:5173", 
  "https://urbanease-client.onrender.com" // Your live frontend URL!
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
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

  if (!IS_PRODUCTION) {
    // Disable caching in development to avoid stale local file issues.
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  } else {
    // Allow short-lived caching in production for uploaded assets.
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
}, express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, "Public")));

const NO_STORE_PATH_PREFIXES = [
  "/api",
  "/admin",
  "/resident",
  "/security",
  "/worker",
  "/manager",
  "/leaves",
  "/interest",
  "/resident-register",
];

function shouldDisableResponseCache(req) {
  if (req.method !== "GET") return true;
  const pathname = req.path || "";
  if (pathname === "/login" || pathname === "/logout" || pathname === "/forgot-password") {
    return true;
  }
  return NO_STORE_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

app.use((req, res, next) => {
  if (shouldDisableResponseCache(req)) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  next();
});

import { attachCommunity } from "./middleware/attachCommunity.js";

// SWAGGER API DOCS (mounted before auth routes so it's publicly accessible)
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'UrbanEase API Docs',
}));
app.get('/api-docs.json', (req, res) => res.json(swaggerSpec));

// Redis cache diagnostics for end-review validation.
/**
 * @swagger
 * /api/cache/stats:
 *   get:
 *     summary: Get Redis cache diagnostics
 *     tags: [Admin - Dashboard]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Cache stats with redis readiness and hit rate
 */
app.get("/api/cache/stats", auth, authorizeA, (req, res) => {
  return res.json({
    success: true,
    redisReady: isRedisReady(),
    stats: getCacheStats(),
  });
});

/**
 * @swagger
 * /api/cache/clear:
 *   post:
 *     summary: Clear all Redis response-cache keys
 *     tags: [Admin - Dashboard]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Cache cleared and metrics reset
 */
app.post("/api/cache/clear", auth, authorizeA, async (req, res) => {
  const deletedKeys = await clearAllCache();
  return res.json({
    success: true,
    redisReady: isRedisReady(),
    deletedKeys,
    message: "Cache cleared successfully",
  });
});

// ROUTES
app.use("/admin", auth, authorizeA, AdminRouter);
app.use("/resident", auth, authorizeR, attachCommunity, residentRouter);
app.use("/security", auth, authorizeS, attachCommunity, securityRouter);
app.use("/worker", auth, authorizeW, attachCommunity, workerRouter);
app.use("/manager", auth, authorizeC, attachCommunity, managerRouter);
app.use("/leaves", leaveRouter);

app.use("/interest", interestRouter);
app.use("/interest", interestUploadRouter);
app.use("/api/search", auth, searchRouter); // full-text search across issues, communities, residents
app.use("/api/v1", apiKeyAuth, b2bRouter);

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
  windowMs: 10 * 60 * 1000, // 5 minutes
  max: 3, // 3 OTP requests per window
  message: {
    success: false,
    message: 'Too many OTP requests, please try again after 5 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ---------------- PUBLIC RESIDENT REGISTRATION (CODE-BASED) ----------------

/**
 * @swagger
 * /resident-register/validate-code:
 *   post:
 *     summary: Validate a resident registration code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code]
 *             properties:
 *               code:
 *                 type: string
 *                 example: "abc123"
 *     responses:
 *       200:
 *         description: Valid code — returns community and flat info
 *       404:
 *         description: Invalid or already-used code
 *       400:
 *         description: Flat already occupied
 */
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

/**
 * @swagger
 * /resident-register/complete:
 *   post:
 *     summary: Complete resident registration with code + personal details
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [residentFirstname, residentLastname, email, registrationCode]
 *             properties:
 *               residentFirstname:
 *                 type: string
 *               residentLastname:
 *                 type: string
 *               contact:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               registrationCode:
 *                 type: string
 *     responses:
 *       200:
 *         description: Registration complete, temporary password emailed
 *       404:
 *         description: Invalid registration code
 *       409:
 *         description: Email already exists
 */
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
app.post("/api/AdminLogin", authLimiter, async (req, res) => {
  console.log("HIT /api/AdminLogin route", req.body);
  try {
    const { email, password } = req.body;
    const verified = await VerifyA(email, password);
    console.log("VerifyA result:", !!verified);

    if (!verified) {
      console.log('Admin login failed for', email, { ip: req.ip });
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
app.post("/api/verify-otp", async (req, res) => {
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
app.post("/api/resend-otp", async (req, res) => {
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
app.get("/api/auth/getUser", auth, cacheRoute(180), async (req, res) => {
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
app.use(
  express.static(CLIENT_DIST_PATH, {
    etag: true,
    maxAge: IS_PRODUCTION ? "1y" : 0,
    immutable: IS_PRODUCTION,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith("index.html")) {
        res.setHeader("Cache-Control", "no-cache");
      }
    },
  })
);

// Catch-all route to serve the React index.html for unknown routes
// This delegates routing back to React Router in the browser
app.get(/.*/, (req, res) => {
  res.setHeader("Cache-Control", "no-cache");
  res.sendFile(CLIENT_INDEX_PATH);
});

// ---------------- START SERVER WITH SOCKET.IO ----------------

server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
