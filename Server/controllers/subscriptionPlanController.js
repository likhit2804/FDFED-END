// controllers/subscriptionPlanController.js
import SubscriptionPlan from '../models/subscriptionPlan.js';

// Get all subscription plans (active only for public, all for admin)
export const getAllPlans = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    
    const filter = includeInactive === 'true' ? {} : { isActive: true };
    
    const plans = await SubscriptionPlan.find(filter)
      .sort({ displayOrder: 1 });
    
    res.json({ success: true, data: plans });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get single plan by ID
export const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const plan = await SubscriptionPlan.findById(id);
    
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    
    res.json({ success: true, data: plan });
  } catch (error) {
    console.error('Error fetching plan:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Create new subscription plan (Admin only)
export const createPlan = async (req, res) => {
  try {
    const { planKey, name, price, duration, maxResidents, features, description, displayOrder } = req.body;
    
    // Check if plan with this key already exists
    const existingPlan = await SubscriptionPlan.findOne({ planKey });
    if (existingPlan) {
      return res.status(400).json({ 
        success: false, 
        message: 'Plan with this key already exists' 
      });
    }
    
    const newPlan = new SubscriptionPlan({
      planKey,
      name,
      price,
      duration: duration || 'monthly',
      maxResidents: maxResidents || null,
      features: features || [],
      description,
      displayOrder: displayOrder || 0,
      isActive: true
    });
    
    await newPlan.save();
    
    res.status(201).json({ 
      success: true, 
      message: 'Plan created successfully',
      data: newPlan 
    });
  } catch (error) {
    console.error('Error creating plan:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Update subscription plan (Admin only)
export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, duration, maxResidents, features, description, displayOrder, isActive } = req.body;
    
    const plan = await SubscriptionPlan.findById(id);
    
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    
    // Update fields
    if (name !== undefined) plan.name = name;
    if (price !== undefined) plan.price = price;
    if (duration !== undefined) plan.duration = duration;
    if (maxResidents !== undefined) plan.maxResidents = maxResidents;
    if (features !== undefined) plan.features = features;
    if (description !== undefined) plan.description = description;
    if (displayOrder !== undefined) plan.displayOrder = displayOrder;
    if (isActive !== undefined) plan.isActive = isActive;
    
    await plan.save();
    
    res.json({ 
      success: true, 
      message: 'Plan updated successfully',
      data: plan 
    });
  } catch (error) {
    console.error('Error updating plan:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete subscription plan (Admin only)
export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    
    const plan = await SubscriptionPlan.findById(id);
    
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Plan not found' });
    }
    
    // Soft delete - just mark as inactive
    plan.isActive = false;
    await plan.save();
    
    res.json({ 
      success: true, 
      message: 'Plan deactivated successfully' 
    });
  } catch (error) {
    console.error('Error deleting plan:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Initialize default plans (run once on server startup or manually)
export const initializeDefaultPlans = async () => {
  try {
    const count = await SubscriptionPlan.countDocuments();
    
    if (count > 0) {
      console.log('Subscription plans already exist. Skipping initialization.');
      return;
    }
    
    const defaultPlans = [
      {
        planKey: 'basic',
        name: 'Up to 100 Residents',
        price: 1999,
        duration: 'monthly',
        maxResidents: 100,
        features: [
          'Resident Management',
          'Basic Reports',
          'Email Support',
          'Community Portal'
        ],
        displayOrder: 1,
        isActive: true
      },
      {
        planKey: 'standard',
        name: 'Up to 300 Residents',
        price: 3999,
        duration: 'monthly',
        maxResidents: 300,
        features: [
          'All Basic Features',
          'Advanced Reports',
          'Priority Support',
          'Worker Management'
        ],
        displayOrder: 2,
        isActive: true
      },
      {
        planKey: 'premium',
        name: 'Up to 500 Residents',
        price: 6999,
        duration: 'monthly',
        maxResidents: 500,
        features: [
          'All Standard Features',
          'Advanced Analytics',
          '24/7 Support',
          'Custom Integrations'
        ],
        displayOrder: 3,
        isActive: true
      },
      {
        planKey: 'enterprise',
        name: '500+ Residents',
        price: 9999,
        duration: 'monthly',
        maxResidents: null,
        features: [
          'All Premium Features',
          'Unlimited Residents',
          'Dedicated Account Manager',
          'Custom Development'
        ],
        displayOrder: 4,
        isActive: true
      }
    ];
    
    await SubscriptionPlan.insertMany(defaultPlans);
    console.log('✅ Default subscription plans initialized successfully');
  } catch (error) {
    console.error('Error initializing default plans:', error);
  }
};
