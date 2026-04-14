import express from 'express';
import mongoose from 'mongoose';

// ── Model imports ───────────────────────────────────────────────
import Issue           from '../models/issues.js';
import Community       from '../models/communities.js';
import Resident        from '../models/resident.js';
import Worker          from '../models/workers.js';
import Security        from '../models/security.js';
import Visitor         from '../models/visitors.js';
import VisitorPreApproval from '../models/preapproval.js';
import Payment         from '../models/payment.js';
import CommonSpaces    from '../models/commonSpaces.js';
import Leave           from '../models/leave.js';
import Ad              from '../models/Ad.js';
import Interest        from '../models/interestForm.js';
import AdminAuditLog   from '../models/adminAuditLog.js';
import Amenity         from '../models/Amenities.js';
import CommunityManager from '../models/cManager.js';

const searchRouter = express.Router();

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Universal search across all UrbanEase entities
 *     description: |
 *       Full-text and name-based search across all major entities.
 *       Results are scoped based on the logged-in user's role and community.
 *
 *       **Role-based visibility:**
 *       - **Admin**: Communities, Interest Forms, Audit Logs, all Residents/Workers/Managers
 *       - **Manager**: Issues, Residents, Workers, Security, Visitors, Payments, Bookings, Leaves, Ads, Amenities
 *       - **Resident**: Their own Issues, Visitors they approved, Ads
 *       - **Worker**: Issues assigned to them, their Leaves
 *       - **Security**: Visitors, Pre-Approvals in their community
 *
 *       Uses MongoDB `$text` index for Issues and Communities, regex for name-based fields.
 *     tags: [Search]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search term
 *         example: "plumbing"
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [issues, communities, residents, workers, security, visitors, preapprovals, payments, bookings, leaves, ads, amenities, interest, auditlogs, managers, all]
 *           default: all
 *         description: Restrict search to a specific entity type
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Max results per entity type (max 50)
 *     responses:
 *       200:
 *         description: Search results grouped by entity type
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 query:
 *                   type: string
 *                 totalResults:
 *                   type: integer
 *                 results:
 *                   type: object
 *                   description: Keys are entity type names, values are arrays of matching documents
 *       400:
 *         description: Missing search query
 *       401:
 *         description: Unauthorized
 */
searchRouter.get('/', async (req, res) => {
  try {
    const { q, type = 'all' } = req.query;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Search query (q) is required' });
    }

    const term       = q.trim();
    const regex      = new RegExp(term, 'i');   // case-insensitive name search
    const want       = (key) => type === 'all' || type === key;

    const userType   = req.user?.userType;     // 'Admin' | 'CommunityManager' | 'Resident' | 'Worker' | 'Security'
    const communityId = req.user?.community;    // ObjectId string
    const userId     = req.user?.id;

    const isAdmin    = userType === 'Admin';
    const isManager  = userType === 'CommunityManager';
    const isResident = userType === 'Resident';
    const isWorker   = userType === 'Worker';
    const isSecurity = userType === 'Security';

    const results    = {};

    // ── 1. ISSUES ─────────────────────────────────────────────────────────
    if (want('issues')) {
      let filter = { $text: { $search: term } };

      if (isAdmin)    { /* all issues */ }
      else if (isManager || isSecurity) filter.community = communityId;
      else if (isResident) filter.resident = userId;
      else if (isWorker)   filter.workerAssigned = userId;

      results.issues = await Issue
        .find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .populate('resident', 'residentFirstname residentLastname uCode')
        .populate('workerAssigned', 'name')
        .select('issueID title description status category priority location createdAt')
        .lean();
    }

    // ── 2. COMMUNITIES (Admin only) ───────────────────────────────────────
    if (want('communities') && isAdmin) {
      results.communities = await Community
        .find({ $text: { $search: term } }, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } })
        .limit(limit)
        .select('name location description communityCode subscriptionStatus planEndDate')
        .lean();
    }

    // ── 3. RESIDENTS ──────────────────────────────────────────────────────
    if (want('residents') && (isAdmin || isManager)) {
      const resFilter = {
        $or: [
          { residentFirstname: regex },
          { residentLastname: regex },
          { uCode: regex },
          { email: regex },
          { contact: regex },
        ],
      };
      if (!isAdmin) resFilter.community = communityId;

      results.residents = await Resident
        .find(resFilter)
        .limit(limit)
        .select('residentFirstname residentLastname uCode email contact community')
        .lean();
    }

    // ── 4. WORKERS ────────────────────────────────────────────────────────
    if (want('workers') && (isAdmin || isManager)) {
      const workerFilter = {
        $or: [
          { name: regex },
          { email: regex },
          { contact: regex },
          { address: regex },
        ],
      };
      if (!isAdmin) workerFilter.community = communityId;

      results.workers = await Worker
        .find(workerFilter)
        .limit(limit)
        .select('name email jobRole contact isActive community joiningDate')
        .lean();
    }

    // ── 5. SECURITY GUARDS ────────────────────────────────────────────────
    if (want('security') && (isAdmin || isManager)) {
      const secFilter = {
        $or: [{ name: regex }, { email: regex }, { contact: regex }],
      };
      if (!isAdmin) secFilter.community = communityId;

      results.security = await Security
        .find(secFilter)
        .limit(limit)
        .select('name email contact Shift workplace joiningDate')
        .lean();
    }

    // ── 6. COMMUNITY MANAGERS (Admin only) ───────────────────────────────
    if (want('managers') && isAdmin) {
      results.managers = await CommunityManager
        .find({
          $or: [{ name: regex }, { email: regex }, { contact: regex }],
        })
        .limit(limit)
        .select('name email contact assignedCommunity')
        .populate('assignedCommunity', 'name communityCode')
        .lean();
    }

    // ── 7. VISITORS ───────────────────────────────────────────────────────
    if (want('visitors') && (isAdmin || isManager || isSecurity)) {
      const visFilter = {
        $or: [
          { name: regex },
          { email: regex },
          { contactNumber: regex },
          { purpose: regex },
          { vehicleNumber: regex },
        ],
      };
      if (!isAdmin) visFilter.community = communityId;

      results.visitors = await Visitor
        .find(visFilter)
        .limit(limit)
        .select('name contactNumber email purpose vehicleNumber status checkInAt checkOutAt scheduledAt')
        .populate('approvedBy', 'residentFirstname residentLastname uCode')
        .lean();
    }

    // ── 8. PRE-APPROVALS ──────────────────────────────────────────────────
    if (want('preapprovals') && (isAdmin || isManager || isSecurity || isResident)) {
      const paFilter = {
        $or: [
          { visitorName: regex },
          { contactNumber: regex },
          { purpose: regex },
          { vehicleNo: regex },
        ],
      };
      if (!isAdmin) paFilter.community = communityId;
      if (isResident) paFilter.approvedBy = userId;

      results.preapprovals = await VisitorPreApproval
        .find(paFilter)
        .limit(limit)
        .select('visitorName contactNumber purpose dateOfVisit timeOfVisit status vehicleNo qrStatus')
        .populate('approvedBy', 'residentFirstname residentLastname uCode')
        .lean();
    }

    // ── 9. PAYMENTS ───────────────────────────────────────────────────────
    if (want('payments') && (isAdmin || isManager || isResident)) {
      const payFilter = {
        $or: [{ title: regex }, { remarks: regex }],
      };
      if (isAdmin)    { /* all */ }
      else if (isManager) payFilter.community = communityId;
      else if (isResident) payFilter.sender = userId;

      results.payments = await Payment
        .find(payFilter)
        .limit(limit)
        .select('title amount status paymentDeadline paymentDate paymentMethod remarks belongTo')
        .populate('sender', 'residentFirstname residentLastname uCode')
        .lean();
    }

    // ── 10. COMMON SPACE BOOKINGS ─────────────────────────────────────────
    if (want('bookings') && (isAdmin || isManager || isResident)) {
      const bkFilter = {
        $or: [{ name: regex }, { description: regex }],
      };
      if (isAdmin)    { /* all */ }
      else if (isManager) bkFilter.community = communityId;
      else if (isResident) bkFilter.bookedBy = userId;

      results.bookings = await CommonSpaces
        .find(bkFilter)
        .limit(limit)
        .select('name description Date from to status paymentStatus amount Type')
        .populate('bookedBy', 'residentFirstname residentLastname uCode')
        .lean();
    }

    // ── 11. AMENITIES ─────────────────────────────────────────────────────
    if (want('amenities') && (isAdmin || isManager || isResident)) {
      const amFilter = { $or: [{ name: regex }, { type: regex }] };
      if (!isAdmin) amFilter.community = communityId;

      results.amenities = await Amenity
        .find(amFilter)
        .limit(limit)
        .select('name type bookable rent bookingRules Type')
        .lean();
    }

    // ── 12. LEAVES ────────────────────────────────────────────────────────
    if (want('leaves') && (isAdmin || isManager || isWorker)) {
      const lvFilter = {
        $or: [{ reason: regex }, { notes: regex }],
      };
      if (isAdmin)   { /* all */ }
      else if (isManager) lvFilter.community = communityId;
      else if (isWorker)  lvFilter.worker = userId;

      results.leaves = await Leave
        .find(lvFilter)
        .limit(limit)
        .select('type startDate endDate status reason notes appliedAt')
        .populate('worker', 'name email jobRole')
        .lean();
    }

    // ── 13. ADS / ANNOUNCEMENTS ───────────────────────────────────────────
    if (want('ads') && (isAdmin || isManager || isResident)) {
      const adFilter = { $or: [{ title: regex }] };
      if (!isAdmin) adFilter.community = communityId;

      results.ads = await Ad
        .find(adFilter)
        .limit(limit)
        .select('title adType status startDate endDate targetAudience imagePath')
        .lean();
    }

    // ── 14. INTEREST FORMS (Admin only) ──────────────────────────────────
    if (want('interest') && isAdmin) {
      results.interest = await Interest
        .find({
          $or: [
            { firstName: regex },
            { lastName: regex },
            { email: regex },
            { communityName: regex },
            { location: regex },
            { description: regex },
          ],
        })
        .limit(limit)
        .select('firstName lastName email phone communityName location status paymentStatus createdAt')
        .lean();
    }

    // ── 15. ADMIN AUDIT LOGS (Admin only) ────────────────────────────────
    if (want('auditlogs') && isAdmin) {
      results.auditlogs = await AdminAuditLog
        .find({
          $or: [
            { adminEmail: regex },
            { targetName: regex },
            { action: regex },
            { errorMessage: regex },
          ],
        })
        .limit(limit)
        .sort({ createdAt: -1 })
        .select('adminEmail action targetType targetName status createdAt')
        .lean();
    }

    // ── Summary ───────────────────────────────────────────────────────────
    const totalResults = Object.values(results).reduce(
      (sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0),
      0
    );

    return res.json({
      success: true,
      query: term,
      userType,
      totalResults,
      resultsByType: Object.fromEntries(
        Object.entries(results).map(([k, v]) => [k, v.length])
      ),
      results,
    });

  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({
      success: false,
      message: 'Search failed',
      error: error.message,
    });
  }
});

export default searchRouter;
