import CommonSpaces from "../../../models/commonSpaces.js";
import Issue from "../../../models/issues.js";
import Payment from "../../../models/payment.js";
import { sendError } from "./manager_helpers.js";

export {
  getDashboardData,
  getDashboardInfo,
} from "../../../../pipelines/dashboard/manager/controller.js";

// Legacy resident endpoints still imported by residentRouter.
export const getCommonSpace = async (req, res) => {
  try {
    const data = await CommonSpaces.find({ bookedBy: req.user.id })
      .populate("payment")
      .sort({ createdAt: -1 });
    return res.json({ success: true, data });
  } catch (error) {
    console.error("Error fetching resident common spaces:", error);
    return sendError(res, 500, "Failed to fetch common spaces", error);
  }
};

export const getIssueData = async (req, res) => {
  try {
    const issues = await Issue.find({ resident: req.user.id })
      .populate("workerAssigned")
      .sort({ createdAt: -1 });
    return res.json({ success: true, issues });
  } catch (error) {
    console.error("Error fetching resident issues:", error);
    return sendError(res, 500, "Failed to fetch issues", error);
  }
};

export const getPaymentData = async (req, res) => {
  try {
    const payments = await Payment.find({ sender: req.user.id })
      .populate("receiver", "name email")
      .sort({ createdAt: -1 });
    return res.json({ success: true, payments });
  } catch (error) {
    console.error("Error fetching resident payments:", error);
    return sendError(res, 500, "Failed to fetch payments", error);
  }
};
