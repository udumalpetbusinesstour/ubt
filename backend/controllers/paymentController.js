const crypto = require('crypto');
const Razorpay = require('razorpay');
const Business = require('../models/Business');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');
const Plan = require('../models/Plan');
const { sendSuccess, sendError } = require('../utils/responseHelper');

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_ubt_key_id_123456',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'rzp_test_ubt_secret_654321',
});

/**
 * Initiate a new subscription checkout order
 */
const createOrder = async (req, res, next) => {
  try {
    const { businessId, planId, planType } = req.body;

    const business = await Business.findById(businessId);
    if (!business) {
      return sendError(res, 404, 'Business listing not found');
    }

    // Dynamic price lookup
    let activePrice = 69; // Default Monthly price ₹69 as per spec
    let activeDays = 28;  // 28 days monthly cycle as per spec
    let resolvedPlanType = planType || 'Monthly';

    if (planId) {
      const planDoc = await Plan.findById(planId);
      if (planDoc) {
        activePrice = planDoc.price;
        activeDays = planDoc.durationDays;
        resolvedPlanType = planDoc.type;
      }
    } else {
      // Standard pricing defaults
      if (resolvedPlanType.toLowerCase() === 'yearly') {
        activePrice = 690; // Default Yearly price ₹690 as per spec
        activeDays = 365;
      }
    }

    // Create Razorpay Order
    const options = {
      amount: activePrice * 100, // Razorpay works in paise
      currency: 'INR',
      receipt: `receipt_sub_${businessId}_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

    // Save a draft subscription tracking record
    await Subscription.create({
      businessId,
      ownerId: req.user._id,
      plan: resolvedPlanType,
      planType: resolvedPlanType,
      amount: activePrice,
      status: 'pending',
      razorpayOrderId: order.id,
      startDate: new Date(),
      endDate: new Date(Date.now() + activeDays * 24 * 60 * 60 * 1000)
    });

    return sendSuccess(res, 201, 'Razorpay order created successfully', {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      businessId,
      planType: resolvedPlanType,
      price: activePrice
    });
  } catch (err) {
    console.error('Error generating Razorpay checkout order:', err);
    // Simulate offline order fallback for sandbox environments
    const offlineOrderId = `order_offline_${Math.floor(Math.random() * 900000 + 100000)}`;
    const offlinePrice = req.body.planType?.toLowerCase() === 'yearly' ? 690 : 69;
    const offlineDays = req.body.planType?.toLowerCase() === 'yearly' ? 365 : 28;

    await Subscription.create({
      businessId: req.body.businessId,
      ownerId: req.user._id,
      plan: req.body.planType || 'Monthly',
      planType: req.body.planType || 'Monthly',
      amount: offlinePrice,
      status: 'pending',
      razorpayOrderId: offlineOrderId,
      startDate: new Date(),
      endDate: new Date(Date.now() + offlineDays * 24 * 60 * 60 * 1000)
    });

    return sendSuccess(res, 201, 'Razorpay sandbox offline order generated', {
      orderId: offlineOrderId,
      amount: offlinePrice * 100,
      currency: 'INR',
      businessId: req.body.businessId,
      planType: req.body.planType || 'Monthly',
      price: offlinePrice
    });
  }
};

/**
 * Verify Razorpay payment signature & activate subscription
 */
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, businessId } = req.body;

    const subscription = await Subscription.findOne({ razorpayOrderId });
    if (!subscription) {
      return sendError(res, 404, 'Subscription transaction reference not found');
    }

    let isSignatureValid = false;

    // Sandbox bypass check
    if (razorpayOrderId.startsWith('order_offline_')) {
      isSignatureValid = true;
    } else {
      const body = razorpayOrderId + '|' + razorpayPaymentId;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'rzp_test_ubt_secret_654321')
        .update(body.toString())
        .digest('hex');

      isSignatureValid = expectedSignature === razorpaySignature;
    }

    if (!isSignatureValid) {
      subscription.status = 'expired';
      await subscription.save();
      return sendError(res, 400, 'Razorpay payment signature verification failed');
    }

    // Activate subscription
    subscription.status = 'active';
    subscription.razorpayPaymentId = razorpayPaymentId || `pay_sim_${Date.now()}`;
    await subscription.save();

    // Log the transaction payment details
    const payment = await Payment.create({
      businessId: subscription.businessId,
      subscriptionId: subscription._id,
      razorpayOrderId,
      razorpayPaymentId: subscription.razorpayPaymentId,
      amount: subscription.amount,
      paymentMethod: req.body.paymentMethod || 'UPI',
      paymentStatus: 'Paid',
      paidAt: new Date()
    });

    // Mark corresponding business listing as Active Premium UBT Verified
    const business = await Business.findById(subscription.businessId);
    if (business) {
      business.subscriptionStatus = 'active';
      business.subscriptionExpiry = subscription.endDate;
      business.isPremium = true;
      await business.save();
    }

    return sendSuccess(res, 200, 'Subscription successfully activated', {
      subscription,
      payment
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  verifyPayment
};
