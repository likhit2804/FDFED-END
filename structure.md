# URBANEASE — Full Project Structure Guide

> Last updated: March 1, 2026  
> This file explains every folder in the project, how they connect, and what is safe to delete.

---

## Table of Contents

- [URBANEASE — Full Project Structure Guide](#urbanease--full-project-structure-guide)
  - [Table of Contents](#table-of-contents)
  - [Project Overview](#project-overview)
  - [Root Layout](#root-layout)
    - [run.bat](#runbat)
  - [Client — Full Breakdown](#client--full-breakdown)
    - [How Client Code Is Organized (features/)](#how-client-code-is-organized-features)
    - [How Routing Works (Client)](#how-routing-works-client)
    - [Redux Store (store.js)](#redux-store-storejs)
  - [Server — Full Breakdown](#server--full-breakdown)
  - [How a Request Flows](#how-a-request-flows)
    - [Example: Resident raises an issue](#example-resident-raises-an-issue)
    - [Example: Security logs a visitor](#example-security-logs-a-visitor)
  - [Duplication Issues](#duplication-issues)
  - [What Is Safe to Delete](#what-is-safe-to-delete)
  - [Roles in the System](#roles-in-the-system)
  - [Quick Start](#quick-start)

---

## Project Overview

URBANEASE is a **community management platform**.  
It supports 5 user roles: **Admin, Manager, Resident, Worker, Security**.

- **Client** = React + Vite frontend (what users see)
- **Server** = Node.js + Express + MongoDB backend (data & logic)

---

## Root Layout

```
FDFED-END/
├── Client/          ← React frontend
├── Server/          ← Node.js backend
├── README.md        ← Original readme
├── STRUCTURE.md     ← THIS FILE
├── run.bat          ← Runs both Client and Server together
├── phase3to7.ps1    ← Dev setup script (PowerShell)
├── package.json     ← Root-level scripts
└── .gitignore
```

### run.bat
Double-click this to start the whole app locally.  
It runs `npm run dev` in both Client and Server simultaneously.

---

## Client — Full Breakdown

```
Client/
├── index.html           ← HTML entry point
├── vite.config.js       ← Vite bundler config
├── eslint.config.js     ← Linting rules
├── package.json
│
├── src/                 ← ALL ACTIVE SOURCE CODE
│   ├── main.jsx         ← Mounts React app into index.html
│   ├── App.jsx          ← Root component, sets up routing
│   ├── Layout.jsx       ← Shared page wrapper (navbar, sidebar)
│   ├── store.js         ← Redux store (registers all slices)
│   │
│   ├── config/
│   │   └── theme.js     ← MUI / color theme settings
│   │
│   ├── assets/
│   │   └── css/         ← Global CSS files
│   │
│   ├── imgs/
│   │   └── Poppins/     ← Font files
│   │
│   ├── routes/          ← ROUTE DEFINITIONS per role
│   │   ├── adminRoutes.jsx
│   │   ├── managerRoutes.jsx
│   │   ├── residentRoutes.jsx
│   │   ├── securityRoutes.jsx
│   │   └── workerRoutes.jsx
│   │
│   └── features/        ← ALL FEATURE CODE (components + logic)
│       ├── admin/       ← Admin pages, hooks, slices
│       ├── auth/        ← Login, OTP, registration
│       ├── common/      ← Shared UI (landing page, 404, etc.)
│       ├── issues/      ← Issue tracking feature
│       ├── manager/     ← Manager pages and logic
│       ├── resident/    ← Resident pages and logic
│       ├── security/    ← Security pages and logic
│       └── worker/      ← Worker pages and logic
│
└── archive/             ← ⚠️ OLD CODE — DO NOT IMPORT
    └── legacy-src-core/ ← Old structure before features/ refactor
        ├── admin/
        ├── auth/
        ├── common/
        ├── config/
        ├── routes/
        └── worker/
```

### How Client Code Is Organized (features/)

Each feature folder follows the same internal pattern:

```
features/resident/
├── components/      ← React UI components (.jsx files)
├── hooks/           ← Custom React hooks (data fetching logic)
├── slices/          ← Redux slices (state management)
└── index.js         ← Exports everything from this feature
```

### How Routing Works (Client)

```
App.jsx
  └── reads routes/ folder
        ├── adminRoutes.jsx    → maps /admin/*   → features/admin/components/
        ├── managerRoutes.jsx  → maps /manager/* → features/manager/components/
        ├── residentRoutes.jsx → maps /resident/* → features/resident/components/
        ├── securityRoutes.jsx → maps /security/* → features/security/components/
        └── workerRoutes.jsx   → maps /worker/*  → features/worker/components/
```

### Redux Store (store.js)

`store.js` imports and registers slices from `features/`:

```
store.js
  ├── features/auth/authSlice
  ├── features/admin/adminSlice
  ├── features/manager/managerSlice
  ├── features/resident/residentSlice
  ├── features/worker/workerSlice
  ├── features/security/securitySlice
  └── features/issues/issueSlice
```

---

## Server — Full Breakdown

```
Server/
├── server.js            ← Entry point. Connects DB, middleware, routes.
├── .env                 ← Secret keys (NEVER commit this)
├── package.json
│
├── core/                ← SHARED INFRASTRUCTURE
│   ├── configs/
│   │   └── cloudinary.js          ← Image upload config (Cloudinary)
│   │
│   ├── middleware/                 ← Express middleware (runs on every request)
│   │   ├── rbac.js                 ← Role-based access control
│   │   ├── subscriptionStatus.js  ← Checks if community subscription is active
│   │   ├── validateRequest.js     ← Input validation runner
│   │   └── validation.js          ← Validation rules
│   │
│   ├── models/                    ← ALL MongoDB database schemas
│   │   ├── admin.js               ← Admin user
│   │   ├── resident.js            ← Resident user
│   │   ├── workers.js             ← Worker user
│   │   ├── security.js            ← Security user
│   │   ├── cManager.js            ← Community Manager user
│   │   ├── communities.js         ← Community (housing society)
│   │   ├── issues.js              ← Maintenance issues
│   │   ├── visitors.js            ← Visitor log
│   │   ├── preapproval.js         ← Pre-approved visitors
│   │   ├── commonSpaces.js        ← Amenity spaces (gym, hall, etc.)
│   │   ├── Amenities.js           ← Amenity definitions
│   │   ├── Notifications.js       ← In-app notifications
│   │   ├── payment.js             ← Payment records
│   │   ├── communitySubscription.js ← Plan subscription per community
│   │   ├── subscriptionPlan.js    ← Plan tiers (Basic, Pro, etc.)
│   │   ├── Ad.js                  ← Advertisements
│   │   ├── interestForm.js        ← New community interest/lead form
│   │   ├── adminAuditLog.js       ← Admin action logs
│   │   ├── systemSettings.js      ← Global system config
│   │   ├── deletedCommunityBackup.js ← Backup before community delete
│   │   └── USE_WITH_CAUTION.js    ← ⚠️ Dangerous bulk operations
│   │
│   ├── modules/                   ← Self-contained auth/CRUD modules
│   │   ├── admin/
│   │   │   ├── controllers/       ← Admin login, management logic
│   │   │   └── crud/              ← Admin CRUD operations
│   │   ├── security/
│   │   │   ├── auth/              ← Security login/logout
│   │   │   └── otp/               ← OTP generation & verification
│   │   └── worker/
│   │       └── controllers/       ← Worker login logic
│   │
│   └── utils/                     ← Shared helper functions
│       ├── emailService.js        ← Sends emails (nodemailer)
│       ├── emailTemplates.js      ← HTML email templates
│       ├── otp.js                 ← OTP generation logic
│       ├── auditLogger.js         ← Writes to adminAuditLog model
│       ├── socket.js              ← Socket.io real-time setup
│       ├── issueAutomation.js     ← Auto-assigns/escalates issues
│       ├── residentHelpers.js     ← Resident-specific helper functions
│       └── communityCascadeDelete.js ← Deletes all data when community removed
│
├── pipelines/           ← FEATURE WORKFLOWS (main business logic)
│   ├── index.js         ← Registers all pipeline routers
│   │
│   ├── csb/             ← Common Space Booking
│   │   ├── index.js
│   │   ├── manager/     ← Manager: approve/reject bookings
│   │   ├── resident/    ← Resident: make bookings
│   │   └── shared/      ← Shared booking helpers & CRUD
│   │
│   ├── dashboard/       ← Dashboard stats per role
│   │   ├── index.js
│   │   ├── admin/       ← Platform-wide stats
│   │   ├── manager/     ← Community-level stats
│   │   ├── resident/    ← Personal stats
│   │   ├── security/    ← Visitor/gate stats
│   │   └── worker/      ← Task stats
│   │
│   ├── issue/           ← Issue/complaint management
│   │   ├── index.js
│   │   ├── shared/      ← Core issue CRUD, automation, notifications
│   │   ├── resident/    ← Raise & track issues
│   │   ├── manager/     ← Assign & monitor issues
│   │   └── worker/      ← Accept & close issues
│   │
│   ├── preapproval/     ← Pre-approved visitor passes
│   │   ├── index.js
│   │   ├── resident/    ← Create pre-approvals
│   │   ├── security/    ← Verify & log entry
│   │   └── shared/
│   │
│   ├── profile/         ← Profile view & edit
│   │   ├── index.js
│   │   ├── admin/
│   │   ├── manager/
│   │   ├── resident/
│   │   ├── security/
│   │   └── worker/
│   │
│   ├── registration/    ← New user onboarding
│   │   ├── index.js
│   │   ├── interest/    ← Community interest form (leads)
│   │   ├── resident/    ← Resident self-registration
│   │   └── shared/      ← Common registration helpers
│   │
│   ├── subscription/    ← Community subscription management
│   │   ├── index.js
│   │   └── manager/     ← Upgrade/downgrade plans
│   │
│   └── visitor/         ← Live visitor gate management
│       ├── index.js
│       ├── security/    ← Log visitor entry/exit
│       └── shared/      ← Visitor helpers
│
├── routes/              ← EXPRESS ROUTERS (URL → pipeline mapping)
│   ├── adminRouter.js       → /api/admin/*
│   ├── adminCrudRouter.js   → /api/admin/crud/*
│   ├── managerRouter.js     → /api/manager/*
│   ├── residentRouter.js    → /api/resident/*
│   ├── securityRouter.js    → /api/security/*
│   ├── workerRouter.js      → /api/worker/*
│   └── InterestRouter.js    → /api/interest/*
│
├── seeder/              ← DEV ONLY: populate DB with fake data
│   ├── seed.js          ← Run this to seed
│   └── dataGenerator.js ← Generates fake users, communities, issues
│
├── logs/                ← Server log files (auto-generated)
├── uploads/
│   └── interest-photos/ ← Photos uploaded via interest form
│
└── archive/             ← ⚠️ OLD CODE — DO NOT IMPORT, SAFE TO DELETE
    └── core/
        ├── admin/routes_legacy_unused/
        ├── interest/InterestRouter_legacy_unused.js
        └── worker/routes_legacy_unused/
```

---

## How a Request Flows

### Example: Resident raises an issue

```
1. Client (React)
   features/resident/components/IssueRaising.jsx
   → dispatches Redux action via features/resident/hooks/useIssueHook.js
   → calls POST /api/resident/issues

2. Server (Express)
   server.js
   → routes/residentRouter.js               (matches /api/resident/issues)
   → core/middleware/rbac.js                (checks: is this a resident?)
   → core/middleware/validateRequest.js     (validates input)
   → pipelines/issue/resident/controller.js (business logic)
   → pipelines/issue/shared/issuesCrud.js  (DB operations)
   → core/models/issues.js                 (Mongoose schema)
   → core/utils/issueAutomation.js         (auto-assign worker)
   → core/utils/socket.js                  (real-time notification)

3. Response → back to Client → Redux state updated → UI re-renders
```

### Example: Security logs a visitor

```
1. Client (React)
   features/security/components/visitorManagement.jsx
   → calls POST /api/security/visitor

2. Server (Express)
   server.js
   → routes/securityRouter.js
   → core/middleware/rbac.js                (checks: is this security?)
   → pipelines/visitor/security/controller.js
   → pipelines/visitor/shared/
   → core/models/visitors.js
   → core/utils/socket.js                  (notifies resident in real-time)

3. Response → UI updated
```

---

## Duplication Issues

| File | Duplicate Of | Recommended Action |
|---|---|---|
| `pipelines/issue/shared/issueAutomation.js` | `core/utils/issueAutomation.js` | ⚠️ Check which is newer — have one import the other |
| `Client/archive/legacy-src-core/` | `Client/src/features/` | ✅ Already archived — safe to delete |
| `Server/archive/` entire folder | Old routes replaced by `pipelines/` | ✅ Safe to delete |

---

## What Is Safe to Delete

```
✅ SAFE TO DELETE:
├── Server/archive/                               ← Confirmed dead code
├── Client/archive/                               ← Already moved to archive
└── Server/pipelines/issue/shared/issueAutomation.js
    (only after confirming core/utils/ version is being used everywhere)

⚠️ DO NOT DELETE:
├── Server/core/models/USE_WITH_CAUTION.js        ← Has dangerous but needed bulk ops
├── Server/.env                                   ← All secrets live here
└── Server/seeder/                                ← Needed for dev/testing
```

---

## Roles in the System

| Role | What They Do | Client Feature | Server Routes |
|---|---|---|---|
| **Admin** | Manages entire platform, communities, subscriptions | `features/admin/` | `adminRouter.js` + `adminCrudRouter.js` |
| **Manager** | Manages one community, approves residents, handles issues | `features/manager/` | `managerRouter.js` |
| **Resident** | Lives in community, raises issues, books spaces | `features/resident/` | `residentRouter.js` |
| **Worker** | Handles assigned maintenance tasks | `features/worker/` | `workerRouter.js` |
| **Security** | Manages gate, visitors, pre-approvals | `features/security/` | `securityRouter.js` |

---

## Quick Start

```bash
# From FDFED-END root — starts both Client and Server:
npm run dev

# OR manually:
cd Client && npm run dev        # frontend on http://localhost:5173
cd Server && node server.js     # backend on http://localhost:5000

# Seed the database (dev only):
cd Server && node seeder/seed.js
```

---

*This file was generated from codebase analysis. Update it when adding new features or folders.*