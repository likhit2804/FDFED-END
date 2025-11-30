import Issue from "../models/issues.js";
import Worker from "../models/workers.js";
import Resident from "../models/resident.js";
import CommunityManager from "../models/cManager.js";
import Payment from "../models/payment.js"; // Make sure this import is present at the top


import {
  autoAssignIssue,
  checkDuplicateIssue,
  autoAssignCommunityIssue,
  checkDuplicateCommunityIssue,
} from "../utils/issueAutomation.js";
function generateCustomID(uCode, facility, countOrRandom = null) {
  console.log("uCode:", uCode);

  // Clean the uCode (remove spaces)
  const code = uCode.toUpperCase().trim(); // BLK1-101

  const facilityCode = facility.toUpperCase().slice(0, 2); // IS

  const suffix = countOrRandom
    ? String(countOrRandom).padStart(4, "0")
    : String(Math.floor(1000 + Math.random() * 9000));

  return `${code}-${facilityCode}-${suffix}`;
}

// --------------------------------------------------
// MANAGER: Assign Issue
// --------------------------------------------------
export const assignIssue = async (req, res) => {
  const { worker, deadline, remarks } = req.body;

  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue)
      return res.status(404).json({ success: false, message: "Issue not found" });

    const invalidStatuses = [
      "Resolved (Awaiting Confirmation)",
      "Closed",
      "Auto-Closed",
      "Rejected",
    ];

    if (invalidStatuses.includes(issue.status)) {
      return res.status(400).json({
        success: false,
        message: "Cannot assign a completed or closed issue.",
      });
    }

 
    if (issue.status === "Reopened") {
      return res.status(400).json({
        success: false,
        message: "Issue is reopened. please use reassign instead.",
      });
    }

   
    if (issue.workerAssigned) {
      return res.status(400).json({
        success: false,
        message: "Issue already assigned to a worker.",
      });
    }

    // ✔ Assign first-time worker
    issue.workerAssigned = worker;
    issue.deadline = deadline || null;
    issue.remarks = remarks || null;
    issue.status = "Assigned";
    issue.autoAssigned = false;
    await issue.save();

    const workerData = await Worker.findById(worker);
    if (!workerData)
      return res.status(404).json({ success: false, message: "Worker not found" });

    workerData.assignedIssues.push(issue._id);
    await workerData.save();

    res.json({ success: true, message: "Worker assigned successfully", issue });

  } catch (error) {
    console.error("Assign Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};



// --------------------------------------------------
// MANAGER: Get all issues in manager community
// --------------------------------------------------
export const getManagerIssues = async (req, res) => {
  try {
    const managerId = req.user.id;
    const manager = await CommunityManager.findById(managerId);

    if (!manager) {
      return res.status(404).json({ success: false, message: "Community manager not found" });
    }

    const community = manager.assignedCommunity;
    if (!community) {
      return res.status(404).json({
        success: false,
        message: "No community assigned to this manager",
      });
    }

    // Fetch all issues for this community
    const issues = await Issue.find({ community })
      .populate("resident")
      .populate("workerAssigned")
      .sort({ createdAt: -1 });

    // Separate by type
    const residentIssues = issues.filter(i => i.categoryType === "Resident");
    const communityIssues = issues.filter(i => i.categoryType === "Community");

    // Group community issues by location for prioritization
    const groupedCommunityIssues = {};
    communityIssues.forEach(issue => {
      const loc = issue.location || "Unknown";
      if (!groupedCommunityIssues[loc]) groupedCommunityIssues[loc] = [];
      groupedCommunityIssues[loc].push(issue);
    });

    // Analytics
    const analytics = {
      total: issues.length,
      resident: residentIssues.length,
      community: communityIssues.length,
      pending: issues.filter(i => ["Pending Assignment", "Assigned", "In Progress"].includes(i.status)).length,
      resolved: issues.filter(i => ["Resolved (Awaiting Confirmation)", "Closed"].includes(i.status)).length,
      highPriority: issues.filter(i => i.priority === "High" || i.priority === "Urgent").length,
      groupedCommunity: Object.entries(groupedCommunityIssues).map(([location, arr]) => ({
        location,
        count: arr.length
      }))
    };

    res.json({
      success: true,
      analytics,
      residentIssues,
      communityIssues,
      groupedCommunityIssues
    });

  } catch (error) {
    console.error("Fetch Issues Error:", error);
    res.status(500).json({ success: false, message: "Server error while fetching issues" });
  }
};


// --------------------------------------------------
// MANAGER: Reassign Issue
// --------------------------------------------------


export const reassignIssue = async (req, res) => {
  try {
    const { newWorker, remarks, deadline } = req.body;

    

    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });

    const invalidStatuses = [
      "Resolved (Awaiting Confirmation)",
      "Closed",
      "Auto-Closed",
      "Rejected",
    ];

    if (invalidStatuses.includes(issue.status)) {
      return res.status(400).json({ success: false, message: "Cannot reassign a completed / closed issue." });
    }

    // If there was never an assigned worker, instruct to use assign instead
    if (!issue.workerAssigned) {
      return res.status(400).json({
        success: false,
        message: "Issue has no assigned worker. Use assign instead.",
      });
    }

    // Prevent reassign to the same worker
    if (issue.workerAssigned.toString() === newWorker.toString()) {
      return res.status(400).json({ success: false, message: "Issue is already assigned to this worker." });
    }

    // Find new worker
    const workerData = await Worker.findById(newWorker);
    if (!workerData) return res.status(404).json({ success: false, message: "New worker not found." });

    
    // --- Non-transactional (standard) flow ---
    // Remove from old worker (if exists)
    if (issue.workerAssigned) {
      const oldWorker = await Worker.findById(issue.workerAssigned);
      if (oldWorker) {
        oldWorker.assignedIssues = oldWorker.assignedIssues.filter(
          (w) => w.toString() !== issue._id.toString()
        );
        await oldWorker.save();
      }
    }

    // Update issue
    issue.workerAssigned = newWorker;
    issue.status = "Assigned";
    issue.autoAssigned = false;
    issue.deadline = deadline || issue.deadline;
    issue.remarks = remarks || issue.remarks;
    await issue.save();

    // Push issue to new worker, avoid duplicates
    if (!workerData.assignedIssues.map(String).includes(issue._id.toString())) {
      workerData.assignedIssues.push(issue._id);
      await workerData.save();
    }

    // Optionally populate to return useful info
    const populated = await Issue.findById(issue._id)
      .populate("resident")
      .populate("workerAssigned")
      .populate("payment");

    return res.json({
      success: true,
      message: "Issue successfully reassigned!",
      issue: populated
    });

  } catch (error) {
    console.error("Reassign Error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};



// --------------------------------------------------
// MANAGER: Close Issue
// --------------------------------------------------
export const closeIssueByManager = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });

    issue.status = "Closed";
    await issue.save();

    res.json({ success: true, message: "Issue closed by manager" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// --------------------------------------------------
// MANAGER: Put On Hold
// --------------------------------------------------
export const holdIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ success: false, message: "Issue not found" });

    issue.status = "On Hold";
    issue.remarks = req.body.remarks || "On Hold by Manager";
    await issue.save();

    res.json({ success: true, message: "Issue put on hold" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// --------------------------------------------------
// MANAGER: Get issue by ID
// --------------------------------------------------
export const getIssueById = async (req, res) => {
  const id = req.params.id;

  const issue = await Issue.findById(id)
    .populate("resident")
    .populate("workerAssigned")
    .populate("payment");

  if (!issue) return res.status(404).json({ message: "Issue not found" });

  res.status(200).json({ success: true, issue });
};


// --------------------------------------------------
// RESIDENT: Raise Issue
// --------------------------------------------------
export const raiseIssue = async (req, res) => {
  try {
    const { title, category, categoryType, description, location, priority, otherCategory } = req.body;

    if (!category || !categoryType || !description) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const resident = await Resident.findById(req.user.id);
    if (!resident) return res.status(404).json({ success: false, message: "Resident not found" });

    let finalLocation = "";
    if (categoryType === "Resident") {
      finalLocation = resident.unitCode;
    } else {
      finalLocation = location || "Common Area";
    }

    // Duplicate check
    let duplicate;
    if (categoryType === "Resident") {
      duplicate = await checkDuplicateIssue(resident._id, category, finalLocation);
    } else {
      duplicate = await checkDuplicateCommunityIssue(category, finalLocation);
    }
    if (duplicate) {
      return res.status(409).json({ success: false, message: "Duplicate issue exists" });
    }

    // Create issue
    const issue = new Issue({
      title,
      category,
      categoryType,
      description,
      location: finalLocation,
      priority,
      resident: resident._id,
      community: resident.community,
      otherCategory,
      status: "Pending Assignment",
    });
    await issue.save();

    // Auto assign if Community issue
    if (categoryType === "Community") {
      await autoAssignCommunityIssue(issue);
    }

    res.status(201).json({ success: true, issue });
  } catch (error) {
    console.error("Raise Issue Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// --------------------------------------------------
// RESIDENT: Confirm Issue
// --------------------------------------------------
export const confirmIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue)
      return res.status(404).json({ success: false, message: "Issue not found" });

    // Only allow for Resident issues
    if (issue.categoryType !== "Resident") {
      return res.status(400).json({ success: false, message: "Community issues do not require resident confirmation." });
    }

    if (issue.status !== "Resolved (Awaiting Confirmation)") {
      return res.status(400).json({ success: false, message: "Cannot confirm this issue" });
    }

    issue.status = "Closed";
    await issue.save();

    res.json({ success: true, message: "Issue closed successfully." });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// --------------------------------------------------
// RESIDENT: Reject Issue Resolution
// --------------------------------------------------
export const rejectIssueResolution = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);

    if (!issue)
      return res.status(404).json({ success: false, message: "Issue not found" });

    // Only allow for Resident issues
    if (issue.categoryType !== "Resident") {
      return res.status(400).json({ success: false, message: "Community issues do not require rejection." });
    }

    if (issue.status !== "Resolved (Awaiting Confirmation)") {
      return res.status(400).json({
        success: false,
        message: "Issue cannot be rejected"
      });
    }

    issue.status = "Reopened";
    issue.autoAssigned = false;
    await issue.save();

    res.json({
      success: true,
      message: "Issue reopened. Manager will reassign."
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};


// --------------------------------------------------
// RESIDENT: Delete Issue
// --------------------------------------------------
export const deleteIssue = async (req, res) => {
  try {
    const { issueID } = req.params;

    const issue = await Issue.findOneAndDelete({ _id: issueID });
    if (!issue)
      return res.status(404).json({ success: false, message: "Issue not found" });

    const resident = await Resident.findById(req.user.id);
    if (!resident)
      return res.status(404).json({ success: false, message: "Resident not found" });

    resident.raisedIssues = resident.raisedIssues.filter(
      (id) => id.toString() !== issueID
    );
    await resident.save();

    res.json({ success: true, message: "Issue deleted successfully" });

  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


// --------------------------------------------------
// WORKER: Start Issue
// --------------------------------------------------
export const startIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue)
      return res.status(404).json({ success: false, message: "Issue not found" });

    if (issue.status !== "Assigned") {
      return res.status(400).json({ success: false, message: "Issue must be Assigned before starting" });
    }

    issue.status = "In Progress";
    await issue.save();

    res.json({ success: true, message: "Issue marked as In Progress" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// --------------------------------------------------
// WORKER: Resolve Issue
// --------------------------------------------------
export const resolveIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id).populate("resident");
    if (!issue)
      return res.status(404).json({ success: false, message: "Issue not found" });

    if (issue.status !== "In Progress") {
      return res.status(400).json({ success: false, message: "Issue must be In Progress to resolve" });
    }

    if (issue.categoryType === "Resident") {
      issue.status = "Resolved (Awaiting Confirmation)";
      issue.resolvedAt = new Date();
      issue.resident.notifications.push({
        n: `Your issue ${issue.issueID} has been resolved. Please confirm.`,
        createdAt: new Date(),
        belongs: "Issue",
      });
      await issue.resident.save();
    } else if (issue.categoryType === "Community") {
      issue.status = "Closed";
      issue.resolvedAt = new Date();
      // Optionally: Notify all reporters here
    }

    await issue.save();

    res.json({ success: true, message: "Issue resolved." });

  } catch (error) {
    console.error("Resolve Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// --------------------------------------------------
// WORKER: Flag Misassigned
// --------------------------------------------------
export const misassignedIssue = async (req, res) => {
  try {
    await flagMisassigned(req.params.id);
    res.json({
      success: true,
      message: "Issue flagged as misassigned. Auto reassignment triggered.",
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all issues for a resident
export const getResidentIssues = async (req, res) => {
  try {
    const issues = await Issue.find({ resident: req.user.id })
      .populate("workerAssigned")
      .populate("payment");

    res.status(200).json({ issues });
  } catch (error) {
    console.error("Error fetching issues:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Get issue data by ID
export const getIssueDataById = async (req, res) => {
  try {
    const { issueID } = req.params;
    console.log("Fetching issue data for ID:", issueID);
    const issue = await Issue.findById(issueID)
      .populate("resident")
      .populate("workerAssigned")
      .populate("payment");
    if (!issue) {
      return res.status(404).json({ error: "Issue not found." });
    }
    console.log("Issue data found:", issue);

    res.status(200).json(issue);
  } catch (error) {
    console.error("Error fetching issue data:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

// --------------------------------------------------
// RESIDENT: Submit Feedback & Trigger Payment
// --------------------------------------------------
export const submitFeedback = async (req, res) => {
  const { id, feedback, rating } = req.body;
  try {
    const issue = await Issue.findById(id).populate({
      path: "community",
      select: "communityManager"
    });

    if (!issue) {
      return res.status(404).json({ success: false, message: "Issue not found." });
    }
    // Only allow for Resident issues
    if (issue.categoryType !== "Resident" || issue.status !== "Closed") {
      return res.status(400).json({ success: false, message: "Feedback can only be submitted for closed Resident issues." });
    }
    if (issue.feedback) {
      return res.status(400).json({ success: false, message: "Feedback already submitted for this issue." });
    }

    // Set feedback and rating
    issue.feedback = feedback;
    issue.rating = rating;
    issue.status = "Payment Pending";

    // Get the community manager from the populated community
    const communityManagerId = issue.community?.communityManager;
    if (!communityManagerId) {
      return res.status(400).json({ success: false, message: "Community manager not found for this issue." });
    }

    // Create payment (set receiver to community manager)
    const payment = new Payment({
      title: issue.title,
      sender: issue.resident,
      receiver: communityManagerId,
      amount: issue.estimatedCost || 0,
      status: "Pending",
      community: issue.community?._id,
      belongTo: "Issue",
      belongToId: issue._id
    });
    await payment.save();

    issue.payment = payment._id;
    await issue.save();

    res.json({ success: true, message: "Feedback submitted and payment initiated." });
  } catch (error) {
    console.error("Error submitting feedback:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
};
