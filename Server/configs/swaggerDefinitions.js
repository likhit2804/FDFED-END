/**
 * Centralized Swagger definitions for pipeline routes.
 * swagger-jsdoc scans this file via the apis glob in swaggerConfig.js.
 */

// ================================================================
// MANAGER ROUTES (mounted at /manager)
// ================================================================

// --- Dashboard ---
/**
 * @swagger
 * /manager/api/dashboard:
 *   get:
 *     summary: Get manager dashboard data
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard stats (issues, residents, payments, recent activity)
 */

// --- Common Space Booking (CSB) ---
/**
 * @swagger
 * /manager/commonSpace:
 *   get:
 *     summary: Get all common spaces for the community
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of common spaces
 */

/**
 * @swagger
 * /manager/commonSpace/api/bookings:
 *   get:
 *     summary: Get all common space bookings
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookings
 */

/**
 * @swagger
 * /manager/commonSpace/reject/{id}:
 *   post:
 *     summary: Reject a common space booking
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking rejected
 */

/**
 * @swagger
 * /manager/spaces:
 *   post:
 *     summary: Create a new common space
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Space created
 */

/**
 * @swagger
 * /manager/spaces/{id}:
 *   put:
 *     summary: Update a common space
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Space updated
 *   delete:
 *     summary: Delete a common space
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Space deleted
 */

// --- Issues ---
/**
 * @swagger
 * /manager/issue/myIssues:
 *   get:
 *     summary: Get all issues for the manager's community
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of issues
 */

/**
 * @swagger
 * /manager/issue/assign/{id}:
 *   post:
 *     summary: Assign an issue to a worker
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Issue assigned
 */

/**
 * @swagger
 * /manager/issue/reassign/{id}:
 *   post:
 *     summary: Reassign an issue to a different worker
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Issue reassigned
 */

/**
 * @swagger
 * /manager/issue/close/{id}:
 *   post:
 *     summary: Close an issue
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Issue closed
 */

// --- Payments ---
/**
 * @swagger
 * /manager/payments:
 *   get:
 *     summary: Get all payments for the community
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payments
 */

/**
 * @swagger
 * /manager/payment:
 *   post:
 *     summary: Create a payment for a resident
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Payment created
 */

/**
 * @swagger
 * /manager/payment/{id}:
 *   put:
 *     summary: Update a payment
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment updated
 *   delete:
 *     summary: Delete a payment
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment deleted
 */

// ================================================================
// RESIDENT ROUTES (mounted at /resident)
// ================================================================

/**
 * @swagger
 * /resident/api/dashboard:
 *   get:
 *     summary: Get resident dashboard data
 *     tags: [Resident]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard with ads, recent activity, notifications, pending payments
 */

// --- Issues ---
/**
 * @swagger
 * /resident/issue/raise:
 *   post:
 *     summary: Raise a new issue
 *     tags: [Resident]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Issue created
 */

/**
 * @swagger
 * /resident/issue/data:
 *   get:
 *     summary: Get all issues raised by the resident
 *     tags: [Resident]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of resident issues
 */

/**
 * @swagger
 * /resident/issue/confirmIssue/{id}:
 *   post:
 *     summary: Confirm issue resolution
 *     tags: [Resident]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Issue confirmed resolved
 */

/**
 * @swagger
 * /resident/issue/rejectIssueResolution/{id}:
 *   post:
 *     summary: Reject issue resolution (reopen)
 *     tags: [Resident]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Issue reopened
 */

/**
 * @swagger
 * /resident/issue/submitFeedback:
 *   post:
 *     summary: Submit feedback for a resolved issue
 *     tags: [Resident]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Feedback submitted
 */

// --- Payments ---
/**
 * @swagger
 * /resident/payments:
 *   get:
 *     summary: Get all payments for the resident
 *     tags: [Resident]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payments
 */

/**
 * @swagger
 * /resident/payment:
 *   post:
 *     summary: Make a self-payment
 *     tags: [Resident]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Payment created
 */

// --- Common Space Booking ---
/**
 * @swagger
 * /resident/commonSpace:
 *   get:
 *     summary: Get available common spaces
 *     tags: [Resident]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of bookable common spaces
 *   post:
 *     summary: Create a booking for a common space
 *     tags: [Resident]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Booking created
 */

// --- Pre-approvals ---
/**
 * @swagger
 * /resident/preApprovals:
 *   get:
 *     summary: Get all visitor pre-approvals
 *     tags: [Resident]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pre-approvals
 */

/**
 * @swagger
 * /resident/preapproval:
 *   post:
 *     summary: Create a visitor pre-approval
 *     tags: [Resident]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Pre-approval created
 */

// ================================================================
// SECURITY ROUTES (mounted at /security)
// ================================================================

/**
 * @swagger
 * /security/dashboard/api:
 *   get:
 *     summary: Get security dashboard data
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Security dashboard info
 */

/**
 * @swagger
 * /security/preApproval:
 *   get:
 *     summary: Get pre-approvals for the community
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pre-approvals pending verification
 */

/**
 * @swagger
 * /security/preApproval/action:
 *   post:
 *     summary: Update pre-approval status (allow/deny entry)
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Status updated
 */

/**
 * @swagger
 * /security/verify-qr:
 *   post:
 *     summary: Verify a visitor QR code
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               qrData:
 *                 type: string
 *     responses:
 *       200:
 *         description: QR verified — visitor details returned
 */

// ================================================================
// WORKER ROUTES (mounted at /worker)
// ================================================================

/**
 * @swagger
 * /worker/getDashboardData:
 *   get:
 *     summary: Get worker dashboard data
 *     tags: [Worker]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Worker dashboard stats
 */

/**
 * @swagger
 * /worker/history:
 *   get:
 *     summary: Get worker task history
 *     tags: [Worker]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of completed tasks
 */

/**
 * @swagger
 * /worker/api/tasks:
 *   get:
 *     summary: Get worker's active tasks
 *     tags: [Worker]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active tasks (Assigned, In Progress, Reopened)
 */

/**
 * @swagger
 * /worker/issue/start/{id}:
 *   post:
 *     summary: Start working on an issue
 *     tags: [Worker]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Issue status changed to In Progress
 */

/**
 * @swagger
 * /worker/issue/resolve/{id}:
 *   post:
 *     summary: Mark an issue as resolved
 *     tags: [Worker]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Issue resolved
 */

/**
 * @swagger
 * /worker/issue/misassigned/{id}:
 *   post:
 *     summary: Report an issue as misassigned
 *     tags: [Worker]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Issue flagged as misassigned
 */

// ================================================================
// LEAVES (mounted at /leaves)
// ================================================================

/**
 * @swagger
 * /leaves:
 *   post:
 *     summary: Worker applies for leave
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Leave application submitted
 *   get:
 *     summary: Get leave applications (worker sees own, manager sees all)
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of leave applications
 */

/**
 * @swagger
 * /leaves/{id}/approve:
 *   put:
 *     summary: Manager approves a leave application
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Leave approved
 */

/**
 * @swagger
 * /leaves/{id}/reject:
 *   put:
 *     summary: Manager rejects a leave application
 *     tags: [Leaves]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Leave rejected
 */

// ================================================================
// INTEREST & ONBOARDING (mounted at /interest — public)
// ================================================================

/**
 * @swagger
 * /interest:
 *   get:
 *     summary: Show interest form page
 *     tags: [Interest & Onboarding]
 *     responses:
 *       200:
 *         description: Interest form HTML
 */

/**
 * @swagger
 * /interest/submit:
 *   post:
 *     summary: Submit an interest form with photos
 *     tags: [Interest & Onboarding]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, phone, communityName, location, description]
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               communityName:
 *                 type: string
 *               location:
 *                 type: string
 *               description:
 *                 type: string
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Application submitted
 *       409:
 *         description: Duplicate email or community+location
 */

/**
 * @swagger
 * /interest/onboarding/{token}:
 *   get:
 *     summary: Get onboarding details by token (public)
 *     tags: [Interest & Onboarding]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Applicant details and available subscription plans
 *       400:
 *         description: Invalid or expired token
 */

/**
 * @swagger
 * /interest/onboarding/complete:
 *   post:
 *     summary: Complete onboarding payment and activate account
 *     tags: [Interest & Onboarding]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, paymentDetails]
 *             properties:
 *               token:
 *                 type: string
 *               paymentDetails:
 *                 type: object
 *                 properties:
 *                   plan:
 *                     type: string
 *                   amount:
 *                     type: number
 *                   method:
 *                     type: string
 *     responses:
 *       200:
 *         description: Account activated, credentials emailed
 */

// ================================================================
// NOTIFICATIONS (all 4 roles — shared pattern)
// ================================================================

/**
 * @swagger
 * /manager/notifications:
 *   get:
 *     summary: Get notifications (Manager)
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 */
/**
 * @swagger
 * /manager/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read (Manager)
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Done
 */
/**
 * @swagger
 * /manager/notifications/{id}/read:
 *   patch:
 *     summary: Mark one notification as read (Manager)
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Done
 */
/**
 * @swagger
 * /manager/notifications/{id}:
 *   delete:
 *     summary: Delete a notification (Manager)
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted
 */

/**
 * @swagger
 * /resident/notifications:
 *   get:
 *     summary: Get notifications (Resident)
 *     tags: [Resident]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 */
/**
 * @swagger
 * /resident/notifications/read-all:
 *   patch:
 *     summary: Mark all notifications as read (Resident)
 *     tags: [Resident]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Done
 */
/**
 * @swagger
 * /resident/notifications/{id}:
 *   delete:
 *     summary: Delete a notification (Resident)
 *     tags: [Resident]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted
 */

/**
 * @swagger
 * /security/notifications:
 *   get:
 *     summary: Get notifications (Security)
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 */
/**
 * @swagger
 * /security/notifications/{id}:
 *   delete:
 *     summary: Delete a notification (Security)
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted
 */

/**
 * @swagger
 * /worker/notifications:
 *   get:
 *     summary: Get notifications (Worker)
 *     tags: [Worker]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of notifications
 */
/**
 * @swagger
 * /worker/notifications/{id}:
 *   delete:
 *     summary: Delete a notification (Worker)
 *     tags: [Worker]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notification deleted
 */

// ================================================================
// ADS / ADVERTISEMENTS
// ================================================================

/**
 * @swagger
 * /manager/api/ad:
 *   get:
 *     summary: Get all advertisements (Manager)
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of advertisements
 *   post:
 *     summary: Create advertisement (with image upload)
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               startDate:
 *                 type: string
 *                 format: date
 *               endDate:
 *                 type: string
 *                 format: date
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Advertisement created
 */
/**
 * @swagger
 * /manager/api/ad/{id}:
 *   put:
 *     summary: Update advertisement
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated
 */
/**
 * @swagger
 * /manager/ad/{id}:
 *   delete:
 *     summary: Delete advertisement
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 */

/**
 * @swagger
 * /resident/ad:
 *   get:
 *     summary: Get active advertisements (Resident)
 *     tags: [Resident]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active ads
 */
/**
 * @swagger
 * /security/ad:
 *   get:
 *     summary: Get active advertisements (Security)
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active ads
 */
/**
 * @swagger
 * /worker/ad:
 *   get:
 *     summary: Get active advertisements (Worker)
 *     tags: [Worker]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active ads
 */

// ================================================================
// PROFILE
// ================================================================

/**
 * @swagger
 * /manager/profile/api:
 *   get:
 *     summary: Get manager profile with community info
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Manager + community profile
 */
/**
 * @swagger
 * /manager/profile:
 *   post:
 *     summary: Update manager profile (optional image)
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Profile updated
 */
/**
 * @swagger
 * /manager/profile/changePassword:
 *   post:
 *     summary: Change manager password
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed
 */

/**
 * @swagger
 * /resident/profile:
 *   get:
 *     summary: Get resident profile
 *     tags: [Resident]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Resident profile data
 *   post:
 *     summary: Update resident profile (optional image)
 *     tags: [Resident]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile updated
 */
/**
 * @swagger
 * /resident/change-password:
 *   post:
 *     summary: Change resident password
 *     tags: [Resident]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Password changed
 */

// ================================================================
// SUBSCRIPTION (Manager)
// ================================================================

/**
 * @swagger
 * /manager/community-details:
 *   get:
 *     summary: Get community subscription details
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Community details with plan info
 */
/**
 * @swagger
 * /manager/subscription-payment:
 *   post:
 *     summary: Process a subscription payment
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment processed
 */
/**
 * @swagger
 * /manager/subscription-history:
 *   get:
 *     summary: Get subscription payment history
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of past subscription payments
 */
/**
 * @swagger
 * /manager/subscription-status:
 *   get:
 *     summary: Get current subscription status
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: active / expired / grace
 */
/**
 * @swagger
 * /manager/api/payments:
 *   get:
 *     summary: Get payment data (subscription context)
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment records
 */
/**
 * @swagger
 * /manager/subscription-plans:
 *   get:
 *     summary: Get available subscription plans
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of plans
 */
/**
 * @swagger
 * /manager/change-plan:
 *   post:
 *     summary: Change community subscription plan
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Plan changed
 */

// ================================================================
// USER MANAGEMENT (Manager)
// ================================================================

/**
 * @swagger
 * /manager/userManagement:
 *   get:
 *     summary: Get all users grouped by role (residents, security, workers)
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All users
 */
/**
 * @swagger
 * /manager/userManagement/resident:
 *   post:
 *     summary: Create a resident
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Resident created
 */
/**
 * @swagger
 * /manager/userManagement/resident/{id}:
 *   get:
 *     summary: Get a resident by ID
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resident data
 *   delete:
 *     summary: Delete a resident
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resident deleted
 */
/**
 * @swagger
 * /manager/userManagement/security:
 *   post:
 *     summary: Create a security staff member
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Created
 */
/**
 * @swagger
 * /manager/userManagement/security/{id}:
 *   get:
 *     summary: Get security staff by ID
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Security staff data
 *   delete:
 *     summary: Delete security staff
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 */
/**
 * @swagger
 * /manager/userManagement/worker:
 *   post:
 *     summary: Create a worker
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Worker created
 */
/**
 * @swagger
 * /manager/userManagement/worker/{id}:
 *   get:
 *     summary: Get worker by ID
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Worker data
 *   delete:
 *     summary: Delete a worker
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 */
/**
 * @swagger
 * /manager/workers:
 *   get:
 *     summary: Get all workers (simplified list)
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of workers
 */

// ================================================================
// COMMUNITY STRUCTURE (Manager)
// ================================================================

/**
 * @swagger
 * /manager/communities:
 *   get:
 *     summary: Get manager's communities (paginated)
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Paginated list
 *   post:
 *     summary: Create a new community (with photos)
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Community created
 */
/**
 * @swagger
 * /manager/communities/{id}:
 *   get:
 *     summary: Get community by ID (Manager)
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Community data
 */
/**
 * @swagger
 * /manager/payment-stats:
 *   get:
 *     summary: Get payment stats for this month
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly payment totals
 */
/**
 * @swagger
 * /manager/community/rotate-code:
 *   post:
 *     summary: Rotate community registration code
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: New code generated
 */
/**
 * @swagger
 * /manager/get-structure:
 *   get:
 *     summary: Get community structure (blocks, flats)
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Structure data
 */
/**
 * @swagger
 * /manager/setup-structure:
 *   post:
 *     summary: Initialize community block/flat structure
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Structure created
 */
/**
 * @swagger
 * /manager/registration-codes:
 *   get:
 *     summary: Get all resident registration codes
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Codes per flat
 */
/**
 * @swagger
 * /manager/registration-codes/regenerate:
 *   post:
 *     summary: Regenerate registration codes for vacant flats
 *     tags: [Manager]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Codes regenerated
 */

// ================================================================
// VISITOR MANAGEMENT (Security)
// ================================================================

/**
 * @swagger
 * /security/addVisitor:
 *   post:
 *     summary: Add a walk-in visitor record
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [visitorType, fullName, contact]
 *             properties:
 *               visitorType:
 *                 type: string
 *               fullName:
 *                 type: string
 *               contact:
 *                 type: string
 *               email:
 *                 type: string
 *               vehicleNo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Visitor added
 */
/**
 * @swagger
 * /security/visitorManagement:
 *   get:
 *     summary: Get visitor management data
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Visitor data
 */
/**
 * @swagger
 * /security/visitorManagement/api/visitors:
 *   get:
 *     summary: Get live visitor list (for auto-refresh)
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Visitors with check-in/out status
 */
/**
 * @swagger
 * /security/visitorManagement/{action}/{id}:
 *   get:
 *     summary: Check-in or check-out a visitor
 *     tags: [Security]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: action
 *         required: true
 *         schema:
 *           type: string
 *           enum: [checkin, checkout]
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Visitor status updated
 */

// ================================================================
// RESIDENT IN-APP REGISTRATION
// ================================================================

/**
 * @swagger
 * /resident/register/request-otp:
 *   post:
 *     summary: Request OTP for in-app registration
 *     tags: [Resident]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OTP sent
 */
/**
 * @swagger
 * /resident/register/verify-otp:
 *   post:
 *     summary: Verify OTP for in-app registration
 *     tags: [Resident]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OTP verified
 */
/**
 * @swagger
 * /resident/register/complete:
 *   post:
 *     summary: Complete in-app registration (set permanent password)
 *     tags: [Resident]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Registration complete
 */

