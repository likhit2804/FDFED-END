import Interest from '../models/interestForm.js';
import CommunityManager from '../models/cManager.js';
import admin from '../models/admin.js';
import Community from '../models/communities.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import mongoose from 'mongoose';
import cloudinary from '../configs/cloudinary.js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

// Lightweight router for direct submit with Cloudinary uploads
import express from 'express';
import multer from 'multer';
const upload = multer({ storage: multer.memoryStorage() });


// Helper: Upload buffer to Cloudinary (uses existing cloudinary config)
const uploadToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder: 'communities' }, (error, result) => {
        if (error) reject(error);
        else resolve(result);
      })
      .end(buffer);
  });
};

// Named export router to avoid breaking existing controller exports
export const interestUploadRouter = (() => {
  const router = express.Router();

  // POST /submit: Accept photos and upload to Cloudinary, return URLs
  router.post('/submit', upload.array('photos', 5), async (req, res) => {
    try {
      const photoUrls = [];

      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          const result = await uploadToCloudinary(file.buffer);
          photoUrls.push(result.secure_url);
        }
      }

      const interestData = {
        ...req.body,
        photos: photoUrls,
      };

      // If you want to persist immediately, uncomment:
      // await Interest.create(interestData);

      res.json({
        success: true,
        message: 'Submitted successfully',
        photoCount: photoUrls.length,
        data: interestData,
      });
    } catch (error) {
      console.error('Direct submit error:', error);
      res.status(500).json({ success: false, message: error.message });
    }
  });

  return router;
})();

// Upload photo to Cloudinary
export const uploadPhoto = async (req, res) => {
  try {
    console.log('Upload photo endpoint hit');
    console.log('File received:', !!req.file);
    
    if (!req.file) {
      console.log('No file provided');
      return res.status(400).json({ success: false, message: 'No file provided' });
    }

    console.log('File details:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });

    // Upload to Cloudinary using buffer
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'interest-applications',
          transformation: [
            { width: 1024, crop: 'limit' },
            { quality: 'auto:good' }
          ],
          resource_type: 'image'
        },
        (error, result) => {
          if (error) {
            console.error('Cloudinary upload error:', error);
            reject(error);
          } else {
            console.log('Cloudinary upload success:', result.secure_url);
            resolve(result);
          }
        }
      );
      
      uploadStream.end(req.file.buffer);
    });

    res.json({
      success: true,
      url: result.secure_url
    });

  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload image',
      error: error.message
    });
  }
};
// Email transporter setup - Simplified version
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS 
  }
});

// Display interest form (Public)
export const showInterestForm = (req, res) => {
  res.render('interestForms', {
    title: 'Community Manager Application',
    message: req.flash('message') || '',
    formData: req.flash('formData')[0] || {}
  });
};



export const submitInterestForm = async (req, res) => {
  try {
    const { firstName, lastName, email, phone, communityName, location, description } = req.body;

    // Required fields validation
    if (!firstName || !lastName || !email || !phone || !communityName || !location || !description) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be filled.',
        receivedFields: {
          firstName: !!firstName,
          lastName: !!lastName,
          email: !!email,
          phone: !!phone,
          communityName: !!communityName,
          location: !!location,
          description: !!description
        }
      });
    }

    // Email validation
    if (!validator.isEmail(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    // Phone validation
    if (!validator.isMobilePhone(phone, 'any', { strictMode: false })) {
      return res.status(400).json({ success: false, message: 'Please enter a valid phone number.' });
    }

    // Check for existing application by email
    const emailExists = await Interest.findOne({ email: email.toLowerCase().trim() });
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: 'An application with this email already exists. Please check your email for further communication.'
      });
    }

    // Check for duplicate community + location combination
    const communityLocationExists = await Interest.findOne({
      communityName: validator.escape(communityName.trim()),
      location: validator.escape(location.trim())
    });

    if (communityLocationExists) {
      return res.status(409).json({
        success: false,
        message: `An application for the community "${communityName}" in "${location}" already exists.`
      });
    }

    // Process and upload photos to Cloudinary
    let photoUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          // Upload to Cloudinary using buffer from memory storage
          const result = await new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream(
              {
                folder: 'interest-applications',
                transformation: [
                  { width: 1024, crop: 'limit' },
                  { quality: 'auto:good' }
                ],
                resource_type: 'image'
              },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            
            // Write file buffer to upload stream
            uploadStream.end(file.buffer);
          });
          
          // Store Cloudinary URL
          photoUrls.push(result.secure_url);
          
        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          throw new Error('Failed to upload photo to cloud storage');
        }
      }
    }

    // Create new interest application
    const newApplication = new Interest({
      firstName: validator.escape(firstName.trim()),
      lastName: validator.escape(lastName.trim()),
      email: email.toLowerCase().trim(),
      phone: validator.escape(phone.trim()),
      communityName: validator.escape(communityName.trim()),
      location: validator.escape(location.trim()),
      description: validator.escape(description.trim()),
      photos: photoUrls,
      status: 'pending',
      submittedAt: new Date()
    });

    const savedApplication = await newApplication.save();

    res.status(201).json({
      success: true,
      message: 'Your application has been submitted successfully! We will review it and get back to you soon.',
      data: {
        applicationId: savedApplication._id,
        submittedAt: savedApplication.submittedAt,
        status: savedApplication.status,
        photosCount: photoUrls.length
      }
    });

  } catch (error) {
    console.error('Error in submitInterestForm:', error);

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: 'Validation failed', errors: validationErrors });
    }

    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your application. Please try again later.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};




// Admin: Get all applications
// ✅ JSON version for React (no res.render, no req.flash)
export const getAllApplications = async (req, res) => {
  try {
    // 1️⃣ Fetch data
    const interests = await Interest.find()
      .sort({ createdAt: -1 })
      .populate('approvedBy rejectedBy', 'name email');

    console.log("Fetched interests:", interests.length);

    // 2️⃣ Safely format results for React
    const formatted = interests.map((app) => ({
      _id: app._id,
      firstName: app.firstName,
      lastName: app.lastName,
      email: app.email,
      phone: app.phone,
      communityName: app.communityName,
      location: app.location,
      description: app.description,
      photos: app.photos || [],
      status: app.status || "pending",
      createdAt: app.createdAt,
      updatedAt: app.updatedAt,
      approvedBy: app.approvedBy,
      rejectedBy: app.rejectedBy,
      approvedAt: app.approvedAt,
      rejectedAt: app.rejectedAt,
      rejectionReason: app.rejectionReason
    }));

    // 3️⃣ Send JSON response
    res.json({
      success: true,
      data: formatted,
      count: formatted.length,
    });
  } catch (error) {
    // 4️⃣ Proper logging
    console.error("❌ Error fetching community interest applications:", error.message);
    console.error(error.stack);

    // 5️⃣ Safe error response
    res.status(500).json({
      success: false,
      message: "Server error while fetching applications",
      error: error.message,
    });
  }
};


// Admin: Get all applications as JSON
export const getAllApplicationsJSON = async (req, res) => {
  try {
    const interests = await Interest.find().sort({ createdAt: -1 });

    res.json({
      success: true,
      interests
    });
  } catch (error) {
    console.error('Get interests error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching applications'
    });
  }
};


export const approveApplication = async (req, res) => {
  console.log("=== Approve Application Request ===");
  console.log("Params:", req.params);
  console.log("Body:", req.body);
  console.log("User:", req.user);
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Generate credentials
    const randomPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 12);
    console.log("[Step 1] Generated credentials");

    // 2. Get the interest application
    const interest = await Interest.findById(req.params.id).session(session);
    if (!interest) {
      throw new Error('Application not found');
    }
    console.log("[Step 2] Fetched interest:", interest._id);

    // 3. Check for existing manager
    const existingManager = await CommunityManager.findOne({ email: interest.email }).session(session);
    if (existingManager) {
      throw new Error('Manager already exists with this email');
    }

    // 4. Create manager
    const newManager = await CommunityManager.create(
      [{
        name: `${interest.firstName} ${interest.lastName}`,
        email: interest.email,
        password: hashedPassword,
        contact: interest.phone || "0000000000",
      }],
      { session }
    );
    console.log("[Step 4] New manager created:", newManager[0]._id);

    // 5. Create community
    const newCommunity = await Community.create(
      [{
        name: interest.communityName?.trim() || '',
        location: interest.location?.trim() || '',
        description: interest.description?.trim() || '',
        totalMembers: 0,
        communityManager: newManager[0]._id
      }],
      { session }
    );
    console.log("[Step 5] New community created:", newCommunity[0]._id);

    // Link community to manager
    newManager[0].assignedCommunity = newCommunity[0]._id;
    await newManager[0].save({ session });

    // 6. Update interest status
    await Interest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        approvedBy: req.user.id,
        approvedAt: Date.now()
      },
      { new: true, session }
    );
    console.log("[Step 6] Interest status updated");

    // 7. Commit transaction
    await session.commitTransaction();
    session.endSession();

    // 8. Get admin name for email
    const adminUser = await admin.findById(req.user.id);
    const adminName = adminUser?.name || 'Admin';

    // 9. Send email
    console.log("[Step 8] Sending approval email to:", interest.email);
    await sendStatusEmail(
      interest.email,
      'approved',
      adminName,
      '',
      randomPassword
    );
    console.log("[Step 8] Email sent successfully");

    res.json({
      success: true,
      message: 'Manager account and community created successfully',
      data: {
        managerId: newManager[0]._id,
        communityId: newCommunity[0]._id
      }
    });

  } catch (error) {
    console.error("[ERROR] Approval process failed:", error);

    // Rollback
    await session.abortTransaction();
    session.endSession();

    let errorMessage = 'Error creating manager account';
    if (error.message) errorMessage = error.message;
    
    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
};



export const rejectApplication = async (req, res) => {
  try {
    if (!req.body.reason || req.body.reason.trim().length <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason must be provided'
      });
    }

    const interest = await Interest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'rejected',
        rejectedBy: req.user.id,
        rejectedAt: Date.now(),
        rejectionReason: validator.escape(req.body.reason.trim())
      },
      { new: true, runValidators: true }
    );

    if (!interest) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Get admin name for email
    const adminUser = await admin.findById(req.user.id);
    const adminName = adminUser?.name || 'Admin';

    await sendStatusEmail(
      interest.email, 
      'rejected', 
      adminName, 
      validator.escape(req.body.reason.trim())
    );

    res.json({
      success: true,
      message: 'Application rejected successfully',
      data: {
        applicationId: interest._id,
        rejectionReason: interest.rejectionReason
      }
    });

  } catch (error) {
    console.error('Rejection error:', error);
    res.status(500).json({
      success: false,
      message: error.name === 'ValidationError' 
        ? 'Invalid rejection data' 
        : 'Error rejecting application'
    });
  }
};
// Admin: Suspend application







const sendStatusEmail = async (email, status, adminName, reason = '', password = '') => {
  const subject = status === 'approved' 
    ? 'Your Application Has Been Approved' 
    : status === 'rejected' 
      ? 'Your Application Has Been Rejected' 
      : 'Your Application Status Update';

  const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${subject}</title>
<style>
  body {
    margin: 0;
    padding: 0;
    background-color: #f4f6f8;
    font-family: 'Segoe UI', Tahoma, sans-serif;
    color: #333;
  }
  .container {
    max-width: 600px;
    margin: 30px auto;
    background: #ffffff;
    border-radius: 10px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  }
  .header {
    padding: 40px 20px;
    text-align: center;
    color: white;
  }
  .header.approved { background: linear-gradient(135deg, #4CAF50, #2e7d32); }
  .header.rejected { background: linear-gradient(135deg, #e53935, #b71c1c); }
  .header.pending  { background: linear-gradient(135deg, #fb8c00, #ef6c00); }
  .icon {
    font-size: 40px;
    display: inline-block;
    margin-bottom: 15px;
  }
  .content {
    padding: 30px 25px;
    line-height: 1.6;
    font-size: 16px;
    color: #444;
  }
  .section {
    background: #f9fafb;
    border-left: 4px solid #ccc;
    padding: 15px 20px;
    margin: 20px 0;
    border-radius: 6px;
  }
  .credentials {
    background: #e3f2fd;
    border: 1px solid #90caf9;
    padding: 20px;
    border-radius: 6px;
    margin: 20px 0;
  }
  .credentials code {
    background: #f1f3f4;
    padding: 4px 8px;
    border-radius: 4px;
    font-family: monospace;
    font-size: 14px;
  }
  .btn {
    display: inline-block;
    padding: 14px 28px;
    margin-top: 25px;
    background: #4CAF50;
    color: white !important;
    text-decoration: none;
    border-radius: 6px;
    font-weight: bold;
    text-transform: uppercase;
    font-size: 14px;
    box-shadow: 0 3px 6px rgba(76, 175, 80, 0.3);
  }
  .btn:hover { opacity: 0.9; }
  .footer {
    text-align: center;
    font-size: 12px;
    color: #888;
    padding: 20px;
    background: #f1f3f4;
  }
  @media (max-width: 600px) {
    .container { margin: 0; border-radius: 0; }
    .content { padding: 20px; }
  }
</style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header ${status}">
      <div class="icon">
        ${status === 'approved' ? '✅' : status === 'rejected' ? '❌' : '⏳'}
      </div>
      <h1>Application ${status.charAt(0).toUpperCase() + status.slice(1)}</h1>
    </div>

    <!-- Content -->
    <div class="content">
      <p>Hello,</p>
      <p>
        Thank you for your application. Below are the details regarding your application status.
      </p>

      ${reason ? `
      <div class="section">
        <strong>Additional Information:</strong><br>${reason}
      </div>
      ` : ''}

      ${status === 'approved' && password ? `
      <div class="credentials">
        <h3>🔑 Your Login Credentials</h3>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Temporary Password:</strong> <code>${password}</code></p>
      </div>
      <a class="btn" href="${process.env.BASE_URL || 'http://localhost:3000'}/login">Login to Your Account</a>
      ` : ''}

      ${status === 'rejected' ? `
      <p>If you have questions or would like to reapply, please contact our support team.</p>
      ` : ''}

    </div>

    <!-- Footer -->
    <div class="footer">
      This is an automated message regarding your application.<br>
      Need help? Email us at 
      <a href="mailto:support@company.com" style="color:#1976d2;">support@company.com</a>
    </div>
  </div>
</body>
</html>
`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: email,
      subject,
      html: htmlTemplate
    });
    console.log('Status email sent to:', email);
  } catch (error) {
    console.error('Error sending status email:', error);
  }
};