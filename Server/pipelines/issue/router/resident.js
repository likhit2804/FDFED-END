import express from "express";
import {
    confirmIssue,
    rejectIssueResolution,
    raiseIssue,
    deleteIssue,
    getResidentIssues,
    getIssueDataById,
    submitFeedback,
} from "../controllers/resident.js";

const issueResidentRouter = express.Router();

issueResidentRouter.post("/issue/confirmIssue/:id", confirmIssue);
issueResidentRouter.post("/issue/rejectIssueResolution/:id", rejectIssueResolution);
issueResidentRouter.post("/issue/raise", raiseIssue);
issueResidentRouter.delete("/issue/delete/:issueID", deleteIssue);
issueResidentRouter.get("/issue/data", getResidentIssues);
issueResidentRouter.get("/issue/data/:id", getIssueDataById);
issueResidentRouter.post("/issue/submitFeedback", submitFeedback);

export default issueResidentRouter;
