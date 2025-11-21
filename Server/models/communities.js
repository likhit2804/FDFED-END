// models/Community.js
import mongoose from "mongoose";
import Amenity from "./Amenities.js";

const CommunitySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  location: { type: String, required: true },
  description: { type: String },

  status: { type: String, enum: ["Active", "Inactive"], default: "Active" },
  totalMembers: { type: Number, default: 0 },

  profile: {
    photos: [{
      filename: { type: String, required: true },
      originalName: { type: String, required: true },
      path: { type: String, required: true },
      size: { type: Number, required: true },
      mimeType: { type: String, required: true },
      uploadedAt: { type: Date, default: Date.now }
    }],
    logo: {
      filename: String,
      originalName: String,
      path: String,
      size: Number,
      mimeType: String,
      uploadedAt: Date
    }
  },

  // CURRENT subscription status only
  subscriptionPlan: {
    type: String,
    enum: ["basic", "standard", "premium"],
    default: "basic",
  },
  subscriptionStatus: {
    type: String,
    enum: ["active", "pending", "expired"],
    default: "pending",
  },
  planStartDate: Date,
  planEndDate: Date,

  // legacy (optional)
  paymentHistory: [{
    date: Date,
    amount: Number,
    method: String,
    transactionId: String,
    invoiceUrl: String
  }],

  commonSpaces: [{ type: mongoose.Schema.Types.ObjectId, ref: "Amenity" }],

  communityManager: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "CommunityManager"
  }
}, { timestamps: true });

CommunitySchema.index({ subscriptionStatus: 1, planEndDate: 1 });

// virtuals
CommunitySchema.virtual("isExpired").get(function () {
  if (!this.planEndDate) return true;
  return new Date() > new Date(this.planEndDate);
});

CommunitySchema.virtual("isExpiringSoon").get(function () {
  if (!this.planEndDate || this.subscriptionStatus !== "active") return false;
  const t = new Date();
  t.setDate(t.getDate() + 7);
  return new Date(this.planEndDate) <= t;
});

CommunitySchema.methods.updateSubscriptionStatus = function () {
  if (this.planEndDate && new Date() > new Date(this.planEndDate)) {
    this.subscriptionStatus = "expired";
  }
  return this;
};

const Community = mongoose.model("Community", CommunitySchema);
export default Community;
