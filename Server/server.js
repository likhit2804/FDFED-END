import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import session from "express-session";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import http from "http";
import { Server } from "socket.io";
import swaggerUi from "swagger-ui-express";

import { setIO } from "./utils/socket.js";
import { initSocketHandlers } from "./utils/socketHandler.js";
import { initializeDefaultPlans } from "./pipelines/communityRegistration/controllers/manager.js";
import swaggerSpec from "./configs/swaggerConfig.js";

// Middleware
import auth from "./controllers/shared/auth.js";
import {
  authorizeR,
  authorizeS,
  authorizeW,
  authorizeC,
  authorizeA
} from "./controllers/shared/authorization.js";
import { attachCommunity } from "./middleware/attachCommunity.js";
import { apiKeyAuth } from "./middleware/apiKeyAuth.js";

// Routers
import authRouter from "./routes/authRouter.js";
import residentRegisterRouter from "./routes/residentRegisterRouter.js";
import cacheRouter from "./routes/cacheRouter.js";
import AdminRouter from "./routes/adminRouter.js";
import residentRouter from "./routes/residentRouter.js";
import securityRouter from "./routes/securityRouter.js";
import workerRouter from "./routes/workerRouter.js";
import managerRouter from "./routes/managerRouter.js";
import interestRouter from "./routes/InterestRouter.js";
import { interestUploadRouter } from "./controllers/admin/interestForm.js";
import leaveRouter from "./routes/leaveRouter.js";
import searchRouter from "./routes/searchRouter.js";
import b2bRouter from "./routes/b2bRouter.js";

dotenv.config();

// ---------------- ENVIRONMENT VALIDATION ----------------
const requiredEnvVars = ["JWT_SECRET", "MONGO_URI1", "EMAIL_USER", "EMAIL_PASS"];
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

if (process.env.JWT_SECRET.length < 32) {
  console.warn("JWT_SECRET should be at least 32 characters long for security");
}

console.log("Environment variables validated successfully");

// ---------------- DATABASE CONNECTION ----------------
mongoose
  .connect(process.env.MONGO_URI1)
  .then(() => {
    console.log("✅ Database connected");
    initializeDefaultPlans();
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  });

// ---------------- ORIGIN CONFIGURATION ----------------
const normalizeOrigin = (value) => {
  if (!value) return "";
  try {
    const url = new URL(String(value).trim());
    return `${url.protocol}//${url.host}`;
  } catch {
    return "";
  }
};

const allowedOrigins = Array.from(
  new Set(
    [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:3000",
      "http://127.0.0.1:5173",
      "http://127.0.0.1:5174",
      "http://127.0.0.1:5175",
      "http://127.0.0.1:3000",
      "https://urbanease-client.onrender.com",
      "https://urbaneasefinal.onrender.com",
      normalizeOrigin(process.env.CLIENT_BASE_URL),
      normalizeOrigin(process.env.FRONTEND_URL),
      normalizeOrigin(process.env.APP_BASE_URL),
    ].filter(Boolean)
  )
);

const isOriginAllowed = (origin) => {
  if (!origin) return true;
  if (allowedOrigins.includes(origin)) return true;
  try {
    const parsed = new URL(origin);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      return true;
    }
  } catch {}
  return false;
};

// ---------------- APP & SOCKET INITIALIZATION ----------------
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Socket CORS origin not allowed"));
      }
    },
    credentials: true,
  },
});

setIO(io);
initSocketHandlers(io);

// ---------------- PATH CONFIGURATIONS ----------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const CLIENT_DIST_PATH = path.join(__dirname, "../Client/dist");
const CLIENT_INDEX_PATH = path.join(CLIENT_DIST_PATH, "index.html");

// ---------------- CORE MIDDLEWARE ----------------
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    originAgentCluster: false,
  })
);

app.use((req, res, next) => {
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  next();
});

const accessLogDir = path.join(__dirname, "logs");
fs.mkdirSync(accessLogDir, { recursive: true });
const accessLogStream = fs.createWriteStream(path.join(accessLogDir, "access.log"), {
  flags: "a",
});

app.use(morgan("dev"));
app.use(morgan("combined", { stream: accessLogStream }));
app.use(compression());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "urban-ease-session-secret",
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: IS_PRODUCTION,
      sameSite: IS_PRODUCTION ? "none" : "lax",
    },
  })
);

app.use(
  cors({
    origin: function (origin, callback) {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Static uploads with CORS headers
app.use(
  "/uploads",
  (req, res, next) => {
    const requestOrigin = req.headers.origin;
    const matchedOrigin =
      requestOrigin && allowedOrigins.includes(requestOrigin)
        ? requestOrigin
        : allowedOrigins[0];

    res.setHeader("Access-Control-Allow-Origin", matchedOrigin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (!IS_PRODUCTION) {
      res.setHeader(
        "Cache-Control",
        "no-store, no-cache, must-revalidate, proxy-revalidate"
      );
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
    } else {
      res.setHeader("Cache-Control", "public, max-age=3600");
    }

    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  },
  express.static(path.join(__dirname, "uploads"))
);

app.use(express.static(path.join(__dirname, "Public")));

// API Cache headers middleware
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
  return NO_STORE_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

app.use((req, res, next) => {
  if (shouldDisableResponseCache(req)) {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  next();
});

// ---------------- SWAGGER DOCUMENTATION ----------------
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "UrbanEase API Docs",
  })
);
app.get("/api-docs.json", (req, res) => res.json(swaggerSpec));

// ---------------- ROUTER MOUNTS ----------------
app.use("/", authRouter);
app.use("/resident-register", residentRegisterRouter);
app.use("/api/cache", cacheRouter);

app.use("/admin", auth, authorizeA, AdminRouter);
app.use("/resident", auth, authorizeR, attachCommunity, residentRouter);
app.use("/security", auth, authorizeS, attachCommunity, securityRouter);
app.use("/worker", auth, authorizeW, attachCommunity, workerRouter);
app.use("/manager", auth, authorizeC, attachCommunity, managerRouter);

app.use("/leaves", leaveRouter);
app.use("/interest", interestRouter);
app.use("/interest", interestUploadRouter);
app.use("/api/search", auth, searchRouter);
app.use("/api/v1", apiKeyAuth, b2bRouter);

// ---------------- SERVE STATIC FRONTEND (PRODUCTION) ----------------
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

app.get(/.*/, (req, res) => {
  res.setHeader("Cache-Control", "no-cache");
  if (fs.existsSync(CLIENT_INDEX_PATH)) {
    res.sendFile(CLIENT_INDEX_PATH);
  } else {
    res.status(503).send("Frontend build not found. Run 'npm run build' first.");
  }
});

// ---------------- START SERVER ----------------
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
