# Security Layer

- `auth/` contains auth middleware, role authorization, login credential verification, and payment controller compatibility handlers.
- `otp/` contains OTP and temporary-password email flows.

All route imports should use:

- `core/modules/security/auth/*`
- `core/modules/security/otp/*`
