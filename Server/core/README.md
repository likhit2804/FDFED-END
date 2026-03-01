# Server Core Layout

`core` contains shared platform code and role/domain modules.

## Active Folders

- `core/modules/security/auth` -> authentication + authorization + login/register flows
- `core/modules/security/otp` -> OTP utilities/controllers
- `core/modules/admin` -> admin controllers + admin CRUD services
- `core/modules/worker` -> manager/worker controller layer used by `Server/routes/*`
- `core/models` -> shared Mongoose models
- `core/middleware` -> reusable express middleware
- `core/utils` -> shared helpers (email, audit, sockets, etc.)
- `core/configs` -> shared runtime config helpers (cloudinary)
- `core/modules/admin/crud` -> shared generic CRUD base service + admin CRUD wrappers

## Pipeline Boundary

- Issue business logic is pipeline-owned under:
  - `pipelines/issue/shared/*`
  - `pipelines/issue/manager/*`
  - `pipelines/issue/resident/*`
  - `pipelines/issue/worker/*`
- `core/utils/issueAutomation.js` is now a compatibility re-export to the pipeline implementation.
- Manager subscription business logic is pipeline-owned under:
  - `pipelines/subscription/manager/*`
- `core/modules/worker/controllers/manager_subscription.controller.js` is a compatibility re-export to the subscription pipeline.
- Interest/onboarding registration flow is pipeline-owned under:
  - `pipelines/registration/interest/*`

## Archived Legacy

Legacy duplicates were moved out of `core` to keep this folder focused:

- `Server/archive/core/admin/routes_legacy_unused`
- `Server/archive/core/interest/InterestRouter_legacy_unused.js`
- `Server/archive/core/worker/routes_legacy_unused`
