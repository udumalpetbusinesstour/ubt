const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const Subscription = require('../models/Subscription');
const Business = require('../models/Business');
const { sendSuccess, sendError } = require('../utils/responseHelper');

// Protect all subscription endpoints
router.use(protect);

// GET /api/subscriptions/active - Fetch merchant's active listing subscription
router.get('/active', async (req, res, next) => {
  try {
    const business = await Business.findOne({ ownerId: req.user._id });
    if (!business) {
      return sendError(res, 404, 'No business listing found for this user account');
    }

    const subscription = await Subscription.findOne({
      businessId: business._id,
      status: 'active'
    }).sort({ endDate: -1 });

    return sendSuccess(res, 200, 'Active subscription retrieved', {
      business,
      subscription: subscription || null
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/subscriptions/history - Merchant's own payment subscription history
router.get('/history', async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Subscription payment history logs retrieved', subscriptions);
  } catch (err) {
    next(err);
  }
});

// GET /api/subscriptions/admin/all - Admin only: inspect all platform subscriptions
router.get('/admin/all', admin, async (req, res, next) => {
  try {
    const subscriptions = await Subscription.find()
      .populate('ownerId', 'name email phone')
      .populate('businessId', 'name businessName status')
      .sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'All subscriptions retrieved', subscriptions);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
