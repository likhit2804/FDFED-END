import SubscriptionPlan from "../../models/subscriptionPlan.js";

export const getAllPlans = async (req, res) => {
    try {
        const plans = await SubscriptionPlan.find().sort({ displayOrder: 1, createdAt: 1 }).lean();
        return res.status(200).json({ success: true, data: plans });
    } catch (e) { return res.status(500).json({ success: false, message: "Failed to fetch subscription plans" }); }
};

export const getPlanById = async (req, res) => {
    try {
        const plan = await SubscriptionPlan.findById(req.params.id).lean();
        if (!plan) return res.status(404).json({ success: false, message: "Subscription plan not found" });
        return res.status(200).json({ success: true, data: plan });
    } catch (e) { return res.status(500).json({ success: false, message: "Failed to fetch subscription plan" }); }
};

export const createPlan = async (req, res) => {
    try {
        const { planKey, name, price, duration, maxResidents, features, isActive, displayOrder } = req.body;
        if (!planKey || !name || price === undefined || !duration)
            return res.status(400).json({ success: false, message: "Missing required fields: planKey, name, price, duration" });
        const existing = await SubscriptionPlan.findOne({ planKey: planKey.toLowerCase().trim() });
        if (existing) return res.status(400).json({ success: false, message: `Plan with key '${planKey}' already exists` });
        const doc = new SubscriptionPlan({ planKey: planKey.toLowerCase().trim(), name: name.trim(), price: Number(price), duration, maxResidents: maxResidents ? Number(maxResidents) : null, features: features || [], isActive: isActive !== undefined ? isActive : true, displayOrder: displayOrder !== undefined ? Number(displayOrder) : 0 });
        await doc.save();
        return res.status(201).json({ success: true, message: "Subscription plan created successfully", data: doc });
    } catch (e) { return res.status(500).json({ success: false, message: "Failed to create subscription plan" }); }
};

export const updatePlan = async (req, res) => {
    try {
        const { planKey, name, price, duration, maxResidents, features, isActive, displayOrder } = req.body;
        const plan = await SubscriptionPlan.findById(req.params.id);
        if (!plan) return res.status(404).json({ success: false, message: "Subscription plan not found" });
        if (planKey && planKey.toLowerCase().trim() !== plan.planKey) {
            const existing = await SubscriptionPlan.findOne({ planKey: planKey.toLowerCase().trim() });
            if (existing) return res.status(400).json({ success: false, message: `Plan with key '${planKey}' already exists` });
            plan.planKey = planKey.toLowerCase().trim();
        }
        if (name !== undefined) plan.name = name.trim();
        if (price !== undefined) plan.price = Number(price);
        if (duration !== undefined) plan.duration = duration;
        if (maxResidents !== undefined) plan.maxResidents = maxResidents ? Number(maxResidents) : null;
        if (features !== undefined) plan.features = features;
        if (isActive !== undefined) plan.isActive = isActive;
        if (displayOrder !== undefined) plan.displayOrder = Number(displayOrder);
        await plan.save();
        return res.status(200).json({ success: true, message: "Subscription plan updated successfully", data: plan });
    } catch (e) { return res.status(500).json({ success: false, message: "Failed to update subscription plan" }); }
};

export const deletePlan = async (req, res) => {
    try {
        const plan = await SubscriptionPlan.findByIdAndDelete(req.params.id);
        if (!plan) return res.status(404).json({ success: false, message: "Subscription plan not found" });
        return res.status(200).json({ success: true, message: "Subscription plan deleted successfully" });
    } catch (e) { return res.status(500).json({ success: false, message: "Failed to delete subscription plan" }); }
};

export const initializeDefaultPlans = async () => {
    try {
        if ((await SubscriptionPlan.countDocuments()) === 0) {
            await SubscriptionPlan.insertMany([
                { planKey: "basic", name: "Basic Plan", price: 999, duration: "monthly", maxResidents: 50, features: ["Up to 50 residents", "Basic community management", "Issue tracking", "Visitor management"], isActive: true, displayOrder: 1 },
                { planKey: "standard", name: "Standard Plan", price: 1999, duration: "monthly", maxResidents: 150, features: ["Up to 150 residents", "Advanced management tools", "Issue tracking & automation", "Visitor & worker management", "Amenity booking"], isActive: true, displayOrder: 2 },
                { planKey: "premium", name: "Premium Plan", price: 3999, duration: "monthly", maxResidents: null, features: ["Unlimited residents", "Full feature access", "Priority support", "Custom integrations", "Advanced analytics"], isActive: true, displayOrder: 3 },
            ]);
            console.log("✅ Default subscription plans initialized");
        }
    } catch (e) { console.error("Error initializing default plans:", e); }
};
