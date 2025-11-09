import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import multer from "multer";

import auth from "./controllers/auth.js";
import {
  authorizeR,
  authorizeS,
  authorizeW,
  authorizeC,
  authorizeA,
} from "./controllers/authorization.js";

import {
  AuthenticateC,
  AuthenticateR,
  AuthenticateS,
  AuthenticateW,
  AuthenticateA,
} from "./controllers/loginController.js";

import AdminRouter from "./routes/adminRouter.js";
import residentRouter from "./routes/residentRouter.js";
import securityRouter from "./routes/securityRouter.js";
import workerRouter from "./routes/workerRouter.js";
import managerRouter from "./routes/managerRouter.js";
import interestRouter from "./routes/InterestRouter.js";
import Ad from "./models/Ad.js";

dotenv.config();

// --- DB Connection ---
mongoose.connect(process.env.MONGO_URI1)
  .then(() => console.log(" Database connected"))
  .catch(err => console.error(" Database connection failed:", err));

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Middleware ---
app.use(session({
  secret: "your-secret-key",
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false },
}));

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));
app.use(express.static(path.join(__dirname, "Public")));

app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  next();
});

// --- Routes ---
app.use("/admin", auth, authorizeA, AdminRouter);
app.use("/resident", auth, authorizeR, residentRouter);
app.use("/security", auth, authorizeS, securityRouter);
app.use("/worker", auth, authorizeW, workerRouter);
app.use("/manager", auth, authorizeC, managerRouter);
app.use("/interest", interestRouter);

// --- Login routes ---
app.post("/AdminLogin", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Admin login attempt:", req.body);

    const result = await AuthenticateA(email, password, req, res);

    if (result) {
      return res.status(200).json({ redirect: "/admin" });
    } else {
      return res.status(401).json({ error: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({ error: "Server error during login" });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password, userType } = req.body;
    console.log("Login attempt:", req.body);

    let result;
    let redirect;

    switch (userType) {
      case "Resident":
        result = await AuthenticateR(email, password, req, res);
        redirect = "/resident/dashboard";
        break;

      case "Security":
        result = await AuthenticateS(email, password, req, res);
        redirect = "/security/dashboard";
        break;

      case "Worker":
        result = await AuthenticateW(email, password, req, res);
        redirect = "/worker/dashboard";
        break;

      case "communityManager":
        result = await AuthenticateC(email, password, req, res);
        redirect = "/manager/dashboard";
        break;

      default:
        return res.status(400).json({ error: "Invalid user type" });
    }

    if (result) {
      return res.status(200).json({ redirect });
    } else {
      return res.status(401).json({ error: "Invalid credentials" });
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ error: "Server error" });
  }
});

app.get("/logout", (req, res) => {
  const token = req.cookies.token;
  if (token) res.clearCookie("token");
  return res.status(200).json({ message: "Logged out successfully" });
});

// --- Server Start ---
app.listen(PORT, async () => {
  const ads = await Ad.find({});
  for (const ad of ads) {
    const now = new Date();
    const endDate = new Date(ad.endDate);
    if (now < endDate) ad.status = "active";
    else ad.status = "expired";
    await ad.save();
  }
  console.log(` Server running at http://localhost:${PORT}`);
});
