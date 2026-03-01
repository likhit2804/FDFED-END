# Core Modules

Role/domain modules that sit on top of shared core services.

- `admin/` -> admin controllers + admin CRUD wrappers
- `security/` -> auth + otp flows
- `worker/` -> manager/worker controller layer

Shared infrastructure stays outside this folder:

- `core/models`
- `core/middleware`
- `core/utils`
- `core/configs`
- `core/modules/admin/crud`
