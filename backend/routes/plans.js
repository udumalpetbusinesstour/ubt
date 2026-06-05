const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const Plan = require('../models/Plan');

// Helper to seed plans if they do not exist
const seedDefaultPlans = async () => {
  try {
    const plansCount = await Plan.countDocuments();
    if (plansCount === 0) {
      console.log('Seeding default UBT subscription plans...');
      await Plan.create([
        {
          name: 'Monthly Premium Plan',
          type: 'Monthly',
          price: 99,
          durationDays: 28,
          description: 'Perfect for standard listing updates and regular local traffic.',
          isOffer: false,
          offerText: '',
          features: ['Google Place integration', 'UDT Verification Badge Priority', 'WhatsApp Button Link', '1 Day Events Listing Promotion'],
          isActive: true
        },
        {
          name: 'Yearly Premium Plan',
          type: 'Yearly',
          price: 999,
          durationDays: 365,
          description: 'Maximize search priority, customer reviews visibility, and reach.',
          isOffer: true,
          offerText: 'Save 15% (2 Months Free)',
          features: ['Permanent Vetted Stamp', 'No ads on your listing', 'Infinite Event Promos', 'Customer Inquiry Lead SMS Integration', 'Direct co-founder desk helpline'],
          isActive: true
        }
      ]);
      console.log('Successfully seeded Monthly (28 days) & Yearly subscription plans in database.');
    } else {
      // Migrate old defaults to new default values if present
      const monthly = await Plan.findOne({ type: 'Monthly' });
      if (monthly && monthly.price === 69) {
        monthly.price = 99;
        await monthly.save();
        console.log('Migrated existing Monthly Premium Plan price to ₹99.');
      }
      const yearly = await Plan.findOne({ type: 'Yearly' });
      if (yearly && yearly.price === 690) {
        yearly.price = 999;
        await yearly.save();
        console.log('Migrated existing Yearly Premium Plan price to ₹999.');
      }
    }
  } catch (error) {
    console.error('Error auto-seeding subscription plans:', error.message);
  }
};

// @desc    Get all active subscription plans & offers
// @route   GET /api/plans
// @access  Public
router.get('/', async (req, res) => {
  try {
    // Ensure seeding check executes
    await seedDefaultPlans();
    const plans = await Plan.find({ isActive: true }).sort({ createdAt: 1 });
    res.json({ success: true, count: plans.length, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all plans (including inactive ones for Super Admin telemetry)
// @route   GET /api/plans/all
// @access  Private/Admin
router.get('/all', protect, admin, async (req, res) => {
  try {
    await seedDefaultPlans();
    const plans = await Plan.find().sort({ createdAt: 1 });
    res.json({ success: true, count: plans.length, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Publish a new subscription plan / promotional offer
// @route   POST /api/plans
// @access  Private/Admin
router.post('/', protect, admin, async (req, res) => {
  try {
    const { name, type, price, durationDays, description, isOffer, offerText, features } = req.body;

    if (!name || !type || price === undefined || !durationDays) {
      return res.status(400).json({ success: false, message: 'Please provide name, type, price, and durationDays' });
    }

    const newPlan = await Plan.create({
      name,
      type,
      price: Number(price),
      durationDays: Number(durationDays),
      description,
      isOffer: !!isOffer,
      offerText,
      features: Array.isArray(features) ? features : [],
    });

    res.status(201).json({ success: true, message: 'New subscription plan published!', data: newPlan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Modify listing plan parameters
// @route   PUT /api/plans/:id
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const { name, type, price, durationDays, description, isOffer, offerText, features, isActive } = req.body;

    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Subscription plan not found' });
    }

    if (name) plan.name = name;
    if (type) plan.type = type;
    if (price !== undefined) plan.price = Number(price);
    if (durationDays) plan.durationDays = Number(durationDays);
    if (description !== undefined) plan.description = description;
    if (isOffer !== undefined) plan.isOffer = !!isOffer;
    if (offerText !== undefined) plan.offerText = offerText;
    if (features) plan.features = features;
    if (isActive !== undefined) plan.isActive = !!isActive;

    await plan.save();

    res.json({ success: true, message: 'Plan configurations updated successfully!', data: plan });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete or deactivate a plan
// @route   DELETE /api/plans/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({ success: false, message: 'Subscription plan not found' });
    }

    // Toggle active status off, or delete custom ones
    if (plan.type === 'Monthly' || plan.type === 'Yearly') {
      plan.isActive = false;
      await plan.save();
      res.json({ success: true, message: 'Core system plans cannot be hard-deleted. Plan deactivated.', data: plan });
    } else {
      await plan.deleteOne();
      res.json({ success: true, message: 'Custom subscription option removed from directory listing schemas.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
module.exports.seedDefaultPlans = seedDefaultPlans;
