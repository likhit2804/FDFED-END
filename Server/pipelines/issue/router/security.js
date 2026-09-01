import express from "express";
import {
  logPhoneOrIntercomIssue,
  getCommunityFlatsForSecurity,
  getSecurityLoggedIssues,
  deleteSecurityIssue
} from "../controllers/security.js";

const issueSecurityRouter = express.Router();

issueSecurityRouter.post("/issue/log", logPhoneOrIntercomIssue);
issueSecurityRouter.get("/issue/flats", getCommunityFlatsForSecurity);
issueSecurityRouter.get("/issue/data", getSecurityLoggedIssues);
issueSecurityRouter.delete("/issue/delete/:id", deleteSecurityIssue);

export default issueSecurityRouter;
