import Issue from '../models/issues.js';
import Community from '../models/communities.js';
import Resident from '../models/resident.js';
import Worker from '../models/workers.js';
import Security from '../models/security.js';
import Visitor from '../models/visitors.js';
import VisitorPreApproval from '../models/preapproval.js';
import Payment from '../models/payment.js';
import CommonSpaces from '../models/commonSpaces.js';
import Leave from '../models/leave.js';
import Interest from '../models/interestForm.js';
import AdminAuditLog from '../models/adminAuditLog.js';
import Amenity from '../models/Amenities.js';
import CommunityManager from '../models/cManager.js';

export class SearchService {
  /**
   * Executes a universal text search across all entities concurrently.
   * Utilizes MongoDB $text indexes exclusively (no regex) for maximum IXSCAN efficiency.
   */
  static async executeMultiSearch({ term, type, limit, userContext }) {
    const { userType, communityId, userId, isAdmin, isManager, isResident, isWorker, isSecurity } = userContext;
    const want = (key) => type === 'all' || type === key;

    // Helper functions for each model search
    const fetchIssues = async () => {
      if (!want('issues')) return null;
      const filter = { $text: { $search: term } };
      if (!isAdmin) {
        if (isManager || isSecurity) filter.community = communityId;
        else if (isResident) filter.resident = userId;
        else if (isWorker) filter.workerAssigned = userId;
      }
      return Issue.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } }).limit(limit)
        .populate('resident', 'residentFirstname residentLastname uCode')
        .populate('workerAssigned', 'name')
        .select('issueID title description status category priority location createdAt').lean();
    };

    const fetchCommunities = async () => {
      if (!want('communities') || !isAdmin) return null;
      return Community.find({ $text: { $search: term } }, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } }).limit(limit)
        .select('name location description communityCode subscriptionStatus planEndDate').lean();
    };

    const fetchResidents = async () => {
      if (!want('residents') || (!isAdmin && !isManager)) return null;
      const filter = { $text: { $search: term } };
      if (!isAdmin) filter.community = communityId;
      return Resident.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } }).limit(limit)
        .select('residentFirstname residentLastname uCode email contact community').lean();
    };

    const fetchWorkers = async () => {
      if (!want('workers') || (!isAdmin && !isManager)) return null;
      const filter = { $text: { $search: term } };
      if (!isAdmin) filter.community = communityId;
      return Worker.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } }).limit(limit)
        .select('name email jobRole contact isActive community joiningDate').lean();
    };

    const fetchSecurity = async () => {
      if (!want('security') || (!isAdmin && !isManager)) return null;
      const filter = { $text: { $search: term } };
      if (!isAdmin) filter.community = communityId;
      return Security.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } }).limit(limit)
        .select('name email contact Shift workplace joiningDate').lean();
    };

    const fetchManagers = async () => {
      if (!want('managers') || !isAdmin) return null;
      return CommunityManager.find({ $text: { $search: term } }, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } }).limit(limit)
        .select('name email contact assignedCommunity')
        .populate('assignedCommunity', 'name communityCode').lean();
    };

    const fetchVisitors = async () => {
      if (!want('visitors') || (!isAdmin && !isManager && !isSecurity)) return null;
      const filter = { $text: { $search: term } };
      if (!isAdmin) filter.community = communityId;
      return Visitor.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } }).limit(limit)
        .select('name contactNumber email purpose vehicleNumber status checkInAt checkOutAt scheduledAt')
        .populate('approvedBy', 'residentFirstname residentLastname uCode').lean();
    };

    const fetchPreApprovals = async () => {
      if (!want('preapprovals') || (!isAdmin && !isManager && !isSecurity && !isResident)) return null;
      const filter = { $text: { $search: term } };
      if (!isAdmin) filter.community = communityId;
      if (isResident) filter.approvedBy = userId;
      return VisitorPreApproval.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } }).limit(limit)
        .select('visitorName contactNumber purpose dateOfVisit timeOfVisit status vehicleNo qrStatus')
        .populate('approvedBy', 'residentFirstname residentLastname uCode').lean();
    };

    const fetchPayments = async () => {
      if (!want('payments') || (!isAdmin && !isManager && !isResident)) return null;
      const filter = { $text: { $search: term } };
      if (isManager) filter.community = communityId;
      else if (isResident) filter.sender = userId;
      return Payment.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } }).limit(limit)
        .select('title amount status paymentDeadline paymentDate paymentMethod remarks belongTo')
        .populate('sender', 'residentFirstname residentLastname uCode').lean();
    };

    const fetchBookings = async () => {
      if (!want('bookings') || (!isAdmin && !isManager && !isResident)) return null;
      const filter = { $text: { $search: term } };
      if (isManager) filter.community = communityId;
      else if (isResident) filter.bookedBy = userId;
      return CommonSpaces.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } }).limit(limit)
        .select('name description Date from to status paymentStatus amount Type')
        .populate('bookedBy', 'residentFirstname residentLastname uCode').lean();
    };

    const fetchAmenities = async () => {
      if (!want('amenities') || (!isAdmin && !isManager && !isResident)) return null;
      const filter = { $text: { $search: term } };
      if (!isAdmin) filter.community = communityId;
      return Amenity.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } }).limit(limit)
        .select('name type bookable rent bookingRules Type').lean();
    };

    const fetchLeaves = async () => {
      if (!want('leaves') || (!isAdmin && !isManager && !isWorker)) return null;
      const filter = { $text: { $search: term } };
      if (isManager) filter.community = communityId;
      else if (isWorker) filter.worker = userId;
      return Leave.find(filter, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } }).limit(limit)
        .select('type startDate endDate status reason notes appliedAt')
        .populate('worker', 'name email jobRole').lean();
    };

    const fetchInterest = async () => {
      if (!want('interest') || !isAdmin) return null;
      return Interest.find({ $text: { $search: term } }, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } }).limit(limit)
        .select('firstName lastName email phone communityName location status paymentStatus createdAt').lean();
    };

    const fetchAuditLogs = async () => {
      if (!want('auditlogs') || !isAdmin) return null;
      return AdminAuditLog.find({ $text: { $search: term } }, { score: { $meta: 'textScore' } })
        .sort({ score: { $meta: 'textScore' } }).limit(limit)
        .select('adminEmail action targetType targetName status createdAt').lean();
    };

    // Execute all valid promises currently
    const promises = {
      issues: fetchIssues(),
      communities: fetchCommunities(),
      residents: fetchResidents(),
      workers: fetchWorkers(),
      security: fetchSecurity(),
      managers: fetchManagers(),
      visitors: fetchVisitors(),
      preapprovals: fetchPreApprovals(),
      payments: fetchPayments(),
      bookings: fetchBookings(),
      amenities: fetchAmenities(),
      leaves: fetchLeaves(),
      interest: fetchInterest(),
      auditlogs: fetchAuditLogs()
    };

    // Wait for all database operations to finish concurrently
    const keys = Object.keys(promises);
    const settled = await Promise.allSettled(Object.values(promises));
    
    const results = {};
    settled.forEach((outcome, index) => {
      if (outcome.status === 'fulfilled' && outcome.value !== null) {
        results[keys[index]] = outcome.value;
      }
    });

    return results;
  }
}
