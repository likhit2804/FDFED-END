# UrbanEase

UrbanEase is a full-stack community management platform for gated communities and residential societies. It supports separate B2C user experiences for admins, community managers, residents, workers, and security staff, and it also exposes API-key protected B2B endpoints for partner integrations.

## What This Covers

- B2C APIs for app users under role-based JWT routes such as `/resident`, `/manager`, `/worker`, `/security`, and `/admin`
- B2B APIs for partner systems under `/api/v1` with `x-api-key` authentication
- External API consumption through Razorpay order creation and payment verification in onboarding and resident payment flows
- API documentation through Swagger at `/api-docs`

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 7, Redux Toolkit, Bootstrap, Framer Motion, Recharts, Socket.IO Client |
| Backend | Express 5, Mongoose, JWT auth, Swagger, Socket.IO |
| Database | MongoDB |
| Storage | Cloudinary |
| Payments | Razorpay |
| Email | Nodemailer |

## Project Structure

| Path | Purpose |
| --- | --- |
| `Client/` | React frontend |
| `Server/` | Express backend |
| `Server/routes/` | Main HTTP route groups |
| `Server/pipelines/` | Domain-organized backend features |
| `Server/services/razorpayService.js` | External Razorpay integration |
| `Server/routes/b2bRouter.js` | API-key protected B2B endpoints |

## User Roles

1. Admin
2. Community Manager
3. Resident
4. Worker
5. Security

## Local Setup

### Prerequisites

- Node.js 20+
- MongoDB connection string
- Cloudinary credentials
- Razorpay test or live credentials

### Install

```bash
cd Server
npm install

cd ../Client
npm install
```

### Environment Variables

Create `Server/.env` with the required values for your environment.

| Variable | Description |
| --- | --- |
| `PORT` | Backend port, defaults to `3000` |
| `MONGO_URI1` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `EMAIL_USER` | Email sender account |
| `EMAIL_PASS` | Email sender password or app password |
| `CLIENT_BASE_URL` | Frontend base URL used in onboarding links |
| `RAZORPAY_KEY_ID` | Razorpay public key id |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key |
| `API_KEYS` | Comma-separated B2B API keys |

If `API_KEYS` is not set, the B2B middleware falls back to the demo key `ue-demo-api-key-2024`.

### Run

```bash
cd Server
npm run dev

cd ../Client
npm run dev
```

Frontend runs on `http://localhost:5173` and the backend runs on `http://localhost:3000` by default.

## API Documentation

- Swagger UI: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- OpenAPI JSON: [http://localhost:3000/api-docs.json](http://localhost:3000/api-docs.json)

## B2C vs B2B API Design

### B2C

These routes are used by the UrbanEase web app and require the usual cookie/JWT auth plus role checks.

- `/resident/...`
- `/manager/...`
- `/worker/...`
- `/security/...`
- `/admin/...`
- `/interest/...` for public onboarding flows

### B2B

These routes are intended for external systems and use API key auth instead of resident or manager login.

- `GET /api/v1/communities/:code/info`
- `GET /api/v1/communities/:code/stats`
- `POST /api/v1/webhooks/payment-status`

Example:

```bash
curl -H "x-api-key: ue-demo-api-key-2024" \
  http://localhost:3000/api/v1/communities/YOUR-COMMUNITY-CODE/info
```

## External API Consumption

UrbanEase consumes Razorpay in two places:

- Community onboarding payment flow via `/interest/onboarding/create-order` and `/interest/onboarding/complete`
- Resident payment flow via `/resident/payment/:id/order` and `/resident/payment/:id/verify`

The server creates Razorpay orders over HTTPS and verifies the payment signature before marking records as completed.

## Notes for Evaluation

- B2C routes remain role-based and app-facing
- B2B routes are separated under `/api/v1` and use API keys
- Razorpay demonstrates external API consumption
- Swagger documents both the regular auth flows and the B2B endpoints
