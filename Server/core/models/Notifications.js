import mongoose from "mongoose";

const notificationsSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "resident" },
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: "communities" },
    title: { type: String, default: "" },
    message: { type: String, required: true },
    type: { type: String, default: "info" },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

const Notifications =
  mongoose.models.Notifications ||
  mongoose.model("Notifications", notificationsSchema);

export default Notifications;