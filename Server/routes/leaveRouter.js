import express from "express";
import auth from "../controllers/shared/auth.js";
import { authorizeW, authorizeC } from "../controllers/shared/authorization.js";
import leaveWorkerRouter from "../pipelines/workerLeave/router/resident.js";
import leaveManagerRouter from "../pipelines/workerLeave/router/manager.js";

const router = express.Router();

// Worker routes (apply, list own, get by id)
router.post("/", auth, authorizeW, (req, res, next) => leaveWorkerRouter(req, res, next));
router.get("/", auth, (req, res, next) => {
    if (req.user.userType === "Worker") return leaveWorkerRouter(req, res, next);
    return leaveManagerRouter(req, res, next);
});
router.get("/:id", auth, (req, res, next) => {
    if (req.user.userType === "Worker") return leaveWorkerRouter(req, res, next);
    return leaveManagerRouter(req, res, next);
});

// Manager routes (approve / reject)
router.put("/:id/approve", auth, authorizeC, (req, res, next) => leaveManagerRouter(req, res, next));
router.put("/:id/reject", auth, authorizeC, (req, res, next) => leaveManagerRouter(req, res, next));

export default router;
