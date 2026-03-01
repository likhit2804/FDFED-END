import express from 'express';
import residentRoutes from './resident/routes.js';
import securityRoutes from './security/routes.js';
const residentRouter = express.Router();
residentRouter.use('/preapproval', residentRoutes);
const securityRouter = express.Router();
securityRouter.use('/preapproval', securityRoutes);
export { residentRouter as preapprovalResidentRouter };
export { securityRouter as preapprovalSecurityRouter };