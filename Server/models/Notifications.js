import mongoose from "mongoose";


const notificationSchema = new mongoose.Schema({
  type: String,
  title: String,
  message: String,
  read: { type: Boolean, default: false },
  referenceId: mongoose.Schema.Types.ObjectId,
  referenceType: String,

  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
  }
}, { timestamps: true }); // auto-manages createdAt + updatedAt

notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL: auto-delete expired

export default mongoose.model("Notifications", notificationSchema);

