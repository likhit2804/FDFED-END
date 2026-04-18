import mongoose from "mongoose";

const timeFormatRegex = /^([0-1]\d|2[0-3]):[0-5]\d$/;

const blackoutDateSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    reason: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const dateSlotOverrideSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    closedAllDay: { type: Boolean, default: false },
    closedSlots: [{ type: String }],
    reason: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const Amenities = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "Clubhouse",
        "Gym",
        "Banquet Hall",
        "Community Hall",
        "Swimming Pool",
        "Tennis Court",
        "Badminton Court",
        "Basketball Court",
        "Amphitheatre",
        "Guest Room",
        "Other",
      ],
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
    },
    Type:{
      type : String,
      enum : ["Slot","Subscription"]
    },
    bookable: { type: Boolean, default: true },
    bookingRules: { type: String },
    rent: Number,
    bookedSlots: [
      {
        date: { type: Date, required: true },
        slots: [{ type: String }],
      },
    ],
    availabilityControls: {
      slotConfig: {
        startTime: {
          type: String,
          default: "06:00",
          match: timeFormatRegex,
        },
        endTime: {
          type: String,
          default: "22:00",
          match: timeFormatRegex,
        },
      },
      bookingPolicy: {
        minAdvanceHours: {
          type: Number,
          min: 0,
          max: 720,
          default: 0,
        },
        maxAdvanceDays: {
          type: Number,
          min: 1,
          max: 365,
          default: 90,
        },
        sameDayCutoffTime: {
          type: String,
          default: "22:00",
          match: timeFormatRegex,
        },
      },
      blackoutDates: [blackoutDateSchema],
      dateSlotOverrides: [dateSlotOverrideSchema],
    },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Community",
      required: true,
    },
  },
  { timestamps: true }
);

Amenities.index({ community: 1 });
Amenities.index({ name: 'text', type: 'text' });

const Amenity = mongoose.model("Amenity", Amenities);

export default Amenity;
