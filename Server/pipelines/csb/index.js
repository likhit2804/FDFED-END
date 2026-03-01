import express from 'express';
import residentRoutes from './resident/routes.js';
import managerRoutes from './manager/routes.js';
const residentRouter = express.Router();
residentRouter.use('/spaces', residentRoutes);
const managerRouter = express.Router();
managerRouter.use('/spaces', managerRoutes);
export { residentRouter as csbResidentRouter };
export { managerRouter as csbManagerRouter };