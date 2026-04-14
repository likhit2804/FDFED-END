import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resident",
      required: true,
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CommunityManager",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    penalty: {
      p: { type: Number, min: 0 }, changedOn: { type: Date }
    },
    paymentDeadline: {
      type: Date,
    },
    paymentDate: {
      type: Date,
    },
    paymentMethod: {
      type: String,
      default: "None",
    },
    status: {
      type: String,
      enum: ["Pending", "Completed", "Failed", "Overdue"],
      default: "Pending",
    },
    remarks: {
      type: String,
    },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
    },
    ID: {
      type: String,
    },
    // Which entity this payment belongs to (Issue, CommonSpaces, etc.)
    // refPath makes Mongoose use the value of `belongTo` to resolve the ref
    belongTo: {
      type: String,
      enum: ["Issue", "CommonSpaces", "Resident"],
    },
    belongToId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "belongTo",  // ← dynamically uses belongTo value as the model name
    },
  },
  { timestamps: true }
);
paymentSchema.index({ community: 1, status: 1 });
paymentSchema.index({ sender: 1 });
paymentSchema.index({ receiver: 1 });

const Payment = mongoose.model("Payment", paymentSchema);
export default Payment;
