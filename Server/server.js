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
  VerifyC,
  VerifyR,
  VerifyS,
  VerifyW,
} from "./controllers/loginController.js";
import { sendLoginOtp, verifyOtp, resendOtp } from "./utils/otp.js";

import AdminRouter from "./routes/adminRouter.js";
import residentRouter from "./routes/residentRouter.js";
import securityRouter from "./routes/securityRouter.js";
import workerRouter from "./routes/workerRouter.js";
import managerRouter from "./routes/managerRouter.js";
import interestRouter from "./routes/InterestRouter.js";
import Ad from "./models/Ad.js";
import { interestUploadRouter } from './controllers/interestForm.js';

dotenv.config();

// --- DB Connection ---
mongoose.connect(process.env.MONGO_URI1)
  .then(() => console.log(" Database connected"))
  .catch(err => console.error(" Database connection failed:", err));

const app = express();
const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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




app.use(express.static(path.join(__dirname, "Public")));

app.use(cookieParser());
app.use("/uploads", express.static("uploads"));
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



app.use("/admin", auth, authorizeA, AdminRouter);
app.use("/resident", auth, authorizeR, residentRouter);
app.use("/security", auth, authorizeS, securityRouter);
app.use("/worker", auth, authorizeW, workerRouter);
app.use("/manager", auth, authorizeC, managerRouter);


app.use("/interest", interestRouter);
app.use('/interest', interestUploadRouter);



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
        message: "Invalid email or password",
      });
    }


    // Set cookie so Admin pages can use auth middleware
    res.cookie("token", result.token, {
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    });

    // 🔥 VERY IMPORTANT:
    // AdminLogin.jsx expects JSON, NOT HTML redirect

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
      message: "Server error",
    });
  }
});


app.get("/ads", auth, async (req, res) => {
  try {
    const communityId = req.user && req.user.community;
    if (!communityId) {
      return res
        .status(400)
        .json({ success: false, message: "Community not found on user" });
    }



    const ads = await Ad.find({ community: communityId,status: "Active" })
      .select("_id title imagePath link status startDate endDate")
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ success: true, ads });
  } catch (err) {
    console.error("Error fetching ads for /ads:", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch ads" });
  }
});


// Start 2FA login: verify credentials, send OTP, return temp token
app.post("/login", async (req, res) => {
  try {
    const { email, password, userType } = req.body;
    if (!email || !password || !userType) {
      return res.status(400).json({ message: "Missing credentials" });
    }

    let verified;
    if (userType === "Resident") verified = await VerifyR(email, password);
    else if (userType === "Security") verified = await VerifyS(email, password);
    else if (userType === "Worker") verified = await VerifyW(email, password);
    else if (userType === "communityManager") verified = await VerifyC(email, password);
    else if (userType === "Admin") {
      // Admin can keep direct login using existing route /AdminLogin
      return res.status(400).json({ message: "Use /AdminLogin for admin" });
    } else return res.status(400).json({ message: "Invalid user type" });

    if (!verified) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    await sendLoginOtp(email);

    const tempToken = jwt.sign(
      { ...verified.userPayload, purpose: "2fa" },
      process.env.JWT_SECRET,
      { expiresIn: "10m" }
    );

    return res.json({ requiresOtp: true, tempToken });
  } catch (err) {
    console.error("/login error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Complete 2FA: verify OTP, then issue JWT cookie and return user
app.post("/verify-otp", async (req, res) => {
  try {
    const { otp, tempToken } = req.body;
    if (!otp || !tempToken) {
      return res.status(400).json({ message: "Missing OTP or token" });
    }

    let payload;
    try {
      payload = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ message: "Invalid or expired session" });
    }

    if (payload.purpose !== "2fa") {
      return res.status(400).json({ message: "Invalid token purpose" });
    }

    const result = verifyOtp(payload.email, otp);
    if (!result.ok) {
      const reasonMap = {
        expired: "OTP expired",
        mismatch: "Invalid OTP",
        not_found: "No OTP found",
        too_many_attempts: "Too many attempts",
      };
      return res.status(401).json({ message: reasonMap[result.reason] || "OTP error" });
    }

    // Issue final JWT and cookie
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
      },
    });
  } catch (err) {
    console.error("/verify-otp error", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// Resend OTP during 2FA window
app.post("/resend-otp", async (req, res) => {
  try {
    const { tempToken } = req.body;
    if (!tempToken) return res.status(400).json({ message: "Missing token" });

    let payload;
    try {
      payload = jwt.verify(tempToken, process.env.JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ message: "Invalid or expired session" });
    }

    if (payload.purpose !== "2fa") {
      return res.status(400).json({ message: "Invalid token purpose" });
    }

    await resendOtp(payload.email);
    return res.json({ success: true });
  } catch (err) {
    console.error("/resend-otp error", err);
    return res.status(500).json({ message: "Server error" });
  }
});


app.get("/api/auth/getUser", auth, async (req, res) => {
  const cookie = req.cookies.token;

  console.log("token at getUser : ", cookie);

  console.log("checking for user");

  try {
    const data = await jwt.verify(cookie, process.env.JWT_SECRET);
    console.log(data);

    return res.json({ user: data });
  } catch (err) {
    console.log(err);
    return res.status(401).json({ message: "Unauthorized" });
  }
});


async function changeAdStatuses() {
  try {
    const ads = await Ad.find({});
    const now = new Date();
    for (let ad of ads) {
      let newStatus = ad.status;
      if (ad.startDate <= now && now <= ad.endDate) {
        newStatus = "Active";
      } else if (now < ad.startDate) {
        newStatus = "Pending";
      } else if (now > ad.endDate) {
        newStatus = "Expired";
      }
      if (ad.status !== newStatus) {
        ad.status = newStatus;
        await ad.save();
      }
    }
  } catch (err) {
    console.error("Error changing ad statuses:", err);
  }
}

setInterval(changeAdStatuses, 60*60 * 1000); // Run every hour

app.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);

});