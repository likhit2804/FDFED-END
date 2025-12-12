# Render Deployment Guide for FDFED-END

## Server Setup
- Ensure your environment variables are set in the Render dashboard (see .env for required keys).
- The server will use `process.env.PORT` as required by Render.
- The `start` script is configured for Render.

## Client Setup
- Build the client locally or use a separate Render Static Site for the frontend.
- If deploying the client separately, set `CLIENT_ORIGIN` in your server's environment variables to the deployed client URL.

## Environment Variables (example)
```
MONGO_URI1=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLIENT_ORIGIN=https://your-client.onrender.com
... (see .env for all required keys)
```

## Package Installation
- Use `npm install` in both `Server` and `Client` directories before deploying/building.

## Naming & Casing
- All imports and file names are case-sensitive in deployment. Ensure consistency (e.g., `InterestRouter.js` vs `interestRouter.js`).
- If you encounter import errors, check for mismatched casing between import statements and file names.

## Notes
- For static file serving, consider using a static site host for the frontend and only deploy the backend to Render Web Service.
- If you need to serve the frontend from the backend, copy the client build output to the server's public directory and serve it with Express.
