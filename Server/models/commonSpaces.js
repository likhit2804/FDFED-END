import mongoose from "mongoose";
import Community from "./communities.js";

const commonSpacesSchema = new mongoose.Schema({
  ID: String,

  name: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  Date: {
    type: String,
    required: true,
  },

  from: {
    type: String,
    required: true,
  },

  Type: {
    type: String,
    required: true
  },

  to: {
    type: String,
    required: true,
  },

  status: {
    type: String,
    enum: [
      "Pending",
      "Available",
      "Active",
      "Approved",
      "Booked",
      "Pending Payment",
      "Paid",
      "Cancelled By Resident",
      "Cancelled By Manager",
      "Completed",
      "Expired",
      "Rejected"
    ],
    default: "Pending",
  },

  paymentStatus: {
    type: String,
    enum: ["Pending", "Success", "Failed", "Refunded"],
    default: "Pending",
  },

  payment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Payment",
  },

  amount: {
    type: Number,
  },

  refundId: {
    type: String,
  },
  refundAmount: {
    type: Number,
    default: 0,
  },

  availability: {
    type: String,
  },

  auditTrail: [
    {
      actionBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      role: { type: String, enum: ["Resident", "Manager", "System"] },
      action: String,
      timestamp: { type: Date, default: Date.now },
      notes: String,
    },
  ],


  bookedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Resident",
  },

  feedback: String,

  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Community",
  },

  cancelledAt: {
    type: Date,
  },

  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Resident",
  },

  cancellationReason: {
    type: String,
  },

  notificationsSent: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });
commonSpacesSchema.index({ community: 1, status: 1 });
commonSpacesSchema.index({ bookedBy: 1 });
commonSpacesSchema.index({ community: 1, Date: 1 });

const CommonSpaces = mongoose.model("CommonSpaces", commonSpacesSchema);
export default CommonSpaces;
