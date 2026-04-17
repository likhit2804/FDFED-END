import express from "express";
import {
    getUserManagement,
    createResident, getResident, deleteResident,
    createSecurity, getSecurity, deleteSecurity,
    createWorker, getWorker, deleteWorker, getWorkers,
} from "../controllers/manager.js";

const userMgmtManagerRouter = express.Router();

userMgmtManagerRouter.get("/userManagement", getUserManagement);

userMgmtManagerRouter.post("/userManagement/resident", createResident);
userMgmtManagerRouter.get("/userManagement/resident/:id", getResident);
userMgmtManagerRouter.delete("/userManagement/resident/:id", deleteResident);

userMgmtManagerRouter.post("/userManagement/security", createSecurity);
userMgmtManagerRouter.get("/userManagement/security/:id", getSecurity);
userMgmtManagerRouter.delete("/userManagement/security/:id", deleteSecurity);

userMgmtManagerRouter.post("/userManagement/worker", createWorker);
userMgmtManagerRouter.get("/userManagement/worker/:id", getWorker);
userMgmtManagerRouter.delete("/userManagement/worker/:id", deleteWorker);

userMgmtManagerRouter.get("/workers", getWorkers);

export default userMgmtManagerRouter;
