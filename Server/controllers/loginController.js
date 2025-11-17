import Resident from '../models/resident.js';
import Security from '../models/security.js';
import communityManager from '../models/cManager.js';
import Worker from '../models/workers.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken' 
import Admin from '../models/admin.js';


 async function authenticateUser(model, email, password, res) {
  try {
    const user = await model.findOne({ email });

    if (!user) {
<<<<<<< HEAD
        return 0;
=======
      // No req.flash — just send JSON
      return res.status(401).json({ success: false, message: "Invalid email or password" });
>>>>>>> admin
    }

    // ✅ Compare with existing hash (don’t re-hash the plain password)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
<<<<<<< HEAD
        return 0;
=======
      return res.status(401).json({ success: false, message: "Invalid email or password" });
>>>>>>> admin
    }

    const userType = model.modelName;
    let tokenPayload = { id: user._id, userType, email };

    // Add community info
    if (userType !== "Admin") {
      if (userType === "CommunityManager" && user.assignedCommunity) {
        tokenPayload.community = user.assignedCommunity;
      } else if (user.community) {
        tokenPayload.community = user.community;
      }
    }

    // Sign JWT
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: "7d" });

<<<<<<< HEAD
    console.log(token);
    
    return {token,user};
=======
    // Send JWT as cookie (or optionally in response body)
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "PRODUCTION",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: userType,
        community: tokenPayload.community || null,
      },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
>>>>>>> admin
}

async function AuthenticateR(email, password, req, res) {
    return authenticateUser(Resident, email, password, req, res);
}

async function AuthenticateS(email, password, req, res) {
    return authenticateUser(Security, email, password, req, res);
}

async function AuthenticateW(email, password, req, res) {
    return authenticateUser(Worker, email, password, req, res);
}

async function AuthenticateC(email, password, req, res) {
    return authenticateUser(communityManager, email, password, req, res);
}

 async function AuthenticateA(email, password) {
  const admin = await Admin.findOne({ email });
  if (!admin) return { success: false, message: "Invalid email or password" };

  const isMatch = await bcrypt.compare(password, admin.password);
  if (!isMatch) return { success: false, message: "Invalid email or password" };

  const token = jwt.sign(
    { id: admin._id, role: "Admin", email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return { success: true, token, user: admin };
}

export { AuthenticateR, AuthenticateS, AuthenticateW, AuthenticateC, AuthenticateA };