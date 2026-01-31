# Onboarding Flow Redesign - Walkthrough

This document outlines the changes made to redesign the Community Manager onboarding flow to a Payment-First approach.

## 1. Backend Changes

### `Interest` Model
- Added `paymentStatus` (pending, completed).
- Added `onboardingToken` and `onboardingTokenExpires`.
- Removed duplicate fields and fixed schema structure.

### `interestForm.js` (Controller)
- **`approveApplication`**: Now only generates a token and sends an email with a payment link. It *does not* create the manager account immediately.
- **`getOnboardingDetails`**: New public endpoint that validates the token and returns applicant details + available subscription plans.
- **`completeOnboardingPayment`**: New public endpoint that verifies the token, mocked payment processing, creates the `CommunityManager` and `Community` accounts, and sends the credentials via email.
- **`resendPaymentLink`**: Resends the Payment Link (regenerates token) if the status is 'approved' and payment is 'pending'.

### Routes
- **`InterestRouter.js`**: Added public routes:
    - `GET /onboarding/:token`
    - `POST /onboarding/complete`
    - Improved Email Templates: Implemented professional HTML templates (from `otp.js` style) for Approval, Payment Links, and Welcome emails.
- **`adminRouter.js`**: Added admin route:
    - `POST /interests/:id/resend-link`

## 2. Frontend Changes

### New Page: `OnboardingPayment.jsx`
- Located at `/onboarding/payment`.
- Accessible via the link sent in the email.
- **UI Logic**: Matches the `SignIn` page design (Split screen, branding on left, content on right).
- **Responsive**: Inherits responsiveness from `SignIn.css` but overrides fixed height to allow dynamic content growth on desktop (fixes internal scrolling).
- Displays "Welcome" message and Subscription Plans (Vertical list for better usability).
- Handles mock payment and account activation.
- Shows success message with instructions to check email for credentials.

### `App.jsx`
- Added the public route `/onboarding/payment`.

### `AdminApplications.jsx`
- **Bug Fix**: `paymentStatus` is now correctly fetched, ensuring the "Completed" status updates immediately.
- **New Status**: "AWAITING PAYMENT" (Derived from `Approved` status + `Pending` payment).
- **New Filter**: Added "Awaiting Payment" tab.
- **Resend Action**: Added "Resend Payment Link" button (Blue) for "Awaiting Payment".
- **Status Badges**: Updated colors (Blue for Awaiting Payment).

## 3. How to Verify

1.  **Submit Application**: Use the public interest form to submit a new application.
2.  **Approve (Admin)**: 
    - Log in as Admin.
    - Go to Applications.
    - Click "Approve".
    - **Verify**: Status changes to "AWAITING PAYMENT" (Blue badge).
3.  **Check Email / Link**:
    - Since no real email is sent in dev (unless configured), check the server logs for the "Sending payment link to..." message. 
    - Copy the token from the log or database.
4.  **Payment Page**:
    - Go to `http://localhost:5173/onboarding/payment?token=YOUR_TOKEN`.
    - Select a plan and click "Pay".
    - **Verify**: Success message appears.
5.  **Admin Check**:
    - Refresh Admin dashboard.
    - **Verify**: Application status changes to "COMPLETED" (Green badge).
6.  **Login**:
    - Use the credentials (from server logs or email if working) to log in as the new Community Manager.

## 4. Screenshots
(Placeholder for screenshots if available)
