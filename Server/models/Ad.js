import mongoose from "mongoose";
import Community from "./communities.js";

const advertisementSchema = new mongoose.Schema(
  {
    ID: String,
    title: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    imagePath: { type: String, required: true },
    link: { type: String },
    status: {
      type: String,
      enum: ["Pending", "Active", "Expired"],
      default: "Pending",
      set: (val) => {
        if (!val) return val;
        const formatted =
          val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
        return formatted;
      },
    },
    adType: {
      type: String,
      enum: ["Sponsored", "Announcement"],
    },
    targetAudience: {
      type: String,
    },

    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to set status based on current date
advertisementSchema.pre("save", function (next) {
  const now = new Date();
  if (this.startDate <= now && now <= this.endDate) {
    this.status = "Active";
  } else if (now < this.startDate) {
    this.status = "Pending";
  } else if (now > this.endDate) {
    this.status = "Expired";
  }
  next();
});

// Optional: virtual or method to update status dynamically when fetching
advertisementSchema.methods.updateStatus = function () {
  const now = new Date();
  if (this.startDate <= now && now <= this.endDate) {
    this.status = "Active";
  } else if (now < this.startDate) {
    this.status = "Pending";
  } else if (now > this.endDate) {
    this.status = "Expired";
  }
};
advertisementSchema.index({ community: 1, status: 1 });
advertisementSchema.index({ community: 1, startDate: 1, endDate: 1 });
advertisementSchema.index({ community: 1, createdAt: -1 });
advertisementSchema.index({ title: 'text' });

const Ad = mongoose.model("Ad", advertisementSchema);
export default Ad;
