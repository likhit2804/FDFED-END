import cron from "node-cron";
import Issue from "../models/issues.js";
import Worker from "../models/workers.js";

// --------------------------------------------------
// AUTO ASSIGN ISSUE
// --------------------------------------------------
export async function autoAssignIssue(issue) {
  try {
    // 1. Find workers by category
    const workers = await Worker.find({community: issue.community,
      jobRole: issue.category,
      isActive: true,
    });

    if (!workers.length) {
      return { assigned: false, msg: "No worker available" };
    }

    // 2. Worker with lowest workload
    const selected = workers.sort(
      (a, b) => a.assignedIssues.length - b.assignedIssues.length
    )[0];

    // 3. Assign
    issue.workerAssigned = selected._id;
    issue.status = "Assigned";
    issue.autoAssigned = true;
    await issue.save();

    selected.assignedIssues.push(issue._id);
    await selected.save();

    return { assigned: true, worker: selected };
  } catch (err) {
    console.error("Auto assign error:", err);
    return { assigned: false };
  }
}

// --------------------------------------------------
// CHECK DUPLICATE ISSUE (24 HOURS)
// --------------------------------------------------
export async function checkDuplicateIssue(residentId, category, location) {
  const last24 = new Date(Date.now() - 24 * 60 * 60 * 1000);

  return Issue.findOne({
    resident: residentId,
    category,
    location,
    createdAt: { $gte: last24 },
    status: { $ne: "Closed" },
  });
}

// --------------------------------------------------
// FLAG MISASSIGNED ISSUE → REASSIGN
// --------------------------------------------------
export async function flagMisassigned(issueId) {
  const issue = await Issue.findById(issueId);
  if (!issue) return;

  issue.workerAssigned = null;
  issue.status = "Pending Assignment";
  await issue.save();

  await autoAssignIssue(issue);
}

// --------------------------------------------------
// CRON: AUTO REASSIGN IF WORKER INACTIVE FOR 2 HOURS
// --------------------------------------------------
cron.schedule("*/10 * * * *", async () => {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const issues = await Issue.find({
      status: "Assigned",
      updatedAt: { $lte: twoHoursAgo },
      autoAssigned: true,
    });

    for (const issue of issues) {
      console.log("Auto reassigning due to inactivity:", issue._id);
      await autoAssignIssue(issue);
    }
  } catch (err) {
    console.error("Error in auto reassign cron:", err);
  }
});

// --------------------------------------------------
// CRON: AUTO CLOSE AFTER 48 HOURS WITHOUT CONFIRMATION
// --------------------------------------------------
cron.schedule("0 * * * *", async () => {
  try {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const issues = await Issue.find({
      status: "Resolved (Awaiting Confirmation)",
      updatedAt: { $lte: fortyEightHoursAgo },
    });

    for (const issue of issues) {
      issue.status = "Auto-Closed";
      await issue.save();
    }
  } catch (err) {
    console.error("Auto close cron error:", err);
  }
});

// --------------------------------------------------
// CRON: ESCALATION AFTER 6 HOURS OF NO PROGRESS
// --------------------------------------------------
cron.schedule("*/30 * * * *", async () => {
  try {
    const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000);

    const stuckIssues = await Issue.find({
      status: "In Progress",
      updatedAt: { $lte: sixHoursAgo },
    });

    for (const issue of stuckIssues) {
      issue.status = "On Hold";
      await issue.save();
      console.log("Escalated to manager:", issue._id);
    }
  } catch (err) {
    console.error("Escalation cron error:", err);
  }
});

export default {
  autoAssignIssue,
  checkDuplicateIssue,
  flagMisassigned,
};
