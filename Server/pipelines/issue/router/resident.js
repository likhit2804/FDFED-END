import express from "express";
import {
    confirmIssue,
    rejectIssueResolution,
    raiseIssue,
    deleteIssue,
    getResidentIssues,
    getIssueDataById,
    submitFeedback,
    getEmergencyContacts,
} from "../controllers/resident.js";
import { validateIssue, validateObjectId } from "../../../middleware/validation.js";

const issueResidentRouter = express.Router();

issueResidentRouter.get("/issue/emergency-contacts", getEmergencyContacts);
issueResidentRouter.post("/issue/confirmIssue/:id", validateObjectId, confirmIssue);
issueResidentRouter.post("/issue/rejectIssueResolution/:id", validateObjectId, rejectIssueResolution);
issueResidentRouter.post("/issue/raise", validateIssue, raiseIssue);
issueResidentRouter.delete("/issue/delete/:issueID", deleteIssue);
issueResidentRouter.get("/issue/data", getResidentIssues);
issueResidentRouter.get("/issue/data/:id", getIssueDataById);
issueResidentRouter.post("/issue/submitFeedback", submitFeedback);

export default issueResidentRouter;
