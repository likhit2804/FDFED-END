import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    price: { type: Number, required: true, min: 0 },
    durationInDays: { type: Number, required: true, min: 1 },
    features: [{ type: String }],
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

const SubscriptionPlan =
  mongoose.models.subscriptionPlan ||
  mongoose.model("subscriptionPlan", subscriptionPlanSchema);

export default SubscriptionPlan;
