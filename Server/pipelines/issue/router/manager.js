import express from "express";
import {
    assignIssue,
    getManagerIssues,
    reassignIssue,
    closeIssueByManager,
    getIssueById,
    getRejectedPendingIssues,
    getIssueResolvingApiIssues,
    getIssueResolvingData,
} from "../controllers/manager.js";

const issueManagerRouter = express.Router();

// Issue Resolving view (server-side render helper)
issueManagerRouter.get("/issueResolving", async (req, res) => {
    try {
        const data = await getIssueResolvingData(req);
        res.render("communityManager/issueResolving", {
            path: "ir",
            ...data,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Server error");
    }
});

issueManagerRouter.get("/issue/myIssues", getManagerIssues);
issueManagerRouter.post("/issue/assign/:id", assignIssue);
issueManagerRouter.post("/issue/reassign/:id", reassignIssue);
issueManagerRouter.post("/issue/close/:id", closeIssueByManager);
issueManagerRouter.get("/issue/:id", getIssueById);

// API endpoint to fetch issues data for auto-refresh
issueManagerRouter.get("/issueResolving/api/issues", getIssueResolvingApiIssues);

// Route for handling rejected auto-assigned issues (resident rejects → goes to manager)
issueManagerRouter.get("/issue/rejected/pending", getRejectedPendingIssues);

export default issueManagerRouter;
