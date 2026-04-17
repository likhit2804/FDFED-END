import mongoose from "mongoose";

const leaveSchema = new mongoose.Schema(
  {
    worker: { type: mongoose.Schema.Types.ObjectId, ref: "Worker", required: true },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: "CommunityManager" },
    community: { type: mongoose.Schema.Types.ObjectId, ref: "Community", required: true },
    type: {
      type: String,
      enum: ["sick", "casual", "annual", "other"],
      default: "other",
    },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    reason: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    appliedAt: { type: Date, default: Date.now },
    decisionAt: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

leaveSchema.index({ worker: 1, status: 1, appliedAt: -1 });
leaveSchema.index({ community: 1, status: 1 }); // manager views all leaves in their community
leaveSchema.index({ reason: 'text', notes: 'text' });

const Leave = mongoose.model("Leave", leaveSchema);

export default Leave;
