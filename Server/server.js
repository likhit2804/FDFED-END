import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import session from "express-session";
import mongoose from "mongoose";

import cors from "cors"
import jwt from "jsonwebtoken";


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



app.use("/uploads", express.static("uploads"));

app.use(express.urlencoded({ extended: true }));
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

app.post("/AdminLogin", async (req, res) => {
  console.log("AdminLogin route hit with body:", req.body);
  try {
    const { email, password } = req.body;
    console.log("Extracted email:", email, "password:", password ? "[PROVIDED]" : "[MISSING]");

    const result = await AuthenticateA(email, password, res);
    console.log("AuthenticateA result:", result ? "SUCCESS" : "FAILED");

    if (!result) {
      console.log("Authentication failed - returning 401");
      return res.status(401).json({
        success: false,
        message: "Invalid email or password"
      });
    }

    console.log("Authentication successful - returning success");
    // Cookie is already set by AuthenticateA function
    return res.json({
      success: true,
      user: result.user,
      token: result.token,
      redirect: "/admin/dashboard"
    });

  } catch (error) {
    console.error("Admin login error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    const { email, password, userType } = req.body;
    console.log(email, password, userType);

    let result;

    if (userType === "Resident") result = await AuthenticateR(email, password, res);
    else if (userType === "Security") result = await AuthenticateS(email, password, res);
    else if (userType === "Worker") result = await AuthenticateW(email, password, res);
    else if (userType === "communityManager") result = await AuthenticateC(email, password, res);
    else if (userType === "Admin") result = await AuthenticateA(email, password, res);
    else return res.status(400).json({ message: "Invalid user type" });

    if (!result) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // ✅ STEP 3: Set cookie HERE
    res.cookie("token", result.token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax"
    });

    return res.json({
      token: result.token,
      user: result.user,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  }
});

app.get('/api/auth/getUser', auth, (req, res) => {
  res.json({ user: req.user });
});

// --- Server Start ---
app.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);

});
