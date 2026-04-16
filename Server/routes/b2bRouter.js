import express from "express";
import Community from "../models/communities.js";
import Resident from "../models/resident.js";
import Issue from "../models/issues.js";
import Worker from "../models/workers.js";
import Payment from "../models/payment.js";

const b2bRouter = express.Router();

function buildCodeMatcher(code) {
  return new RegExp(`^${String(code || "").trim()}$`, "i");
}

function mapWebhookStatus(status) {
  const normalized = String(status || "").trim().toLowerCase();

  if (normalized === "completed" || normalized === "paid" || normalized === "captured") {
    return "Completed";
  }

  if (normalized === "pending" || normalized === "authorized" || normalized === "created") {
    return "Pending";
  }

  if (normalized === "failed" || normalized === "refunded") {
    return "Failed";
  }

  return null;
}

/**
 * @swagger
 * /api/v1/communities/{code}/info:
 *   get:
 *     summary: Get public community information by code
 *     description: Returns public-facing community data for B2B integrations.
 *     tags: [B2B]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique community code
 *     responses:
 *       200:
 *         description: Community info
 *       401:
 *         description: Missing API key
 *       403:
 *         description: Invalid API key
 *       404:
 *         description: Community not found
 */
b2bRouter.get("/communities/:code/info", async (req, res) => {
  try {
    const community = await Community.findOne({
      communityCode: buildCodeMatcher(req.params.code),
    }).select("name location description communityCode subscriptionStatus createdAt");

    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    const residentCount = await Resident.countDocuments({ community: community._id });

    return res.json({
      success: true,
      community: {
        code: community.communityCode,
        name: community.name,
        location: community.location,
        description: community.description,
        subscriptionStatus: community.subscriptionStatus,
        residentCount,
        createdAt: community.createdAt,
      },
    });
  } catch (error) {
    console.error("[B2B] Community info lookup failed:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * @swagger
 * /api/v1/communities/{code}/stats:
 *   get:
 *     summary: Get community statistics
 *     description: Returns aggregated community statistics for partner systems.
 *     tags: [B2B]
 *     security:
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Community statistics
 *       404:
 *         description: Community not found
 */
b2bRouter.get("/communities/:code/stats", async (req, res) => {
  try {
    const community = await Community.findOne({
      communityCode: buildCodeMatcher(req.params.code),
    }).select("name communityCode");

    if (!community) {
      return res.status(404).json({
        success: false,
        message: "Community not found",
      });
    }

    const communityId = community._id;

    const [residentCount, workerCount, issueStats, paymentStats] = await Promise.all([
      Resident.countDocuments({ community: communityId }),
      Worker.countDocuments({ community: communityId, isActive: true }),
      Issue.aggregate([
        { $match: { community: communityId } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: { community: communityId } },
        { $group: { _id: "$status", total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
    ]);

    return res.json({
      success: true,
      community: {
        code: community.communityCode,
        name: community.name,
      },
      stats: {
        residents: residentCount,
        activeWorkers: workerCount,
        issues: Object.fromEntries(
          issueStats.map((entry) => [entry._id || "Unknown", entry.count]),
        ),
        payments: Object.fromEntries(
          paymentStats.map((entry) => [
            entry._id || "Unknown",
            { count: entry.count, total: entry.total },
          ]),
        ),
      },
      generatedAt: new Date(),
    });
  } catch (error) {
    console.error("[B2B] Community stats lookup failed:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

/**
 * @swagger
 * /api/v1/webhooks/payment-status:
 *   post:
 *     summary: Receive payment status updates from external systems
 *     description: Demonstrates a B2B webhook that lets external payment providers push status updates into UrbanEase.
 *     tags: [B2B]
 *     security:
 *       - apiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [transactionId, status]
 *             properties:
 *               transactionId:
 *                 type: string
 *               orderId:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [completed, pending, failed, refunded]
 *               amount:
 *                 type: number
 *               gateway:
 *                 type: string
 *     responses:
 *       200:
 *         description: Webhook received
 *       400:
 *         description: Missing required fields
 */
b2bRouter.post("/webhooks/payment-status", async (req, res) => {
  try {
    const { transactionId, orderId, status, amount, gateway } = req.body;

    if (!transactionId || !status) {
      return res.status(400).json({
        success: false,
        message: "transactionId and status are required",
      });
    }

    const mappedStatus = mapWebhookStatus(status);

    if (!mappedStatus) {
      return res.status(400).json({
        success: false,
        message: "Unsupported payment status received",
      });
    }

    const payment = await Payment.findOne({
      $or: [
        { gatewayPaymentId: transactionId },
        { gatewayOrderId: orderId || transactionId },
        { ID: transactionId },
      ],
    });

    console.log("[B2B Webhook] Payment update received", {
      transactionId,
      orderId,
      status,
      mappedStatus,
      gateway: gateway || "unknown",
      apiClient: req.apiClient?.keyHint || "n/a",
    });

    if (payment) {
      payment.status = mappedStatus;
      payment.gateway = gateway || payment.gateway || "external";
      payment.gatewayPaymentId = payment.gatewayPaymentId || transactionId;
      payment.gatewayOrderId = payment.gatewayOrderId || orderId || null;

      if (typeof amount === "number" && Number.isFinite(amount)) {
        payment.amount = amount;
      }

      if (mappedStatus === "Completed" && !payment.paymentDate) {
        payment.paymentDate = new Date();
        payment.paymentMethod = payment.paymentMethod === "None" ? "Gateway" : payment.paymentMethod;
      }

      const webhookNote = `Webhook status sync: ${String(status).trim().toLowerCase()} via ${gateway || "external"}`;
      payment.remarks = payment.remarks ? `${payment.remarks} | ${webhookNote}` : webhookNote;

      await payment.save();
    }

    return res.json({
      success: true,
      message: "Webhook received",
      matchedPayment: Boolean(payment),
      transactionId,
      status: mappedStatus,
      processedAt: new Date(),
    });
  } catch (error) {
    console.error("[B2B] Payment webhook failed:", error);
    return res.status(500).json({
      success: false,
      message: "Webhook processing failed",
    });
  }
});

export default b2bRouter;
