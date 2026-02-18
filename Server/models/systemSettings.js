import mongoose from "mongoose";

const systemSettingsSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true, default: "global_settings" },
        skip2FA: { type: Boolean, default: false },
    },
    { timestamps: true }
);

const SystemSettings = mongoose.model("SystemSettings", systemSettingsSchema);

export default SystemSettings;
