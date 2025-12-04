import express from "express";
const securityRouter = express.Router();

import Security from "../models/security.js";
import VisitorPreApproval from "../models/preapproval.js";
import auth from "../controllers/auth.js";
import { authorizeS } from "../controllers/authorization.js";
import Ad from "../models/Ad.js";

import visitor from "../models/visitors.js";

import mongoose from "mongoose";

import multer from "multer";
import bcrypt from "bcrypt";

import { getDashboardInfo, UpdatePreApprovalData } from "../controllers/Security.js";
import Visitor from "../models/visitors.js";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "=profImg.png";
    cb(null, uniqueName);
  },
});
const upload = multer({ storage: storage });

function generateCustomID(userEmail, facility, countOrRandom = null) {
  const id = userEmail.toUpperCase().slice(0, 2);
  const facilityCode = facility.toUpperCase().slice(0, 2);
  const suffix = countOrRandom
    ? String(countOrRandom).padStart(4, "0")
    : String(Math.floor(1000 + Math.random() * 9000));
  return `UE-${id}${facilityCode}${suffix}`;
}

// securityRouter.get("/addVisitor", (req, res) => {
//   res.render("security/addV", { path: "aw" });
// });

securityRouter.post("/addVisitor", async (req, res) => {
  const {
    visitorType,
    fullName,
    contact,

    email,

    vehicleNo,
  } = req.body;


  const tempId = new mongoose.Types.ObjectId();
  const uniqueId = generateCustomID(tempId.toString(), "PA", null);
  console.log(uniqueId);
  try {
    const v = await visitor.create({
      ID: uniqueId,
      name: fullName,
      contactNumber: contact,
      purpose: visitorType,
      vehicleNumber: vehicleNo,
      email,
      addedBy: req.user.id,
      community: req.user.community,
    });
    console.log("visitor entered");
    return res.json({ success: true, message: "Visitor added successfully", visitor: v });
  } catch (err) {
    console.log(err);
  }


});

securityRouter.get("/dashboard", (req, res) => {
  return res.json({
    success: true,
    message: "Security dashboard base route OK",
  });
});

// API route your React fetches
securityRouter.get("/dashboard/api", getDashboardInfo);

// securityRouter.get("/preApproval", async (req, res) => {
//   const pa = await Visitor.find({
//     community: req.user.community,
//   }).populate("approvedBy");


//   console.log(pa);


//   const ads = await Ad.find({ community: req.user.community, startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });




//   // res.render("security/preApproval", { path: "pa", pa, ads });
// });
securityRouter.get("/preApproval", async (req, res) => {
  try {
    const pa = await Visitor.find({
      community: req.user.community,
    }).populate("approvedBy");

    const ads = await Ad.find({
      community: req.user.community,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    return res.json({
      success: true,
      preApprovalList: pa,
      ads,
    });

  } catch (err) {
    console.error("PreApproval fetch error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error loading pre-approval data",
    });
  }
});



securityRouter.post("/preApproval/action", UpdatePreApprovalData);

// securityRouter.post("/preApproval/action", async (req, res) => {
//   try {
//     const {
//       name,
//       contact,
//       requestedBy,
//       purpose,
//       date,
//       vehicleNumber,
//       ID,
//       status,
//     } = req.body;

//     console.log("Visitor ID received:", ID);

//     // Validate ObjectId format first
//     if (!mongoose.Types.ObjectId.isValid(ID)) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Invalid visitor ID" });
//     }

//     // Fetch the visitor record
//     const vis = await Visitor.findById(ID).populate('approvedBy');
//     if (!vis) {
//       return res
//         .status(404)
//         .json({ success: false, message: "Visitor not found" });
//     }

//     vis.status = status; 
//     vis.isCheckedIn = status === "Approved";
//     vis.vehicleNumber = vehicleNumber; 

//     vis.approvedBy.notifications.push({
//       n:Pre approved Visitor ${vis.ID} is ${vis.status},
//       createdAt:new Date(Date.now()),
//       belongs:"PA"
//     });

//     await vis.approvedBy.save();
//     await vis.save();

//     console.log("status of visitor : ",vis.status);


//     // if(vis.status === "Approved"){
//     //   const v = await Visitor.create({
//     //   name: vis.name,
//     //   contactNumber: vis.contactNumber,
//     //   email: vis.email,
//     //   purpose: vis.purpose,
//     //   checkInAt : new Date(Date.now()),
//     //   vehicleNumber:vehicleNumber,
//     //   verifiedByResident:true,
//     //   community : req.user.community,
//     //   addedBy:req.user.id,
//     //   status:"Active",
//     // });
//     // console.log("new visitor by preapproval : "+ v);

//     // }

//     res.status(200).json({
//       success: true,
//       message: Visitor ${status.toLowerCase()} successfully,
//     });
//   } catch (error) {
//     console.error("Error updating visitor status:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// });



// securityRouter.get("/visitorManagement", async (req, res) => {
//   const visitors = await visitor.find({
//     community: req.user.community,
//     addedBy: req.user.id,
//   });

//   const ads = await Ad.find({ community: req.user.community, startDate: { $lte: new Date() }, endDate: { $gte: new Date() } });



//   console.log(ads);

//   visitors.sort((a, b) => {
//     const dateTimeA = new Date(a.entryDate);
//     const dateTimeB = new Date(b.entryDate);

//     return dateTimeB - dateTimeA;
//   });


//   console.log(visitors);

//   // res.render("security/VisitorManagement", { path: "vm", visitors, ads });
// });
securityRouter.get("/visitorManagement", async (req, res) => {
  try {
    const visitors = await visitor.find({
      community: req.user.community,
      addedBy: req.user.id,
    });

    visitors.sort((a, b) => new Date(b.entryDate || b.createdAt) - new Date(a.entryDate || a.createdAt));

    const ads = await Ad.find({
      community: req.user.community,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() },
    });

    return res.json({
      success: true,
      visitors,
      ads
    });

  } catch (err) {
    console.error("VisitorManagement error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error loading visitor data",
    });
  }
});


// API endpoint to fetch updated visitor data for auto-refresh

securityRouter.get("/visitorManagement/api/visitors", async (req, res) => {
  try {
    const visitors = await visitor.find({
      community: req.user.community,
      addedBy: req.user.id,
    });

    // Sort visitors by entry date (newest first)
    visitors.sort((a, b) => {
      const dateTimeA = new Date(a.entryDate || a.createdAt);
      const dateTimeB = new Date(b.entryDate || b.createdAt);
      return dateTimeB - dateTimeA;
    });

    // Calculate stats
    const stats = {
      total: visitors.length,
      active: visitors.filter(v => v.status === 'Active').length,
      checkedOut: visitors.filter(v => v.status === 'CheckedOut').length,
      pending: visitors.filter(v => v.status === 'Pending').length
    };

    res.json({
      success: true,
      visitors,
      stats
    });
  } catch (error) {
    console.error("Error fetching visitors:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching visitor data"
    });
  }
});

securityRouter.get("/visitorManagement/:action/:id", async (req, res) => {
  const { action, id } = req.params;

  console.log(action, id);

  try {
    const v = await visitor.findById(id);

    if (!v) {
      return res
        .status(404)
        .json({ success: false, message: "Visitor not found" });
    }

    if (action === "checked-in") {
      v.status = "Active";
      v.checkInAt = new Date(Date.now());
      v.isCheckedIn = true;
    } else if (action === "checked-out") {
      v.status = "CheckedOut";
      v.checkOutAt = new Date(Date.now());
      v.isCheckedIn = false;
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid action" });
    }

    await v.save();
    res.status(200).json({
      success: true,
      message: "Visitor updated",
      visitor: v
    });
  } catch (error) {
    console.error("Error updating visitor status:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

securityRouter.get("/profile", async (req, res) => {
  try {
    const security = await Security.findById(req.user.id)
      .select("name email contact address image Shift workplace joiningDate community");

    if (!security) {
      return res.status(404).json({
        success: false,
        message: "Security not found",
      });
    }

    const ads = await Ad.find({
      community: req.user.community,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    return res.json({
      success: true,
      security,
      ads
    });

  } catch (err) {
    console.error("Error loading security profile:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});


securityRouter.post("/profile", upload.single("image"), async (req, res) => {
  try {
    const { name, email, contact, address } = req.body;

    const security = await Security.findById(req.user.id);

    if (!security) {
      return res.status(404).json({
        success: false,
        message: "Security not found",
      });
    }

    if (name) security.name = name;
    if (email) security.email = email;
    if (contact) security.contact = contact;
    if (address) security.address = address;

    if (req.file) {
      security.image = req.file.path; // only update if new image uploaded
    }

    await security.save();

    return res.json({
      success: true,
      message: "Profile updated successfully",
      security
    });

  } catch (err) {
    console.error("Error updating profile:", err);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
});


securityRouter.post("/change-password", async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const security = await Security.findById(req.user.id);
    if (!security) {
      return res.status(404).json({ success: false, message: "Security not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, security.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Current password does not match." });
    }

    const salt = await bcrypt.genSalt(10);
    security.password = await bcrypt.hash(newPassword, salt);

    await security.save();

    return res.json({
      success: true,
      message: "Password changed successfully."
    });

  } catch (err) {
    console.error("Password change error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


export default securityRouter;
