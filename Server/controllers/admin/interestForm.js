import Interest from '../../models/interestForm.js';
import CommunityManager from '../../models/cManager.js';
import admin from '../../models/admin.js';
import Community from '../../models/communities.js';
import SubscriptionPlan from '../../models/subscriptionPlan.js';
import CommunitySubscription from '../../models/communitySubscription.js';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import validator from 'validator';
import mongoose from 'mongoose';
import cloudinary from '../../configs/cloudinary.js';
import { uploadToCloudinary as uploadBufferToCloudinary } from '../../utils/cloudinaryUpload.js';
import { generateTransactionId } from '../../utils/idGenerator.js';
import fs from 'fs';
import dotenv from 'dotenv';
import { sendApplicationApprovedEmail, sendApplicationRejectedEmail, sendAccountActivatedEmail, sendPaymentLinkEmail } from '../../utils/emailService.js';
import { createRazorpayOrder, getRazorpayPublicConfig, verifyRazorpaySignature } from '../../services/razorpayService.js';
dotenv.config();

const normalizeBaseUrl = (value) => {
  if (!value) return '';
  try {
    const url = new URL(String(value).trim());
    return `${url.protocol}//${url.host}`;
  } catch {
    return '';
  }
};

const resolveClientBaseUrl = (req) => {
  const envBaseUrl =
    normalizeBaseUrl(process.env.CLIENT_BASE_URL) ||
    normalizeBaseUrl(process.env.FRONTEND_URL) ||
    normalizeBaseUrl(process.env.APP_BASE_URL);
  if (envBaseUrl) return envBaseUrl;

  const originHeader = normalizeBaseUrl(req.get('origin') || req.headers.origin);
  if (originHeader) return originHeader;

  const forwardedHost = String(req.headers['x-forwarded-host'] || '').split(',')[0].trim();
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  if (forwardedHost) {
    return `${forwardedProto || req.protocol || 'https'}://${forwardedHost}`;
  }

  const host = req.get('host');
  if (host) {
    return `${req.protocol || 'https'}://${host}`;
  }

  return 'http://localhost:5173';
};

const normalizeInputText = (value) => String(value ?? '').trim().replace(/\s+/g, ' ');
const sanitizeInputText = (value) => validator.escape(normalizeInputText(value));

// Lightweight router for direct submit with Cloudinary uploads
import express from 'express';
import { memoryUpload } from '../../configs/multer.js';


// Named export router to avoid breaking existing controller exports
export const interestUploadRouter = (() => {
  const router = express.Router();

  // POST /submit: Accept photos and upload to Cloudinary, return URLs
  router.post('/submit', memoryUpload.array('photos', 5), async (req, res) => {
    try {
      const photoUrls = [];

      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          const result = await uploadBufferToCloudinary(file.buffer, 'communities');
          photoUrls.push(result.url);
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

    const result = await uploadBufferToCloudinary(req.file.buffer, 'interest-applications', {
      transformation: [
        { width: 1024, crop: 'limit' },
        { quality: 'auto:good' }
      ],
    });

    res.json({
      success: true,
      url: result.url
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
    const normalizedFirstName = sanitizeInputText(firstName);
    const normalizedLastName = sanitizeInputText(lastName);
    const normalizedEmail = normalizeInputText(email).toLowerCase();
    const normalizedPhone = sanitizeInputText(phone);
    const normalizedCommunityName = sanitizeInputText(communityName);
    const normalizedLocation = sanitizeInputText(location);
    const normalizedDescription = sanitizeInputText(description);

    // Required fields validation
    if (
      !normalizedFirstName ||
      !normalizedLastName ||
      !normalizedEmail ||
      !normalizedPhone ||
      !normalizedCommunityName ||
      !normalizedLocation ||
      !normalizedDescription
    ) {
      return res.status(400).json({
        success: false,
        message: 'All required fields must be filled.',
        receivedFields: {
          firstName: !!normalizedFirstName,
          lastName: !!normalizedLastName,
          email: !!normalizedEmail,
          phone: !!normalizedPhone,
          communityName: !!normalizedCommunityName,
          location: !!normalizedLocation,
          description: !!normalizedDescription
        }
      });
    }

    // Email validation
    if (!validator.isEmail(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    // Phone validation
    if (!validator.isMobilePhone(normalizedPhone, 'any', { strictMode: false })) {
      return res.status(400).json({ success: false, message: 'Please enter a valid phone number.' });
    }

    // Check for existing active application by email
    const emailExists = await Interest.findOne({
      email: normalizedEmail,
      status: { $in: ['pending', 'approved'] }
    }).lean();
    if (emailExists) {
      return res.status(409).json({
        success: false,
        message: 'An active application with this email already exists. Please check your email for further communication.'
      });
    }

    // Check for duplicate active community + location combination
    const communityLocationExists = await Interest.findOne({
      communityName: normalizedCommunityName,
      location: normalizedLocation,
      status: { $in: ['pending', 'approved'] }
    }).lean();

    if (communityLocationExists) {
      return res.status(409).json({
        success: false,
        message: `An active application for the community "${normalizedCommunityName}" in "${normalizedLocation}" already exists.`
      });
    }

    // Process and upload photos to Cloudinary
    let photoUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await uploadBufferToCloudinary(file.buffer, 'interest-applications', {
            transformation: [
              { width: 1024, crop: 'limit' },
              { quality: 'auto:good' }
            ],
          });
          photoUrls.push(result.url);

        } catch (uploadError) {
          console.error('Cloudinary upload error:', uploadError);
          throw new Error('Failed to upload photo to cloud storage');
        }
      }
    }

    // Create new interest application
    const newApplication = new Interest({
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      email: normalizedEmail,
      phone: normalizedPhone,
      communityName: normalizedCommunityName,
      location: normalizedLocation,
      description: normalizedDescription,
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
      approvedAt: app.approvedAt,
      rejectedAt: app.rejectedAt,
      rejectionReason: app.rejectionReason,
      paymentStatus: app.paymentStatus || 'pending'
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
    // 1. Generate onboarding token (secure hex string)
    const onboardingToken = crypto.randomBytes(32).toString('hex');
    const onboardingTokenExpires = Date.now() + 7 * 24 * 60 * 60 * 1000; // Case: Valid for 7 days

    // 2. Update interest status and set token
    const interest = await Interest.findByIdAndUpdate(
      req.params.id,
      {
        status: 'approved',
        approvedBy: req.user.id,
        approvedAt: Date.now(),
        paymentStatus: 'pending',
        onboardingToken,
        onboardingTokenExpires
      },
      { new: true, session }
    );

    if (!interest) {
      throw new Error('Application not found');
    }

    // 3. Commit transaction
    await session.commitTransaction();
    session.endSession();

    // 4. Get admin name for email
    const adminUser = await admin.findById(req.user.id);
    const adminName = adminUser?.name || 'Admin';

    // 5. Send Email with Payment Link
    const clientUrl = resolveClientBaseUrl(req);
    const paymentLink = `${clientUrl}/onboarding/payment?token=${onboardingToken}`;

    console.log("[Approval] Sending payment link to:", interest.email);

    await sendApplicationApprovedEmail(
      interest.email,
      adminName,
      paymentLink,
      'Your application has been approved! Please complete your subscription payment to activate your account and receive your login credentials.'
    );

    res.json({
      success: true,
      message: 'Application approved. Onboarding link sent to applicant.',
      data: {
        interestId: interest._id,
        status: interest.status,
        paymentStatus: interest.paymentStatus
      }
    });

  } catch (error) {
    console.error("[ERROR] Approval process failed:", error);

    // Rollback
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      success: false,
      message: 'Error approving application',
      error: error.message
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

    await sendApplicationRejectedEmail(
      interest.email,
      adminName,
      req.body.reason.trim()
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

// ---------------------------------------------------------
// NEW ONBOARDING ENDPOINTS
// ---------------------------------------------------------

// Smart Resend: Link if pending, Credentials if completed
export const resendPaymentLink = async (req, res) => {
  try {
    const interest = await Interest.findById(req.params.id);
    if (!interest) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (interest.status !== 'approved' && interest.status !== 'onboarded') {
      return res.status(400).json({
        success: false,
        message: 'Cannot resend info. Application is rejected or pending.'
      });
    }

    // CASE 1: ALREADY COMPLETED -> ERROR (Feature removed)
    if (interest.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Payment already completed. Account is active.'
      });
    }
    // CASE 2: PENDING -> RESEND PAYMENT LINK
    // Generate new token
    const onboardingToken = crypto.randomBytes(32).toString('hex');
    const onboardingTokenExpires = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days from now

    interest.onboardingToken = onboardingToken;
    interest.onboardingTokenExpires = onboardingTokenExpires;
    await interest.save();

    // Send email
    const clientUrl = resolveClientBaseUrl(req);
    const paymentLink = `${clientUrl}/onboarding/payment?token=${onboardingToken}`;

    console.log(`[Resend Payment Link] Sending to ${interest.email} with token: ${onboardingToken.substring(0, 8)}...`);

    try {
      await sendPaymentLinkEmail(
        interest.email,
        paymentLink,
        7 // 7 days expiry
      );
      console.log(`[Resend Payment Link] Email sent successfully to ${interest.email}`);
    } catch (emailError) {
      console.error('[Resend Payment Link] Email send failed:', emailError);
      throw new Error(`Failed to send email: ${emailError.message}`);
    }

    res.json({
      success: true,
      message: 'Payment link resent successfully',
      data: {
        interestId: interest._id,
        newExpiry: onboardingTokenExpires
      }
    });

  } catch (error) {
    console.error('[Resend Payment Link Error]:', error.message);
    console.error('Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error performing resend action',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Public: Get onboarding details by token
export const getOnboardingDetails = async (req, res) => {
  try {
    const { token } = req.params;

    // Find interest by token and check expiry
    const interest = await Interest.findOne({
      onboardingToken: token,
      onboardingTokenExpires: { $gt: Date.now() } // Must not be expired
    });

    if (!interest) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired onboarding link. Please contact support.'
      });
    }

    if (interest.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'This account has already been activated. Please login directly.'
      });
    }

    // Fetch available plans from database
    const activePlans = await SubscriptionPlan.find({ isActive: true })
      .sort({ displayOrder: 1 })
      .lean();

    // Transform plans into client-friendly format
    const plans = activePlans.reduce((acc, plan) => {
      acc[plan.planKey] = {
        name: plan.name,
        price: plan.price,
        duration: plan.duration,
        features: plan.features,
        maxResidents: plan.maxResidents
      };
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        firstName: interest.firstName,
        lastName: interest.lastName,
        email: interest.email,
        phone: interest.phone,
        location: interest.location,
        communityName: interest.communityName,
        paymentStatus: interest.paymentStatus,
        plans // Return plans here
      }
    });

  } catch (error) {
    console.error('Error fetching onboarding details:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

export const createOnboardingPaymentOrder = async (req, res) => {
  try {
    const { token, plan } = req.body;

    if (!token || !plan) {
      return res.status(400).json({
        success: false,
        message: 'Token and plan are required to create a payment order.'
      });
    }

    const interest = await Interest.findOne({
      onboardingToken: token,
      onboardingTokenExpires: { $gt: Date.now() }
    }).lean();

    if (!interest) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired onboarding session'
      });
    }

    if (interest.paymentStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Account already activated'
      });
    }

    const planDoc = await SubscriptionPlan.findOne({
      planKey: plan,
      isActive: true
    }).lean();

    if (!planDoc) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or inactive subscription plan selected'
      });
    }

    const order = await createRazorpayOrder({
      amountInPaise: Math.round(planDoc.price * 100),
      receipt: `onboard_${interest._id}_${Date.now()}`.slice(0, 40),
      notes: {
        flow: 'onboarding',
        interestId: String(interest._id),
        planKey: planDoc.planKey,
        communityName: interest.communityName || '',
      },
    });

    const { keyId } = getRazorpayPublicConfig();

    return res.json({
      success: true,
      data: {
        key: keyId,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        plan: {
          key: planDoc.planKey,
          name: planDoc.name,
          price: planDoc.price,
          duration: planDoc.duration,
        }
      }
    });
  } catch (error) {
    console.error('[Onboarding Order Error]', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to create payment order'
    });
  }
};

// Public: Complete Onboarding Payment & Activate Account
export const completeOnboardingPayment = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      token,
      plan,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    } = req.body;

    if (!token || !plan || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new Error('Missing verified Razorpay payment details');
    }

    // 1. Validate Token
    const interest = await Interest.findOne({
      onboardingToken: token,
      onboardingTokenExpires: { $gt: Date.now() }
    }).session(session);

    if (!interest) {
      throw new Error('Invalid or expired onboarding session');
    }

    if (interest.paymentStatus === 'completed') {
      throw new Error('Account already activated');
    }

    // 2. Validate Plan
    const planDoc = await SubscriptionPlan.findOne({ planKey: plan, isActive: true }).session(session);

    if (!planDoc) {
      throw new Error('Invalid or inactive subscription plan selected');
    }

    const isSignatureValid = verifyRazorpaySignature({
      orderId: razorpayOrderId,
      paymentId: razorpayPaymentId,
      signature: razorpaySignature,
    });

    if (!isSignatureValid) {
      throw new Error('Payment signature verification failed');
    }

    console.log(`[Payment] Verified onboarding payment for ${interest.email}`, {
      razorpayOrderId,
      razorpayPaymentId,
      plan: planDoc.planKey,
    });

    // 4. Generate Credentials
    const randomPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(randomPassword, 12);

    // 5. Create Manager
    const newManager = await CommunityManager.create(
      [{
        name: `${interest.firstName} ${interest.lastName}`,
        email: interest.email,
        password: hashedPassword,
        contact: interest.phone || "0000000000",
        subscriptionStatus: 'active' // Important: they just paid!
      }],
      { session }
    );

    // 6. Calculate plan end date based on plan duration
    const daysToAdd = planDoc.duration === 'yearly' ? 365 : 30;
    const planEndDate = new Date(Date.now() + daysToAdd * 24 * 60 * 60 * 1000);

    // 7. Create Community
    const newCommunity = await Community.create(
      [{
        name: interest.communityName?.trim() || '',
        location: interest.location?.trim() || '',
        description: interest.description?.trim() || '',
        totalMembers: 0,
        communityManager: newManager[0]._id,
        subscriptionStatus: 'active',
        subscriptionPlan: planDoc.planKey,
        planStartDate: new Date(),
        planEndDate: planEndDate
      }],
      { session }
    );

    // Link community
    newManager[0].assignedCommunity = newCommunity[0]._id;
    await newManager[0].save({ session });

    // 8. Create CommunitySubscription record for billing
    await CommunitySubscription.create(
      [{
        communityId: newCommunity[0]._id,
        transactionId: razorpayPaymentId || generateTransactionId('TXN'),
        planName: planDoc.name,
        planType: planDoc.planKey,
        amount: planDoc.price,
        paymentMethod: 'razorpay',
        gateway: 'razorpay',
        gatewayOrderId: razorpayOrderId,
        gatewayPaymentId: razorpayPaymentId,
        paymentDate: new Date(),
        planStartDate: new Date(),
        planEndDate: planEndDate,
        duration: planDoc.duration,
        status: 'completed',
        isRenewal: false,
        metadata: {
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip || req.connection.remoteAddress,
          receipt: `onboard_${interest._id}`,
        }
      }],
      { session }
    );

    // 9. Update Interest Status
    interest.paymentStatus = 'completed';
    // interest.status = 'onboarded'; // Optional: change status or keep 'approved'
    interest.onboardingToken = undefined; // Clear token
    interest.onboardingTokenExpires = undefined;
    await interest.save({ session });

    // 10. Commit
    await session.commitTransaction();
    session.endSession();

    // 11. Send Welcome Email with Credentials
    const communityCode = newCommunity[0].communityCode;

    await sendAccountActivatedEmail(
      interest.email,
      randomPassword
    );

    res.json({
      success: true,
      message: 'Account activated successfully! Check your email for login credentials.',
      data: {
        managerId: newManager[0]._id
      }
    });

  } catch (error) {
    console.error('[Onboarding Error]', error);
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ success: false, message: error.message });
  }
};
