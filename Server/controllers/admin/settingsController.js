import SystemSettings from '../../models/systemSettings.js';

export const getSettings = async (req, res) => {
    try {
        let settings = await SystemSettings.findOne({ key: "global_settings" });
        if (!settings) {
            settings = await SystemSettings.create({ key: "global_settings", skip2FA: false });
        }
        res.json({ success: true, settings });
    } catch (err) {
        console.error("Error fetching settings:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

export const updateSettings = async (req, res) => {
    try {
        const { skip2FA } = req.body;
        let settings = await SystemSettings.findOneAndUpdate(
            { key: "global_settings" },
            { skip2FA },
            { new: true, upsert: true }
        );
        res.json({ success: true, settings });
    } catch (err) {
        console.error("Error updating settings:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
