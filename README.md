# UrbanEase — Smart Residential Community Management Platform

UrbanEase is an enterprise-grade, full-stack community management platform built for modern gated communities, housing societies, and residential apartment complexes. It orchestrates role-based digital operations across five distinct user roles (Super Admin, Community Manager, Resident, Worker/Staff, and Gate Security Guard), powers real-time gate security and ticketing, automates maintenance billing with payment gateway integrations, and exposes API-key-authenticated B2B endpoints for external partner integrations.

---

## Table of Contents

- [Core Platform Capabilities](#core-platform-capabilities)
- [System Architecture & Data Flow](#system-architecture--data-flow)
- [Technology Stack](#technology-stack)
- [Project Directory Structure](#project-directory-structure)
- [Environment Variables Guide](#environment-variables-guide)
- [Database Models & Schemas](#database-models--schemas)
- [Comprehensive API Routes Directory](#comprehensive-api-routes-directory)
  - [1. Authentication & 2FA Routes](#1-authentication--2fa-routes)
  - [2. Public Onboarding & Resident Self-Registration](#2-public-onboarding--resident-self-registration)
  - [3. Resident Portal Routes](#3-resident-portal-routes)
  - [4. Community Manager Portal Routes](#4-community-manager-portal-routes)
  - [5. Worker / Maintenance Staff Routes](#5-worker--maintenance-staff-routes)
  - [6. Gate Security Routes](#6-gate-security-routes)
  - [7. Worker Leave Pipeline](#7-worker-leave-pipeline)
  - [8. Super Admin Management Routes](#8-super-admin-management-routes)
  - [9. Redis Caching & System Diagnostics](#9-redis-caching--system-diagnostics)
  - [10. Global Search API](#10-global-search-api)
  - [11. B2B Partner API (API Key Authenticated)](#11-b2b-partner-api-api-key-authenticated)
- [Real-Time Socket.IO Architecture](#real-time-socketio-architecture)
- [External Integrations](#external-integrations)
  - [Razorpay Payment Gateway](#razorpay-payment-gateway)
  - [Transactional Email Delivery Engine](#transactional-email-delivery-engine)
  - [Cloudinary Media Cloud Storage](#cloudinary-media-cloud-storage)
  - [Redis Response Caching Engine](#redis-response-caching-engine)
- [Local Installation & Development](#local-installation--development)
- [Docker & Containerized Deployment](#docker--containerized-deployment)
- [Automated Testing & Benchmarks](#automated-testing--benchmarks)
- [Seed Data & Demo Credentials](#seed-data--demo-credentials)
- [License & Support](#license--support)

---

## Core Platform Capabilities

### 1. Multi-Tenant Role Architecture
- **Super Admin:** Global oversight across registered housing societies, subscription plan management, public onboarding approvals, system-wide feature flags (2FA bypass, maintenance mode), and security audit logs.
- **Community Manager:** Manages society structure (blocks, floors, flats), assigns residents, tracks maintenance dues, dispatches workers to complaints, oversees amenities and common spaces, approves worker leave requests, and manages society subscription renewals.
- **Resident:** Raises maintenance complaints with photo attachments, books common spaces (clubhouse, tennis court, hall) with real-time slot conflict prevention, pre-approves visitor entry with 6-digit access codes, views and pays monthly dues through Razorpay, and receives live push notifications.
- **Worker / Staff:** Specialized service personnel (Electrician, Plumber, Cleaner, Carpenter, Security, etc.) view assigned tasks, transition task status (Start / In-Progress / Resolved) with photo proof, inspect completed history, and apply for leaves.
- **Gate Security:** Logs walk-in visitors, verifies delivery drivers and cabs, verifies resident pre-approval codes, captures visitor vehicle numbers, and checks out visitors in real time.

### 2. High-Trust Security & 2FA Engine
- Role-segregated JWTs with strict cookie/header extraction.
- Universal Two-Factor Authentication (2FA) via time-sensitive, single-use 6-digit OTP codes delivered via direct SMTP or HTTPS fallback APIs.
- Rate-limiting middleware on all authentication, password-reset, and OTP endpoints to thwart brute-force attacks.
- Tamper-proof Razorpay cryptographic signature verification (`HMAC-SHA256`).

### 3. Automated Complaint Dispatch & SLA Escalation
- Automated priority assignment (Low, Medium, High, Urgent) based on domain categories and issue description keyword parsing.
- Automated worker assignment allocating available, active workers in the relevant skill category while excluding workers on approved leave.

---

## System Architecture & Data Flow

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 Client Tier (React 19 + Vite)                          │
│   ┌───────────────┬─────────────────┬──────────────┬───────────────┬───────────────┐   │
│   │ Admin Console │ Manager Portal  │ Resident App │ Worker Portal │ Security Gate │   │
│   └───────┬───────┴────────┬────────┴──────┬───────┴───────┬───────┴───────┬───────┘   │
└───────────┼────────────────┼───────────────┼───────────────┼───────────────┼───────────┘
            │ HTTP / HTTPS (REST API)        │ WebSockets (Socket.IO Real-Time Engine)
            ▼                                ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              Application Tier (Express 5 Engine)                       │
│  ┌─────────────────┬───────────────────┬───────────────────┬────────────────────────┐  │
│  │ Auth & 2FA      │ RBAC Middleware   │ Rate Limiters     │ Cache Engine (Redis)   │  │
│  │ JWT Verification│ attachCommunity   │ Helmet & Morgan   │ Hit / Miss / Bypass    │  │
│  └─────────────────┴───────────────────┴───────────────────┴────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│  │ Routers: /admin, /manager, /resident, /worker, /security, /leaves, /api/v1 (B2B) │  │
│  └──────────────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────┬───────────────────────────────┬────────────────────────────────┘
                        │ Mongoose 8                    │ Third-Party REST APIs
                        ▼                               ▼
┌───────────────────────────────────────────────┐ ┌──────────────────────────────────────┐
│                  Data Tier                    │ │         External Services            │
│  ┌───────────────────┬─────────────────────┐  │ │  ┌───────────────┬────────────────┐  │
│  │ MongoDB Database  │ Redis Cache Store   │  │ │  │ Razorpay      │ Cloudinary     │  │
│  │ 23 Domain Models  │ Bootstrap Keys      │  │ │  │ Payments API  │ Media CDN      │  │
│  └───────────────────┴─────────────────────┘  │ │  ├───────────────┼────────────────┤  │
│                                               │ │  │ Gmail SMTP    │ Brevo / Resend │  │
│                                               │ │  │ Port 587      │ Fallback (443) │  │
│                                               │ │  └───────────────┴────────────────┘  │
└───────────────────────────────────────────────┘ └──────────────────────────────────────┘
```

---

## Technology Stack

| Domain | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React | 19.x | Component-driven, responsive user interface |
| **Build & Dev Tool** | Vite | 7.x | Hot Module Replacement (HMR) and production bundling |
| **State Management** | Redux Toolkit | 2.x | Centralized authentication and global application state |
| **UI Components & Styling** | Vanilla CSS + Bootstrap | 5.x | Custom CSS design system, responsive grids, and modals |
| **Animations & Icons** | Framer Motion & Lucide | Latest | Dynamic transitions, smooth micro-interactions, icons |
| **Charts & Analytics** | Recharts | 2.x | Financial, issue, and visitor metric visualizations |
| **Backend Framework** | Node.js / Express | 5.x | Non-blocking REST API server and pipeline orchestration |
| **Database** | MongoDB & Mongoose | 8.x | Object data modeling, compound indexing, transactions |
| **In-Memory Cache** | Redis (`ioredis`) | 5.x | Sub-millisecond dashboard and bootstrap response caching |
| **Real-Time Engine** | Socket.IO | 4.x | Bi-directional event broadcasting across community rooms |
| **Security & Hardening** | Helmet, Morgan, bcrypt | Latest | Secure HTTP headers, access logging, password hashing |
| **API Documentation** | Swagger UI Express | Latest | Interactive OpenAPI 3.0 specification at `/api-docs` |
| **Payments** | Razorpay Node SDK | 2.x | Order creation, webhook validation, signature checking |
| **Media Management** | Cloudinary & Multer | Latest | Secure cloud storage for issue photos, KYC, and avatars |
| **Email Transport** | Nodemailer & HTTP APIs | 6.x | Gmail direct transport with Brevo/Resend fallback |

---

## Project Directory Structure

```
urbanease/FDFED-END/
├── Client/                             # React 19 Frontend
│   ├── public/                         # PWA manifests, favicons, static images
│   ├── src/
│   │   ├── assets/                     # Images, icons, brand assets
│   │   ├── components/                 # Shared UI components (Modals, Pills, Badges)
│   │   │   ├── shared/                 # Common reusable cards, tables, wrappers
│   │   │   ├── ui/                     # Primitives (Dropdowns, Tabs, DatePickers)
│   │   ├── context/                    # React Context providers (SocketContext)
│   │   ├── hooks/                      # Custom hooks (useSocket, useAuth)
│   │   ├── layouts/                    # Role-specific shells (RolePageShell, ManagerPageShell)
│   │   ├── pages/                      # Role-specific page views
│   │   │   ├── Admin/                  # Societies, Plans, Audit Logs, Settings
│   │   │   ├── CommunityManager/       # Dashboard, Structure, Users, CSB, Payments, Leaves
│   │   │   ├── Resident/               # Dashboard, Issues, Bookings, Payments, Preapproval
│   │   │   ├── Worker/                 # Tasks, History, Leaves, Profile
│   │   │   ├── Security/               # Visitors, Entry Codes, Logs
│   │   │   ├── Landing/                # Landing Page, Interest Form, Onboarding Payment
│   │   │   └── Auth/                   # SignIn, 2FA OTP, Forgot Password
│   │   ├── redux/                      # Redux Toolkit slices (authSlice, etc.)
│   │   ├── routes/                     # React Router configurations & Role Route Guards
│   │   ├── utils/                      # Axios clients, formatters, storage helpers
│   │   ├── App.jsx                     # Top-level application component
│   │   └── main.jsx                    # Vite application entry point
│   ├── package.json
│   └── vite.config.js                  # Vite configuration & path aliasing
│
├── Server/                             # Express 5 Backend
│   ├── __tests__/                      # Automated Jest test suites
│   ├── configs/                        # Swagger & cloud service configurations
│   ├── controllers/                    # Shared controllers & authorization guards
│   ├── middleware/                     # attachCommunity, apiKeyAuth, cacheMiddleware, subStatus
│   ├── models/                         # 23 Mongoose schemas & domain models
│   ├── pipelines/                      # Domain-driven feature pipelines
│   │   ├── CSB/                        # Common Space Booking pipeline
│   │   ├── Preapproval/                # Resident visitor pass generation
│   │   ├── VistorManagement/           # Security visitor check-in/out
│   │   ├── community/                  # Block & Flat structural management
│   │   ├── communityRegistration/      # Manager onboarding & default plan setup
│   │   ├── dashboard/                  # Role-specific dashboard aggregations
│   │   ├── issue/                      # Helpdesk ticketing & automated assignment
│   │   ├── notifications/              # In-app notification feed & updates
│   │   ├── payment/                    # Maintenance dues & Razorpay verification
│   │   ├── profile/                    # Profile management & password updates
│   │   ├── residentRegistration/       # Flat registration code verification
│   │   ├── subscription/               # Society subscription plans & renewals
│   │   ├── userManagement/             # Manager resident, worker & security CRUD
│   │   └── workerLeave/                # Worker leave requests & manager approvals
│   ├── routes/                         # Top-level Express route group definitions
│   ├── seeder/                         # Database wiping & multi-role demo seeding
│   ├── services/                       # External services (Razorpay, Cloudinary)
│   ├── utils/                          # Email templates, OTP helpers, Socket handlers
│   ├── server.js                       # Express server initialization & socket attachment
│   └── package.json
│
├── docker-compose.yml                  # Multi-container orchestration (Web, API, Mongo, Redis)
└── README.md                           # Master documentation
```

---

## Environment Variables Guide

Configure `Server/.env` before launching the application. An example template is provided in `Server/.env.example`.

### Server Configuration

| Variable | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `PORT` | Number | `3000` | No | Port on which the Express server listens. |
| `NODE_ENV` | String | `development` | No | Environment mode (`development` or `production`). |
| `MONGO_URI1` | String | — | **Yes** | MongoDB connection string (Local or MongoDB Atlas). |
| `JWT_SECRET` | String | — | **Yes** | Secret key for signing role JWTs (Minimum 32 characters). |
| `SESSION_SECRET` | String | — | No | Express session encryption secret. |
| `CLIENT_BASE_URL` | String | `http://localhost:5173` | **Yes** | Canonical frontend origin for email links and CORS matching. |
| `FRONTEND_URL` | String | `http://localhost:5173` | No | Secondary frontend URL alias. |

### Email Service Configuration

| Variable | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `EMAIL_USER` | String | — | **Yes** | Sender email address (e.g. your Gmail account). |
| `EMAIL_PASS` | String | — | **Yes** | 16-character Google App Password (spaces stripped automatically). |
| `EMAIL_FROM` | String | `UrbanEase Support` | No | Formatted `From` header string. |
| `EMAIL_FROM_NAME` | String | `UrbanEase Support` | No | Display name used in emails. |
| `SMTP_HOST` | String | `smtp.gmail.com` | No | Outgoing SMTP server address. |
| `SMTP_PORT` | Number | `587` | No | Outgoing SMTP port (`587` for TLS, `465` for SSL). |
| `SMTP_SECURE` | Boolean | `false` | No | Set `true` if connecting via port `465`. |
| `BREVO_API_KEY` | String | — | No | *Optional:* Brevo HTTP API key for HTTPS port 443 fallback. |
| `RESEND_API_KEY` | String | — | No | *Optional:* Resend HTTP API key for HTTPS port 443 fallback. |

### Media & Cloud Storage (Cloudinary)

| Variable | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `CLOUDINARY_CLOUD_NAME` | String | — | **Yes** | Cloudinary account cloud identifier. |
| `CLOUDINARY_API_KEY` | String | — | **Yes** | Cloudinary API key for secure uploads. |
| `CLOUDINARY_API_SECRET` | String | — | **Yes** | Cloudinary API secret. |

### Payment Gateway (Razorpay)

| Variable | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `RAZORPAY_KEY_ID` | String | — | **Yes** | Razorpay Key ID (Test key: `rzp_test_...` or Live key). |
| `RAZORPAY_KEY_SECRET` | String | — | **Yes** | Razorpay Key Secret for cryptographic signature verification. |

### Caching & B2B Integration

| Variable | Type | Default | Required | Description |
| :--- | :--- | :--- | :--- | :--- |
| `REDIS_URL` | String | `redis://127.0.0.1:6379`| No | Redis connection URI for caching and session state. |
| `API_KEYS` | String | `ue-demo-api-key-2024` | No | Comma-separated API keys authorized to access B2B `/api/v1` routes. |

---

## Database Models & Schemas

The application is backed by 23 Mongoose models organized across domain boundaries:

| # | Model Name | Primary File | Core Fields & References | Domain Responsibility |
| :--- | :--- | :--- | :--- | :--- |
| 1 | **Admin** | `models/admin.js` | `name`, `email`, `password`, `role`, `permissions` | Super Admin account with full system governance. |
| 2 | **AdminAuditLog** | `models/adminAuditLog.js` | `adminId`, `action`, `entityType`, `entityId`, `details`, `ipAddress` | Immutable security audit trail recording all administrative interventions. |
| 3 | **SystemSettings** | `models/systemSettings.js` | `key`, `skip2FA`, `maintenanceMode`, `announcement` | System-wide runtime feature flags. |
| 4 | **SubscriptionPlan** | `models/subscriptionPlan.js` | `planKey`, `name`, `price`, `duration`, `maxResidents`, `features`, `isActive` | Master subscription pricing tiers for communities. |
| 5 | **CommunitySubscription** | `models/communitySubscription.js` | `communityId`, `planId`, `amount`, `duration`, `status`, `planStartDate`, `planEndDate`, `razorpayPaymentId` | Society subscription payment records and active renewal state. |
| 6 | **Community** | `models/communities.js` | `name`, `location`, `communityCode`, `images`, `managerId`, `subscriptionStatus`, `hasStructure` | Core society entity defining address, code, and structural state. |
| 7 | **CommunityManager** | `models/cManager.js` | `name`, `email`, `password`, `phone`, `role`, `community` (Ref), `isActive` | Society executive managing daily building operations. |
| 8 | **Block** | `models/blocks.js` | `name`, `totalFloors`, `flatsPerFloor`, `community` (Ref) | Physical tower or wing within a gated society. |
| 9 | **Flat** | `models/flats.js` | `flatNumber`, `floor`, `block` (Ref), `community` (Ref), `status` (`Vacant`/`Occupied`), `residentId`, `registrationCode` | Individual residential apartment unit and access registration code. |
| 10 | **Resident** | `models/resident.js` | `name`, `email`, `password`, `phone`, `community` (Ref), `flat` (Ref), `block` (Ref), `moveInDate`, `familyMembers`, `vehicles`, `notifications` | Resident profile, apartment occupancy, and personal notification feed. |
| 11 | **Worker** | `models/workers.js` | `name`, `email`, `password`, `phone`, `skills` (`Electrician`, `Plumber`, etc.), `community` (Ref), `isActive`, `rating` | Society maintenance staff and technical trade classification. |
| 12 | **Security** | `models/security.js` | `name`, `email`, `password`, `phone`, `community` (Ref), `shift` (`Morning`/`Evening`/`Night`), `gateNumber` | Gate security personnel managing perimeter access. |
| 13 | **Visitor** | `models/visitors.js` | `name`, `phone`, `community` (Ref), `residentId` (Ref), `vehicleNumber`, `status` (`Expected`/`CheckedIn`/`CheckedOut`), `entryCode` | Comprehensive visitor gate logs and transit records. |
| 14 | **Preapproval** | `models/preapproval.js` | `residentId` (Ref), `community` (Ref), `guestName`, `guestPhone`, `expectedDate`, `entryCode`, `status`, `validUntil` | Resident-generated visitor access passes with unique OTP codes. |
| 15 | **CommonSpaces** | `models/commonSpaces.js` | `name`, `description`, `community` (Ref), `capacity`, `pricePerHour`, `requiresPayment`, `slots`, `bookings` | Society amenities (Clubhouse, Gym, Hall) and slot bookings. |
| 16 | **Amenities** | `models/Amenities.js` | `name`, `category`, `community` (Ref), `isOperational`, `timings`, `rules` | Catalog of society infrastructure facilities and rules. |
| 17 | **Issue** | `models/issues.js` | `issueID`, `title`, `description`, `category`, `priority`, `status`, `resident` (Ref), `assignedWorker` (Ref), `images`, `timeline` | Resident maintenance complaints and ticket resolution workflow. |
| 18 | **Leave** | `models/leave.js` | `workerId` (Ref), `community` (Ref), `leaveType`, `startDate`, `endDate`, `reason`, `status` (`Pending`/`Approved`/`Rejected`) | Worker leave management tracking approval cycles and auto-assignment exclusion. |
| 19 | **Payment** | `models/payment.js` | `ID`, `title`, `sender` (Ref), `community` (Ref), `amount`, `paymentType`, `status`, `paymentDeadline`, `gatewayPaymentId` | Financial dues, society maintenance bills, and Razorpay transactions. |
| 20 | **InterestForm** | `models/interestForm.js` | `name`, `email`, `phone`, `communityName`, `totalFlats`, `planKey`, `status`, `paymentStatus`, `onboardingToken` | Public society registration leads and onboarding payment tracking. |
| 21 | **Notifications** | `models/Notifications.js` | `recipient`, `recipientRole`, `title`, `message`, `type`, `read`, `link` | Historical broadcast and direct notification logs. |
| 22 | **Ad** | `models/Ad.js` | `title`, `description`, `image`, `community` (Ref), `postedBy`, `validTill` | Society bulletin board notices and announcements. |
| 23 | **DeletedCommunityBackup** | `models/deletedCommunityBackup.js` | `originalCommunityId`, `name`, `backupData`, `deletedBy`, `deletedAt` | Safety backup snapshot preserving full community state upon deletion. |

---

## Comprehensive API Routes Directory

### 1. Authentication & 2FA Routes

Mount Path: `/`

| Method | Endpoint | Auth / Middleware | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/login` | `authLimiter` | Primary login for Resident, Manager, Worker, and Security. Validates credentials and sends 2FA OTP. |
| `POST` | `/api/AdminLogin` | `authLimiter` | Super Admin login. Validates admin credentials and dispatches 2FA OTP. |
| `POST` | `/api/verify-otp` | — | Verifies 6-digit OTP code with `tempToken` and sets role-scoped `token` cookie. |
| `POST` | `/api/resend-otp` | `otpLimiter` | Re-generates and sends a new 6-digit OTP code to the user's email. |
| `POST` | `/forgot-password` | `forgotPasswordLimiter` | Issues a secure temporary password to the user's registered email address. |
| `GET` | `/api/auth/getUser` | `auth`, `cacheRoute(180)` | Retrieves the authenticated user's session profile, role, and community context. |
| `POST` | `/logout` | — | Clears authentication cookies and invalidates session. |

### 2. Public Onboarding & Resident Self-Registration

Mount Paths: `/interest`, `/resident-register`

| Method | Endpoint | Auth / Middleware | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/interest/` | Public | Displays interest application status. |
| `POST` | `/interest/submit` | `Multer (photos, max 5)` | Submits a new community onboarding interest application. |
| `GET` | `/interest/onboarding/:token` | Public | Retrieves application and plan details for an approved manager onboarding link. |
| `POST` | `/interest/onboarding/create-order` | Public | Initiates a Razorpay payment order for manager subscription activation. |
| `POST` | `/interest/onboarding/complete` | Public | Verifies Razorpay payment signature, creates manager, and generates society structure. |
| `POST` | `/resident-register/validate-code` | Public | Validates a flat's unique registration code (`UE-XXXX`) and returns block and flat details. |
| `POST` | `/resident-register/complete` | Public | Completes resident registration and issues a temporary sign-in password via email. |

### 3. Resident Portal Routes

Mount Path: `/resident`
*Guards: `auth`, `authorizeR` (Role: Resident), `attachCommunity`, `checkSubscriptionStatus`*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/resident/api/dashboard` | Aggregated resident dashboard metrics (recent tickets, dues, visitors, notifications). |
| `POST` | `/resident/register/request-otp` | Requests registration verification OTP for email validation. |
| `POST` | `/resident/register/verify-otp` | Confirms OTP validity during resident self-service onboarding. |
| `POST` | `/resident/register/complete` | Finalizes resident profile creation. |
| `GET` | `/resident/csb/spaces` | Lists available common spaces and amenities for booking. |
| `POST` | `/resident/csb/book` | Books an amenity slot with real-time overlap validation. |
| `GET` | `/resident/csb/my-bookings` | Retrieves all amenity reservations booked by the resident. |
| `POST` | `/resident/csb/cancel/:id` | Cancels an amenity reservation. |
| `GET` | `/resident/issue/my-issues` | Retrieves all maintenance complaints raised by the resident. |
| `POST` | `/resident/issue/create` | Raises a new complaint with photo attachments (Multer/Cloudinary) and auto-priority. |
| `GET` | `/resident/issue/:id` | Retrieves full ticket details, assigned worker, and resolution timeline. |
| `POST` | `/resident/preapproval/create` | Creates a visitor entry pass with vehicle number, expected date, and 6-digit access code. |
| `GET` | `/resident/preapproval/list` | Lists active and past visitor pre-approval passes. |
| `DELETE` | `/resident/preapproval/:id` | Revokes an active visitor pre-approval pass. |
| `GET` | `/resident/payment/my-payments` | Lists pending, completed, and overdue maintenance dues. |
| `POST` | `/resident/payment/:id/order` | Generates a Razorpay order for an outstanding maintenance bill. |
| `POST` | `/resident/payment/:id/verify` | Verifies Razorpay payment signature and marks bill status as Completed. |
| `GET` | `/resident/profile` | Retrieves resident personal profile, family members, and registered vehicles. |
| `POST` | `/resident/profile/update` | Updates resident contact details and uploads new profile picture. |
| `POST` | `/resident/profile/change-password` | Updates resident account password. |
| `GET` | `/resident/notifications` | Retrieves notification feed for the resident. |
| `PATCH` | `/resident/notifications/:id/read` | Marks a specific notification as read. |
| `PATCH` | `/resident/notifications/read-all` | Marks all notifications as read. |

### 4. Community Manager Portal Routes

Mount Path: `/manager`
*Guards: `auth`, `authorizeC` (Role: Community Manager), `attachCommunity`, `checkSubscription`*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/manager/dashboard/stats` | High-level analytics: total residents, revenue, open tickets, visitor count. |
| `GET` | `/manager/community/structure` | Returns society block hierarchy, floor plans, and flat occupancy breakdown. |
| `POST` | `/manager/community/blocks` | Creates a new block or wing with automated floor and flat generation. |
| `GET` | `/manager/userManagement` | Lists all community residents, workers, and security staff with pagination. |
| `POST` | `/manager/userManagement/resident` | Manually provisions a resident to a vacant flat and dispatches login credentials. |
| `DELETE` | `/manager/userManagement/resident/:id` | De-registers a resident and restores flat status to Vacant. |
| `POST` | `/manager/userManagement/worker` | Adds a staff member (trade skill, phone, shift) and sends login credentials. |
| `DELETE` | `/manager/userManagement/worker/:id` | Deactivates and deletes a maintenance worker. |
| `POST` | `/manager/userManagement/security` | Adds a gate security guard (gate assignment, shift) and sends credentials. |
| `DELETE` | `/manager/userManagement/security/:id` | Removes a gate security guard. |
| `GET` | `/manager/issue/all` | Lists all society tickets with filtering by status, category, and priority. |
| `POST` | `/manager/issue/:id/assign` | Manually dispatches an issue ticket to a specific active worker. |
| `GET` | `/manager/payment/overview` | Society billing analytics, collection totals, and pending maintenance reports. |
| `POST` | `/manager/payment/create-bill` | Generates a maintenance fee bill for all occupied flats or a specific resident. |
| `GET` | `/manager/csb/manage` | Lists all amenity reservations across the society with approval controls. |
| `POST` | `/manager/csb/create-space` | Configures a new common space (capacity, pricing per hour, operating slots). |
| `GET` | `/manager/subscription-status` | Inspects society software subscription validity, active tier, and days remaining. |
| `POST` | `/manager/subscription-payment/order` | Creates a Razorpay order for community subscription renewal. |
| `POST` | `/manager/subscription-payment` | Finalizes subscription renewal and updates community expiration date. |

### 5. Worker / Maintenance Staff Routes

Mount Path: `/worker`
*Guards: `auth`, `authorizeW` (Role: Worker), `attachCommunity`, `checkSubscriptionStatus`*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/worker/dashboard` | Worker task overview: assigned, in-progress, and resolved ticket counts. |
| `GET` | `/worker/tasks` | Lists active tickets assigned to the authenticated worker. |
| `GET` | `/worker/history` | Retrieves all resolved tickets completed by the worker with date-range filters. |
| `PATCH` | `/worker/task/:id/status` | Transitions ticket state (`In Progress` -> `Resolved`) with remarks and photos. |
| `GET` | `/worker/profile` | Retrieves worker profile, skill category, ratings, and performance stats. |
| `POST` | `/worker/profile/update` | Updates phone number and contact information. |

### 6. Gate Security Routes

Mount Path: `/security`
*Guards: `auth`, `authorizeS` (Role: Security), `attachCommunity`, `checkSubscriptionStatus`*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/security/dashboard` | Real-time gate stats: visitors on premises, daily check-ins, delivery entries. |
| `POST` | `/security/addVisitor` | Logs a new walk-in guest, service contractor, or delivery driver at the gate. |
| `GET` | `/security/visitorManagement` | Lists current visitors on premises and pending check-outs. |
| `GET` | `/security/visitorManagement/:action/:id` | Updates visitor status (`checkIn` / `checkOut` / `reject`). |
| `POST` | `/security/verify-code` | Validates a resident's 6-digit visitor pre-approval code at the gate. |

### 7. Worker Leave Pipeline

Mount Path: `/leaves`
*Guards: Role-dependent (`authorizeW` / `authorizeC`)*

| Method | Endpoint | Allowed Role | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/leaves/` | Worker | Submits a leave application (dates, reason, leave type). |
| `GET` | `/leaves/` | Worker / Manager | Lists leaves. Workers see personal leaves; Managers see all society leaves. |
| `GET` | `/leaves/:id` | Worker / Manager | Retrieves details for a specific leave application. |
| `PUT` | `/leaves/:id/approve` | Community Manager | Approves worker leave. Excludes worker from auto-assignment during leave dates. |
| `PUT` | `/leaves/:id/reject` | Community Manager | Rejects worker leave application with manager comments. |

### 8. Super Admin Management Routes

Mount Path: `/admin`
*Guards: `auth`, `authorizeA` (Role: Admin)*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/admin/api/dashboard` | Platform metrics: total registered communities, active managers, revenue, system health. |
| `GET` | `/admin/api/communities/overview` | Lists all registered communities with subscription status, manager info, and flat counts. |
| `GET` | `/admin/api/payments` | Lists all platform-wide onboarding and subscription transactions. |
| `GET` | `/admin/api/admin/activity` | Security audit log displaying admin actions, IP addresses, and timestamps. |
| `GET` | `/admin/api/admin/security/failed-logins` | Security monitoring endpoint listing failed login attempts and rate-limit hits. |
| `GET` | `/admin/api/settings` | Returns runtime settings (2FA skip flag, platform maintenance mode). |
| `POST` | `/admin/api/settings/update` | Updates global system settings and feature flags. |
| `GET` | `/admin/interest-forms` | Lists pending community manager onboarding applications. |
| `PUT` | `/admin/interest-forms/:id/approve` | Approves society application and emails manager a Razorpay onboarding link. |
| `PUT` | `/admin/interest-forms/:id/reject` | Rejects society application with formal reasoning sent via email. |
| `GET` | `/admin/plans` | Lists available society subscription plans. |
| `POST` | `/admin/plans` | Creates a new society subscription pricing plan. |
| `PUT` | `/admin/plans/:id` | Updates an existing subscription plan's features, price, or limits. |
| `DELETE` | `/admin/plans/:id` | Deactivates or removes a subscription tier. |

### 9. Redis Caching & System Diagnostics

Mount Path: `/api/cache`
*Guards: `auth`, `authorizeA` (Role: Admin)*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/cache/stats` | Returns real-time Redis memory usage, uptime, total keys, and hit/miss ratios. |
| `POST` | `/api/cache/clear` | Purges all cached API response keys (`route_cache:*`) across the system. |

### 10. Global Search API

Mount Path: `/api/search`
*Guards: `auth`*

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/search?q=query` | Multi-entity global search across residents, workers, tickets, flats, and visitors within the user's community. |

### 11. B2B Partner API (API Key Authenticated)

Mount Path: `/api/v1`
*Guards: `apiKeyAuth` (`x-api-key: <key>` header required)*

Designed for external third-party integrations (property portals, smart home systems, external accounting engines).

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/v1/communities/:code/info` | Retrieves public society metadata (name, address, amenities, resident count). |
| `GET` | `/api/v1/communities/:code/stats` | Retrieves aggregated statistics (resident count, active workers, ticket distribution, payment totals). |
| `POST` | `/api/v1/webhooks/payment-status` | Ingests external payment status callbacks (`completed`, `pending`, `failed`, `refunded`) to sync transaction records. |

**Example B2B Request:**
```bash
curl -X GET "http://localhost:3000/api/v1/communities/PRESTIGE-01/stats" \
  -H "x-api-key: ue-demo-api-key-2024"
```

---

## Real-Time Socket.IO Architecture

UrbanEase incorporates an authenticated WebSockets layer powered by Socket.IO for immediate event propagation:

### Handshake & Authentication
Sockets authenticate during handshake using the HTTP-only JWT cookie or the `auth.token` parameter. Once verified, the connection automatically joins targeted rooms:
1. **Community Room:** `community_<communityId>` — receives society-wide broadcasts (noticeboard ads, emergency alerts).
2. **Resident Room:** `resident_<userId>` — receives ticket progress updates, visitor arrival alerts, and payment reminders.
3. **Worker Room:** `worker_<userId>` — receives instant notifications when new tickets are assigned.

### Socket Event Catalog

| Event Name | Direction | Payload | Description |
| :--- | :--- | :--- | :--- |
| `new_notification` | Server -> Client | `{ title, message, type, link }` | Real-time notification toast dispatched to a user's role room. |
| `issue_created` | Server -> Client | `{ issueId, title, category, priority }` | Dispatched to Community Manager room upon complaint submission. |
| `task_assigned` | Server -> Client | `{ taskId, title, location, priority }` | Dispatched directly to the assigned Worker's room. |
| `visitor_arrival` | Server -> Client | `{ visitorName, vehicleNumber, gateNumber }` | Dispatched to Resident room when security checks in their visitor. |
| `leave_status_updated`| Server -> Client | `{ leaveId, status, comments }` | Dispatched to Worker room when manager acts on a leave request. |

---

## External Integrations

### Razorpay Payment Gateway
Integrated via `Server/services/razorpayService.js`:
- **Order Creation:** Generates unique order IDs (`order_...`) with amount, currency (`INR`), and receipt metadata.
- **Signature Verification:** Validates `razorpay_signature` using HMAC SHA-256 against `RAZORPAY_KEY_SECRET`:
  $$\text{Signature} = \text{HMAC-SHA256}(\text{order\_id} + "|" + \text{payment\_id}, \text{secret})$$
- **Flows:** Society subscription payments and resident maintenance dues.

### Transactional Email Delivery Engine
Managed via `Server/utils/emailService.js` and `Server/utils/otpEmailTemplates.js`:
- **Canonical Design:** All emails strictly use the original UrbanEase template: dark `#18181b` header, white card, `#f2f2f2` outer background, monospace code blocks, zero emojis.
- **Resilient Transport Fallback:**
  1. Direct Gmail SMTP via port `587`.
  2. If blocked or timed out, falls back to Brevo HTTPS REST API (`POST https://api.brevo.com/v3/smtp/email`).
  3. Second fallback to Resend HTTPS REST API (`POST https://api.resend.com/emails`).
  4. Both fallbacks operate over port `443` (never blocked by cloud platforms like Render).

### Cloudinary Media Cloud Storage
Integrated via Multer memory storage and Cloudinary v2 SDK:
- Direct streaming of image uploads (ticket proof, KYC documents, user avatars, community photos).
- Cloud transformation: automatic WebP format delivery, responsive dimension resizing, and CDN caching.

### Redis Response Caching Engine
Integrated via `Server/middleware/cacheMiddleware.js`:
- Caches read-heavy endpoints (`/api/dashboard`, `/api/auth/getUser`, etc.).
- Transparent diagnostic headers: `X-Cache: HIT`, `X-Cache: MISS`, `X-Cache: BYPASS`.
- Automated cache invalidation when mutations (POST, PUT, DELETE) occur.
- Diagnostics and manual cache purging via `/api/cache/stats` and `/api/cache/clear`.

---

## Local Installation & Development

### Prerequisites
- Node.js `20.x` or higher
- MongoDB instance (local or MongoDB Atlas cluster)
- Redis server (local or cloud instance)
- Git

### Step-by-Step Setup

```bash
# 1. Clone repository
git clone https://github.com/likhit2804/FDFED-END.git
cd FDFED-END

# 2. Install Server dependencies
cd Server
npm install

# 3. Configure Server environment
cp .env.example .env
# Edit Server/.env with your MONGO_URI1, JWT_SECRET, EMAIL_USER, EMAIL_PASS, etc.

# 4. Seed the database with demo societies and users
npm run seed

# 5. Start the backend server (starts on http://localhost:3000)
npm run dev

# 6. Open a new terminal and install Client dependencies
cd ../Client
npm install

# 7. Start the Vite development frontend (starts on http://localhost:5173)
npm run dev
```

Visit **http://localhost:5173** to access the web application.  
API documentation is accessible at **http://localhost:3000/api-docs**.

---

## Docker & Containerized Deployment

UrbanEase includes full multi-container Docker Compose support:

```
┌────────────────────────────────────────────────────────┐
│                     Docker Compose                     │
│  ┌──────────────────┐            ┌──────────────────┐  │
│  │ client:5173      │            │ server:3000      │  │
│  │ (Vite Dev)       │            │ (Express API)    │  │
│  └────────┬─────────┘            └────────┬─────────┘  │
│           │                               │            │
│           └───────────────┬───────────────┘            │
│                           ▼                            │
│  ┌──────────────────┐            ┌──────────────────┐  │
│  │ mongodb:27017    │            │ redis:6379       │  │
│  │ (Mongo Database) │            │ (In-Memory Cache)│  │
│  └──────────────────┘            └──────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### Launch Containers

```bash
# Build and start all 4 services
docker compose up --build

# Or run in detached background mode
docker compose up -d
```

### Stop Containers

```bash
docker compose down
```

---

## Automated Testing & Benchmarks

The platform includes comprehensive test suites across backend pipelines and automated benchmarks.

### Running Backend Automated Tests

```bash
cd Server
npm test
```

Test coverage includes:
- Role-based authorization & permission verification.
- Visitor pre-approval workflows & code generation.
- Common space slot overlap and conflict prevention.
- Worker leave overlap validation & task dispatch exclusion.
- Society subscription status checks & route guards.
- Razorpay webhook signature validation.

### Running Redis Benchmark Report

```bash
cd Server
npm run benchmark:redis
```
Outputs a detailed benchmark report evaluating cache latency and hit/miss performance to `project_docs/redis_benchmark_report.json`.

---

## Seed Data & Demo Credentials

When `npm run seed` is executed, the database is populated with full demonstration data (community, blocks, flats, amenities, dues, and staff):

### Common Password
All standard demo user accounts share the following password:
- **Password:** `123456`

### Pre-Configured Accounts

| Role | Email Address | Password | Community | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Super Admin** | `noreply.urbanease@gmail.com` | `Urbanease@123` | *Global* | Full platform governance, plan creation, audit logs |
| **Community Manager** | `adityakanumuri02@gmail.com` | `123456` | Prestige Palm Heights | Role dropdown: `Community Manager` |
| **Resident** | `adityakanumuri02@gmail.com` | `123456` | Prestige Palm Heights | Role dropdown: `Resident` (Flat A-101) |
| **Worker / Staff** | `adityakanumuri02@gmail.com` | `123456` | Prestige Palm Heights | Role dropdown: `Worker` (Trade: Electrician) |
| **Gate Security** | `adityakanumuri02@gmail.com` | `123456` | Prestige Palm Heights | Role dropdown: `Security` (Gate 1) |

> **Development 2FA Bypass Code:** During local development and testing, you can enter `123456` on the 2FA OTP verification screen to bypass SMTP delivery.

---

## License & Support

UrbanEase is maintained by the UrbanEase Engineering Team.

- **Issues & Contributions:** Submit pull requests and bug reports on GitHub.
- **Support Contact:** `urbanease.team@gmail.com`
- **License:** Proprietary / Educational Use. All rights reserved.
