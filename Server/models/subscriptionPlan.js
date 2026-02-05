// models/subscriptionPlan.js
import mongoose from "mongoose";

const SubscriptionPlanSchema = new mongoose.Schema({
  planKey: {
    type: String,
    required: true,
    unique: true
  },
  
  name: {
    type: String,
    required: true
  },
  
  price: {
    type: Number,
    required: true,
    min: 0
  },
  
  duration: {
    type: String,
    enum: ["monthly", "yearly"],
    default: "monthly"
  },
  
  maxResidents: {
    type: Number,
    default: null // null means unlimited
  },
  
  features: [{
    type: String
  }],
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  displayOrder: {
    type: Number,
    default: 0
  },
  
  description: {
    type: String
  }
  
}, { timestamps: true });

SubscriptionPlanSchema.index({ planKey: 1, isActive: 1 });
SubscriptionPlanSchema.index({ displayOrder: 1 });

const SubscriptionPlan = mongoose.model("SubscriptionPlan", SubscriptionPlanSchema);

export default SubscriptionPlan;
