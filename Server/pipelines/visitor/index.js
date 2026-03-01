import express from 'express';
import securityRoutes from './security/routes.js';
const securityRouter = express.Router();
securityRouter.use('/visitors', securityRoutes);
export { securityRouter as visitorSecurityRouter };