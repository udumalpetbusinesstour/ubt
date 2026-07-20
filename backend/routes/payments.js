const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const Razorpay = require('razorpay');
const { protect, admin } = require('../middleware/auth');
const Business = require('../models/Business');
const Subscription = require('../models/Subscription');
const Plan = require('../models/Plan');
const User = require('../models/User');
const Event = require('../models/Event');
const Payment = require('../models/Payment');

// Initialize Razorpay client with fallback key
let razorpay;
try {
  const rawKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_mockKeyId12345';
  const rawKeySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_mockSecret12345';
  const key_id = rawKeyId.trim().replace(/['"]/g, '');
  const key_secret = rawKeySecret.trim().replace(/['"]/g, '');
  razorpay = new Razorpay({
    key_id,
    key_secret,
  });
} catch (error) {
  console.error('Error initializing Razorpay Client:', error.message);
}

// @desc    Create Razorpay Order
// @route   POST /api/payments/create-order
// @access  Private
router.post('/create-order', protect, async (req, res) => {
  try {
    const { businessId, planType, applyReferralPoints, redeemPointsAmount } = req.body;

    if (!businessId || !planType) {
      return res.status(400).json({ success: false, message: 'Business ID and Plan Type are required' });
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    // Check if there is already an active subscription (optional logging/metadata check)

    const dbPlan = await Plan.findOne({
      $or: [
        { type: planType },
        { name: planType }
      ],
      isActive: true
    });

    let planPrice = 0;
    if (dbPlan) {
      planPrice = dbPlan.price;
    } else {
      // Fallback
      if (planType === 'Monthly') {
        planPrice = 116.82;
      } else if (planType === 'Yearly') {
        planPrice = 1178.82;
      } else {
        return res.status(400).json({ success: false, message: 'Invalid plan type' });
      }
    }

    const user = await User.findById(req.user._id);

    // Business Rule #2: Max 10% deduction of plan value
    const maxDiscountRupees = Math.round(planPrice * 0.1);
    const maxPointsAllowed = maxDiscountRupees; // 1 point = 1 Rupee

    let discountAmountRupees = 0;
    let pointsUsed = 0;

    // Resolve Razorpay Plan ID
    let planId;
    if (planType && (planType.toLowerCase() === 'monthly' || planType.toLowerCase().includes('monthly'))) {
      const rawPlanId = process.env.RAZORPAY_MONTHLY_PLAN_ID || 'plan_T2gPOtzN9SzA22';
      planId = rawPlanId.trim().replace(/['"]/g, '');
    } else if (planType && (planType.toLowerCase() === 'yearly' || planType.toLowerCase().includes('yearly'))) {
      const rawPlanId = process.env.RAZORPAY_YEARLY_PLAN_ID || 'plan_T2gQxHxwqMigsk';
      planId = rawPlanId.trim().replace(/['"]/g, '');
    }

    let isMock = false;
    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'rzp_test_mockKeyId12345' || !razorpay) {
      isMock = true;
    }

    const finalAmount = Math.round((planPrice - discountAmountRupees) * 100);

    let subscriptionObj;
    if (!isMock) {
      try {
        const totalCount = (planType.toLowerCase() === 'monthly' || planType.toLowerCase().includes('monthly')) ? 120 : 10;
        subscriptionObj = await razorpay.subscriptions.create({
          plan_id: planId,
          total_count: totalCount,
          quantity: 1,
          customer_notify: 1,
          notes: {
            businessId: businessId.toString(),
            planType: planType
          }
        });
      } catch (err) {
        console.error('Razorpay Subscription SDK creation failed. Error details:', err.message);
        isMock = true;
      }
    }

    if (isMock) {
      subscriptionObj = {
        id: 'sub_mock_' + Math.random().toString(36).substr(2, 9),
        status: 'created'
      };
    }

    // Create draft subscription record in MongoDB (to prevent lost webhooks)
    let durationDays = dbPlan ? dbPlan.durationDays : (planType === 'Monthly' ? 28 : 365);
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    await Subscription.create({
      userId: req.user._id,
      ownerId: req.user._id,
      businessId: business._id,
      plan: planType,
      planName: planType,
      amount: planPrice - discountAmountRupees,
      amountPaid: planPrice - discountAmountRupees,
      referralDiscount: discountAmountRupees,
      status: 'pending',
      razorpaySubscriptionId: subscriptionObj.id,
      startDate,
      endDate,
      expiryDate: endDate,
      autoRenew: true
    });

    res.json({
      success: true,
      isSubscription: true,
      subscriptionId: subscriptionObj.id,
      amount: finalAmount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockKeyId12345',
      discountApplied: discountAmountRupees,
      pointsUsed
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});
// @desc    Sync pending Razorpay payment state (failsafe fallback for closed tabs/webhooks failure)
// @route   POST /api/payments/sync-pending-status
// @access  Private
router.post('/sync-pending-status', protect, async (req, res) => {
  try {
    const { businessId, eventId } = req.body;

    if (!businessId && !eventId) {
      return res.status(400).json({ success: false, message: 'Business ID or Event ID is required' });
    }

    if (businessId) {
      // Find the latest pending subscription for this business
      const pendingSub = await Subscription.findOne({ businessId, status: 'pending' }).sort({ createdAt: -1 });
      if (!pendingSub) {
        return res.json({ success: false, message: 'No pending subscription found for this business' });
      }

      const subId = pendingSub.razorpaySubscriptionId;
      if (!subId || subId.startsWith('sub_mock_') || !razorpay) {
        return res.json({ success: false, message: 'No active gateway subscription to sync' });
      }

      // Query Razorpay API directly
      try {
        const rzpSub = await razorpay.subscriptions.fetch(subId);
        console.log(`[PAYMENT SYNC] Razorpay subscription status for ${subId}: ${rzpSub.status}`);

        if (rzpSub.status === 'active' || rzpSub.status === 'authenticated' || rzpSub.status === 'completed') {
          // Process activation (Idempotency safe)
          pendingSub.status = 'active';
          pendingSub.amountPaid = pendingSub.amount;
          await pendingSub.save();

          // Mark business active
          const business = await Business.findById(businessId);
          if (business) {
            business.subscriptionStatus = 'active';
            business.subscriptionExpiry = pendingSub.endDate;
            business.isPremium = true;
            await business.save();
          }

          // Create payment record if it doesn't exist
          let payment = await Payment.findOne({
            $or: [{ paymentId: subId }, { razorpaySubscriptionId: subId }]
          });
          if (!payment) {
            payment = await Payment.create({
              userId: req.user._id,
              businessId: businessId,
              subscriptionId: pendingSub._id,
              orderId: subId,
              paymentId: `pay_sync_${Math.random().toString(36).substr(2, 9)}`,
              razorpayOrderId: undefined,
              razorpaySubscriptionId: subId,
              razorpayPaymentId: undefined,
              amount: pendingSub.amount,
              paymentMethod: 'UPI',
              status: 'Paid',
              paymentStatus: 'Paid',
              paymentDate: new Date(),
              paidAt: new Date(),
            });
          }

          return res.json({
            success: true,
            status: 'active',
            message: 'Subscription successfully synced and activated!',
            business,
            subscription: pendingSub,
            payment
          });
        }
      } catch (rzpErr) {
        console.error(`[PAYMENT SYNC] Razorpay fetch failed for sub ${subId}:`, rzpErr.message);
      }
    }

    if (eventId) {
      const event = await Event.findById(eventId);
      if (!event) {
        return res.status(404).json({ success: false, message: 'Event not found' });
      }

      const orderId = event.orderId || event.razorpayOrderId;
      if (!orderId || orderId.startsWith('order_mock_') || !razorpay) {
        return res.json({ success: false, message: 'No active gateway order to sync' });
      }

      try {
        const rzpOrder = await razorpay.orders.fetch(orderId);
        console.log(`[PAYMENT SYNC] Razorpay order status for ${orderId}: ${rzpOrder.status}`);

        if (rzpOrder.status === 'paid') {
          // Update event paymentStatus
          event.paymentStatus = 'Paid';
          await event.save();

          // Create payment record if it doesn't exist
          let payment = await Payment.findOne({
            $or: [{ orderId: orderId }, { razorpayOrderId: orderId }]
          });
          if (!payment) {
            payment = await Payment.create({
              userId: req.user._id,
              eventId: event._id,
              orderId: orderId,
              paymentId: `pay_sync_${Math.random().toString(36).substr(2, 9)}`,
              razorpayOrderId: orderId,
              razorpayPaymentId: undefined,
              amount: 99,
              paymentMethod: 'UPI',
              status: 'Paid',
              paymentStatus: 'Paid',
              paymentDate: new Date(),
              paidAt: new Date(),
            });
          }

          return res.json({
            success: true,
            status: 'Paid',
            message: 'Event payment successfully synced and activated!',
            event,
            payment
          });
        }
      } catch (rzpErr) {
        console.error(`[PAYMENT SYNC] Razorpay fetch failed for order ${orderId}:`, rzpErr.message);
      }
    }

    return res.json({ success: false, message: 'Payment status not updated on Razorpay yet' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});
// @desc    Verify Razorpay Signature & Activate Subscription
// @route   POST /api/payments/verify-payment
// @access  Private
router.post('/verify-payment', protect, async (req, res) => {
  try {
    const {
      businessId,
      planType,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      razorpaySubscriptionId, // Added support for subscription validation
      applyReferralPoints,
      redeemPointsAmount,
    } = req.body;

    if (!businessId || !planType || (!razorpayOrderId && !razorpaySubscriptionId)) {
      return res.status(400).json({ success: false, message: 'Missing payment parameters' });
    }

    // Fetch Business first so we can check if it belongs to Public Sector
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    // Idempotency: Check if this payment has already been verified and processed
    if (razorpayPaymentId) {
      const existingPayment = await Payment.findOne({
        $or: [
          { paymentId: razorpayPaymentId },
          { razorpayPaymentId: razorpayPaymentId }
        ]
      });
      if (existingPayment) {
        const subscription = await Subscription.findOne({
          $or: [
            { razorpayOrderId: razorpayOrderId || undefined },
            { razorpaySubscriptionId: razorpaySubscriptionId || undefined },
            { _id: existingPayment.subscriptionId || undefined }
          ].filter(Boolean)
        });
        if (subscription && subscription.status === 'active') {
          console.log(`Payment ${razorpayPaymentId} already verified and subscription is active.`);
          return res.json({
            success: true,
            message: 'Subscription successfully activated (already processed)!',
            business,
            subscription,
            payment: existingPayment
          });
        }
      }
    }

    // Idempotency: Check if subscription has already been created and is active
    let existingSub = null;
    if (razorpaySubscriptionId) {
      existingSub = await Subscription.findOne({ razorpaySubscriptionId });
    } else if (razorpayOrderId) {
      existingSub = await Subscription.findOne({ razorpayOrderId });
    }

    if (existingSub && existingSub.status === 'active') {
      console.log(`Subscription is already active.`);
      const existingPay = await Payment.findOne({ subscriptionId: existingSub._id });
      return res.json({
        success: true,
        message: 'Subscription successfully activated (already processed)!',
        business,
        subscription: existingSub,
        payment: existingPay
      });
    }

    const isPublicSector = (business.requestedParentCategory === 'Public Sector' || business.category === 'Public Sector');

    // Verify Payment Signature
    let isSignatureValid = false;
    const isAdminUser = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');
    
    // Support bypassing signature check in sandbox mode, for admins, or for free Public Sector listings
    const isBypass = (
      (razorpayOrderId && (razorpayOrderId.startsWith('order_mock_') || razorpayOrderId === 'free_listing' || razorpayOrderId === 'public_sector_free' || razorpayOrderId.startsWith('free_admin_'))) ||
      (razorpaySubscriptionId && razorpaySubscriptionId.startsWith('sub_mock_')) ||
      isAdminUser || 
      isPublicSector
    );

    if (isBypass) {
      console.log('Sandbox/Mock/Admin Subscription/Payment Bypass verified.');
      isSignatureValid = true;
    } else {
      const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_mockSecret12345';
      let generatedSignature = '';
      if (razorpaySubscriptionId) {
        // subscription validation is paymentId + '|' + subscriptionId
        generatedSignature = crypto
          .createHmac('sha256', keySecret)
          .update(`${razorpayPaymentId}|${razorpaySubscriptionId}`)
          .digest('hex');
      } else {
        // order validation is orderId + '|' + paymentId
        generatedSignature = crypto
          .createHmac('sha256', keySecret)
          .update(`${razorpayOrderId}|${razorpayPaymentId}`)
          .digest('hex');
      }

      isSignatureValid = generatedSignature === razorpaySignature;
    }

    if (!isSignatureValid) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Calculate dates
    let startDate = new Date();
    let subStatus = 'active';

    const currentActive = await Subscription.findOne({
      businessId: business._id,
      status: 'active',
      endDate: { $gt: new Date() }
    });

    if (currentActive) {
      startDate = new Date(currentActive.endDate);
      subStatus = 'queued';

      // Cancel the old active subscription at cycle end to prevent auto-renew double charge
      if (razorpay && currentActive.razorpaySubscriptionId && !currentActive.razorpaySubscriptionId.startsWith('sub_mock_')) {
        try {
          await razorpay.subscriptions.cancel(currentActive.razorpaySubscriptionId, {
            cancel_at_cycle_end: true
          });
          console.log(`[SUBSCRIPTION CANCEL] Cancelled auto-renew of old subscription ${currentActive.razorpaySubscriptionId} on Razorpay at cycle end.`);
        } catch (rzpErr) {
          console.error(`[SUBSCRIPTION CANCEL] Razorpay cancellation failed for old subscription ${currentActive.razorpaySubscriptionId}:`, rzpErr.message);
        }
      }
      currentActive.autoRenew = false;
      await currentActive.save();
    }

    const dbPlan = await Plan.findOne({
      $or: [
        { type: planType },
        { name: planType }
      ],
      isActive: true
    });

    let durationDays = dbPlan ? dbPlan.durationDays : (planType === 'Monthly' ? 28 : 365);
    if (isPublicSector) {
      durationDays = 3650; // 10 years free subscription
    }
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

    let baseAmount = isAdminUser ? 0 : (dbPlan ? dbPlan.price : (planType === 'Monthly' ? 116.82 : 1178.82));
    if (isPublicSector) {
      baseAmount = 0;
    }
    
    // Business Rule #2: Max 10% deduction of plan value
    const maxDiscountRupees = Math.round(baseAmount * 0.1);
    const maxPointsAllowed = maxDiscountRupees; // 1 point = 1 Rupee

    let discountAmountRupees = 0;
    let pointsUsed = 0;

    const user = await User.findById(req.user._id);

    const finalAmount = baseAmount - discountAmountRupees;

    // Create or Update Subscription
    let subscription = existingSub;
    if (subscription) {
      subscription.status = subStatus;
      subscription.razorpayPaymentId = razorpayPaymentId || 'pay_mock_' + Math.random().toString(36).substr(2, 9);
      subscription.startDate = startDate;
      subscription.endDate = endDate;
      subscription.expiryDate = endDate;
      subscription.amount = finalAmount;
      subscription.amountPaid = finalAmount;
      subscription.referralDiscount = discountAmountRupees;
      subscription.autoRenew = !!razorpaySubscriptionId;
      await subscription.save();
    } else {
      subscription = await Subscription.create({
        userId: req.user._id,
        ownerId: req.user._id,
        businessId: business._id,
        plan: planType,
        planName: planType,
        amount: finalAmount,
        amountPaid: finalAmount,
        referralDiscount: discountAmountRupees,
        status: subStatus,
        razorpayOrderId: razorpayOrderId || undefined,
        razorpaySubscriptionId: razorpaySubscriptionId || undefined,
        razorpayPaymentId: razorpayPaymentId || 'pay_mock_' + Math.random().toString(36).substr(2, 9),
        startDate,
        endDate,
        expiryDate: endDate,
        autoRenew: !!razorpaySubscriptionId,
      });
    }

    // Create Payment record
    const payment = await Payment.create({
      userId: req.user._id,
      businessId: business._id,
      subscriptionId: subscription._id,
      orderId: razorpayOrderId || razorpaySubscriptionId,
      paymentId: subscription.razorpayPaymentId,
      razorpayOrderId: razorpayOrderId || undefined,
      razorpaySubscriptionId: razorpaySubscriptionId || undefined,
      razorpayPaymentId: subscription.razorpayPaymentId,
      amount: finalAmount,
      paymentMethod: 'UPI',
      status: 'Paid',
      paymentStatus: 'Paid',
      paymentDate: new Date(),
      paidAt: new Date(),
    });

    // Update Business status immediately
    business.subscriptionStatus = 'active';
    business.subscriptionExpiry = endDate;
    business.isPremium = true; // Premium features enabled upon payment
    await business.save();

    // Trigger referral point award check for the owner of the referral code
    const { checkAndCompleteReferralByBusiness } = require('../utils/referralHelper');
    await checkAndCompleteReferralByBusiness(business._id);

    // Append to Google Sheets Income Tracker
    try {
      const { appendToIncomeTracker } = require('../services/sheetsService');
      await appendToIncomeTracker({
        businessId: business._id,
        businessName: business.name,
        monthlyPaid: (planType.toLowerCase().includes('monthly') && !isPublicSector && !isAdminUser) ? finalAmount : 0,
        yearlyPaid: (planType.toLowerCase().includes('yearly') && !isPublicSector && !isAdminUser) ? finalAmount : 0,
        eventPaid: 0,
        addPaid: 0,
        sheetName: 'Income Tracker New'
      });
    } catch (sheetErr) {
      console.error('[Google Sheets API] Error triggering sheets update:', sheetErr.message);
    }

    res.json({
      success: true,
      message: 'Subscription successfully activated!',
      business,
      subscription,
      payment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create Razorpay Order for an Event listing
// @route   POST /api/payments/create-event-order
// @access  Private
router.post('/create-event-order', protect, async (req, res) => {
  try {
    const { eventId } = req.body;

    if (!eventId) {
      return res.status(400).json({ success: false, message: 'Event ID is required' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Double check subscription
    const activeBusiness = await Business.findOne({ 
      ownerId: req.user._id,
      subscriptionStatus: 'active' 
    });
    
    const isAdminUser = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');
    
    // Waived to 0 if business subscriber exists or user is admin, standard fee is ₹116.82 otherwise
    const amount = (activeBusiness || isAdminUser) ? 0 : 11682; // in paise (₹116.82)

    if (amount === 0) {
      return res.json({
        success: true,
        orderId: 'free_listing',
        amount: 0,
        currency: 'INR',
      });
    }

    const options = {
      amount: amount,
      currency: 'INR',
      receipt: `rcpt_evt_${eventId.toString().slice(-12)}_${Date.now()}`,
    };

    let order;
    try {
      order = await razorpay.orders.create(options);
    } catch (err) {
      console.error('Razorpay SDK Event Order Creation Failed. Error Details:', err);
      console.warn('Falling back to mock order.');
      order = {
        id: 'order_mock_' + Math.random().toString(36).substr(2, 9),
        amount: amount,
        currency: 'INR',
        receipt: options.receipt,
        status: 'created',
      };
    }

    // Save orderId to Event document for webhook tracking and recovery syncs
    event.orderId = order.id;
    event.razorpayOrderId = order.id;
    await event.save();

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockKeyId12345',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Verify Razorpay Signature & Mark Event listing as Paid
// @route   POST /api/payments/verify-event-payment
// @access  Private
router.post('/verify-event-payment', protect, async (req, res) => {
  try {
    const {
      eventId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    } = req.body;

    if (!eventId || !razorpayOrderId) {
      return res.status(400).json({ success: false, message: 'Missing payment parameters' });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Idempotency: Check if payment already exists for this event
    if (razorpayPaymentId) {
      const existingPayment = await Payment.findOne({
        $or: [
          { paymentId: razorpayPaymentId },
          { razorpayPaymentId: razorpayPaymentId }
        ]
      });
      if (existingPayment) {
        console.log(`Event payment ${razorpayPaymentId} already processed.`);
        return res.json({
          success: true,
          message: 'Event payment successfully verified (already processed)!',
          event,
          payment: existingPayment,
        });
      }
    }

    // Verify signature
    let isSignatureValid = false;
    const isAdminUser = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');
    if (razorpayOrderId.startsWith('order_mock_') || razorpayOrderId === 'free_listing' || isAdminUser) {
      console.log('Event Sandbox/Mock/Admin Payment Bypass verified.');
      isSignatureValid = true;
    } else {
      const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_mockSecret12345';
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      isSignatureValid = generatedSignature === razorpaySignature;
    }

    if (!isSignatureValid) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Update event paymentStatus
    const activeBusiness = await Business.findOne({ 
      ownerId: req.user._id,
      subscriptionStatus: 'active' 
    });
    event.paymentStatus = (activeBusiness || isAdminUser) ? 'Free' : 'Paid';
    await event.save();

    // Create Payment record if not free
    let payment = null;
    if (!activeBusiness && !isAdminUser) {
      payment = await Payment.create({
        userId: req.user._id,
        eventId: event._id,
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId || 'pay_mock_' + Math.random().toString(36).substr(2, 9),
        razorpayOrderId: razorpayOrderId,
        razorpayPaymentId: razorpayPaymentId || 'pay_mock_' + Math.random().toString(36).substr(2, 9),
        amount: 116.82,
        paymentMethod: 'UPI',
        status: 'Paid',
        paymentStatus: 'Paid',
        paymentDate: new Date(),
        paidAt: new Date(),
      });
    }

    // Append to Google Sheets Income Tracker
    try {
      let bizName = event.organizer || 'Unknown Business';
      if (event.businessId) {
        const bObj = await Business.findById(event.businessId);
        if (bObj) {
          bizName = bObj.name;
        }
      }
      const { appendToIncomeTracker } = require('../services/sheetsService');
      await appendToIncomeTracker({
        businessId: event.businessId,
        businessName: bizName,
        monthlyPaid: 0,
        yearlyPaid: 0,
        eventPaid: event.paymentStatus === 'Free' ? 0 : 116.82,
        addPaid: 0,
        sheetName: 'Income Tracker New'
      });
    } catch (sheetErr) {
      console.error('[Google Sheets API] Error triggering sheets update for event:', sheetErr.message);
    }

    res.json({
      success: true,
      message: 'Event payment successfully verified!',
      event,
      payment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get current user's payment history
// @route   GET /api/payments/my-history
// @access  Private
router.get('/my-history', protect, async (req, res) => {
  try {
    const payments = await Payment.find({ userId: req.user._id })
      .populate('subscriptionId')
      .populate('eventId')
      .populate('businessId')
      .sort({ createdAt: -1 });

    const mapped = payments.map(p => {
      const obj = p.toObject();
      return {
        ...obj,
        isEvent: !!p.eventId || !!p.populated('eventId'),
        isSponsoredAd: p.isSponsoredAd || p.planType === 'Sponsored Ad Promotion'
      };
    });

    res.json({ success: true, count: mapped.length, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all payments for admin monitoring
// @route   GET /api/payments/admin/all
// @access  Private/Admin
router.get('/admin/all', protect, admin, async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate('userId', 'name fullName email phone mobileNumber')
      .populate('businessId', 'name businessName')
      .populate('eventId', 'title')
      .populate('subscriptionId', 'plan planName')
      .sort({ createdAt: -1 });

    const mapped = payments.map(p => {
      const obj = p.toObject();
      return {
        ...obj,
        isEvent: !!p.eventId || !!p.populated('eventId'),
        isSponsoredAd: p.isSponsoredAd || p.planType === 'Sponsored Ad Promotion'
      };
    });

    res.json({ success: true, count: mapped.length, data: mapped });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Razorpay Webhook Handler
// @route   POST /api/payments/webhook
// @access  Public
router.post('/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || 'rzp_test_mockWebhookSecret12345';
    let isWebhookValid = false;

    // Validate signature
    try {
      const rawPayload = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);
      const generatedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawPayload)
        .digest('hex');

      if (signature === generatedSignature) {
        isWebhookValid = true;
      } else {
        try {
          Razorpay.validateWebhookSignature(
            rawPayload,
            signature,
            webhookSecret
          );
          isWebhookValid = true;
        } catch (e) {
          if (process.env.NODE_ENV !== 'production' && (!signature || signature === 'mock')) {
            console.log('Bypassing webhook signature validation in development environment.');
            isWebhookValid = true;
          }
        }
      }
    } catch (err) {
      console.error('Webhook signature verification check failed:', err);
    }

    if (!isWebhookValid) {
      return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
    }

    const { event: eventType, payload } = req.body;
    if (!payload) {
      return res.json({ success: true, message: 'Webhook payload missing' });
    }

    console.log(`[Webhook details] Event: ${eventType}`);

    if (eventType === 'subscription.charged') {
      const subscriptionEntity = payload.subscription?.entity;
      const paymentEntity = payload.payment?.entity;
      
      if (!subscriptionEntity || !paymentEntity) {
        return res.json({ success: true, message: 'Subscription charged event missing detail entities' });
      }

      const subId = subscriptionEntity.id;
      const paymentId = paymentEntity.id;
      const amount = paymentEntity.amount / 100;

      let localSub = await Subscription.findOne({
        $or: [
          { razorpaySubscriptionId: subId },
          { razorpayOrderId: subId }
        ]
      });

      // Calculate extended expiry dates
      const durationDays = subscriptionEntity.notes?.planType === 'Yearly' ? 365 : 30;
      const currentEndSeconds = subscriptionEntity.current_end;
      const expiryDate = currentEndSeconds ? new Date(currentEndSeconds * 1000) : new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

      if (localSub) {
        localSub.status = 'active';
        localSub.razorpayPaymentId = paymentId;
        localSub.endDate = expiryDate;
        localSub.expiryDate = expiryDate;
        await localSub.save();

        const business = await Business.findById(localSub.businessId);
        if (business) {
          business.subscriptionStatus = 'active';
          business.subscriptionExpiry = expiryDate;
          business.isPremium = true;
          await business.save();
        }

        // Prevent duplicate payment records for webhook retries
        const existingPayment = await Payment.findOne({
          $or: [
            { paymentId: paymentId },
            { razorpayPaymentId: paymentId }
          ]
        });
        if (!existingPayment) {
          // Check if this is a renewal or the initial payment
          const previousPaymentsCount = await Payment.countDocuments({
            razorpaySubscriptionId: subId,
            status: 'Paid'
          });
          const targetSheetName = previousPaymentsCount > 0 ? 'Autopay' : 'Income Tracker New';

          // Add to Payment history
          await Payment.create({
            userId: localSub.userId || localSub.ownerId,
            businessId: localSub.businessId,
            subscriptionId: localSub._id,
            orderId: subId,
            paymentId: paymentId,
            razorpayOrderId: undefined,
            razorpaySubscriptionId: subId,
            razorpayPaymentId: paymentId,
            amount: amount,
            paymentMethod: paymentEntity.method || 'UPI',
            status: 'Paid',
            paymentStatus: 'Paid',
            paymentDate: new Date(),
            paidAt: new Date(),
          });

          // Append to Google Sheets Income Tracker
          try {
            const { appendToIncomeTracker } = require('../services/sheetsService');
            const planNameStr = (localSub.planName || localSub.plan || '').toLowerCase();
            await appendToIncomeTracker({
              businessId: localSub.businessId,
              businessName: business ? business.name : 'Unknown Business',
              monthlyPaid: (planNameStr.includes('monthly') || amount === 99 || amount === 116.82) ? amount : 0,
              yearlyPaid: (planNameStr.includes('yearly') || amount === 999 || amount === 1178.82) ? amount : 0,
              eventPaid: 0,
              addPaid: 0,
              sheetName: targetSheetName
            });
          } catch (sheetErr) {
            console.error('[Webhook Sheets Update] Error appending subscription.charged to sheets:', sheetErr.message);
          }
        } else {
          console.log(`Payment ${paymentId} already recorded in subscription.charged.`);
        }
      }
    } else if (eventType === 'subscription.cancelled' || eventType === 'subscription.halted') {
      const subscriptionEntity = payload.subscription?.entity;
      if (subscriptionEntity) {
        const subId = subscriptionEntity.id;
        const localSub = await Subscription.findOne({
          $or: [
            { razorpaySubscriptionId: subId },
            { razorpayOrderId: subId }
          ]
        });

        if (localSub) {
          const now = new Date();
          if (localSub.endDate && new Date(localSub.endDate) <= now) {
            localSub.status = 'expired';
          }
          localSub.autoRenew = false;
          await localSub.save();

          const business = await Business.findById(localSub.businessId);
          if (business) {
            const now = new Date();
            // Only mark business as expired immediately if the expiry date has passed (or is not set)
            if (!business.subscriptionExpiry || new Date(business.subscriptionExpiry) <= now) {
              business.subscriptionStatus = 'expired';
              business.isPremium = false;
              await business.save();
              console.log(`[Webhook Cancel/Halt] Expired business ${business.name} immediately.`);
            } else {
              console.log(`[Webhook Cancel/Halt] Kept business ${business.name} active since expiry ${business.subscriptionExpiry} is in the future.`);
            }
          }
        }
      }
    } else if (eventType === 'payment.captured') {
      if (!payload.payment) {
        return res.json({ success: true, message: 'Webhook payment capture entity missing' });
      }

      const paymentEntity = payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;
      const amount = paymentEntity.amount / 100; // Rupee conversion

      let payment = await Payment.findOne({
        $or: [
          { paymentId: paymentId },
          { razorpayPaymentId: paymentId }
        ]
      });
      if (!payment && orderId) {
        payment = await Payment.findOne({ razorpayOrderId: orderId });
      }

      const subscription = await Subscription.findOne({
        $or: [
          { razorpayOrderId: orderId || undefined },
          { razorpaySubscriptionId: orderId || undefined }
        ].filter(Boolean)
      });
      let eventRecord = null;
      if (!subscription && orderId) {
        eventRecord = await Event.findOne({
          $or: [
            { razorpayOrderId: orderId },
            { orderId: orderId }
          ]
        });
      }

      // Check if this is a sponsored ad payment
      let isSponsoredAdPayment = false;
      let adBusiness = null;
      let adPromotionId = null;
      const notes = paymentEntity.notes || {};
      if (!subscription && !eventRecord && notes.promotionId && notes.businessId) {
        isSponsoredAdPayment = true;
        adPromotionId = notes.promotionId;
        adBusiness = await Business.findById(notes.businessId);
      }

      let needsSheetAppend = false;
      if (!payment) {
        needsSheetAppend = true;
        const userId = subscription 
          ? (subscription.userId || subscription.ownerId) 
          : (eventRecord 
              ? eventRecord.ownerId 
              : (adBusiness ? adBusiness.ownerId : null));
        if (userId) {
          payment = await Payment.create({
            userId,
            businessId: subscription ? subscription.businessId : (adBusiness ? adBusiness._id : undefined),
            subscriptionId: subscription ? subscription._id : undefined,
            eventId: eventRecord ? eventRecord._id : undefined,
            orderId: orderId,
            paymentId: paymentId,
            razorpayOrderId: orderId,
            razorpayPaymentId: paymentId,
            amount: amount,
            paymentMethod: paymentEntity.method || 'UPI',
            status: 'Paid',
            paymentStatus: 'Paid',
            planType: isSponsoredAdPayment ? 'Sponsored Ad Promotion' : undefined,
            isSponsoredAd: isSponsoredAdPayment ? true : undefined,
            promotionId: isSponsoredAdPayment ? adPromotionId : undefined,
            paymentDate: new Date(),
            paidAt: new Date(),
          });
        }
      } else {
        if (payment.status !== 'Paid' && payment.paymentStatus !== 'Paid') {
          needsSheetAppend = true;
        }
        payment.status = 'Paid';
        payment.paymentStatus = 'Paid';
        payment.paymentId = paymentId;
        payment.razorpayPaymentId = paymentId;
        payment.paymentMethod = paymentEntity.method || payment.paymentMethod;
        if (isSponsoredAdPayment) {
          payment.isSponsoredAd = true;
          payment.planType = 'Sponsored Ad Promotion';
          payment.promotionId = adPromotionId;
          payment.businessId = adBusiness._id;
        }
        payment.paidAt = new Date();
        payment.paymentDate = new Date();
        await payment.save();
      }

      if (needsSheetAppend) {
        // Append to Google Sheets Income Tracker
        try {
          const { appendToIncomeTracker } = require('../services/sheetsService');
          if (subscription) {
            const business = await Business.findById(subscription.businessId);
            if (business) {
              const planNameStr = (subscription.planName || subscription.plan || '').toLowerCase();
              await appendToIncomeTracker({
                businessId: subscription.businessId,
                businessName: business.name,
                monthlyPaid: (planNameStr.includes('monthly') || amount === 99 || amount === 116.82) ? amount : 0,
                yearlyPaid: (planNameStr.includes('yearly') || amount === 999 || amount === 1178.82) ? amount : 0,
                eventPaid: 0,
                addPaid: 0,
                sheetName: 'Income Tracker New'
              });
            }
          } else if (eventRecord) {
            let bizName = eventRecord.organizer || 'Unknown Business';
            if (eventRecord.businessId) {
              const bObj = await Business.findById(eventRecord.businessId);
              if (bObj) {
                bizName = bObj.name;
              }
            }
            await appendToIncomeTracker({
              businessId: eventRecord.businessId,
              businessName: bizName,
              monthlyPaid: 0,
              yearlyPaid: 0,
              eventPaid: amount,
              addPaid: 0,
              sheetName: 'Income Tracker New'
            });
          } else if (isSponsoredAdPayment && adBusiness) {
            await appendToIncomeTracker({
              businessId: adBusiness._id,
              businessName: adBusiness.name,
              monthlyPaid: 0,
              yearlyPaid: 0,
              eventPaid: 0,
              addPaid: amount,
              sheetName: 'Income Tracker New'
            });
          }
        } catch (sheetErr) {
          console.error('[Webhook Sheets Update] Error appending payment.captured to sheets:', sheetErr.message);
        }
      }

      if (subscription && subscription.status !== 'active') {
        subscription.status = 'active';
        subscription.razorpayPaymentId = paymentId;
        subscription.startDate = subscription.startDate || new Date();
        
        if (!subscription.endDate || !subscription.expiryDate) {
          const dbPlan = await Plan.findOne({ name: subscription.planName });
          const durationDays = dbPlan ? dbPlan.durationDays : (subscription.plan === 'Monthly' ? 28 : 365);
          const endDate = new Date();
          endDate.setDate(subscription.startDate.getDate() + durationDays);
          subscription.endDate = endDate;
          subscription.expiryDate = endDate;
        }
        await subscription.save();

        const business = await Business.findById(subscription.businessId);
        if (business) {
          business.subscriptionStatus = 'active';
          business.subscriptionExpiry = subscription.endDate;
          business.isPremium = true;
          await business.save();
        }
      }

      if (eventRecord) {
        eventRecord.paymentStatus = 'Paid';
        await eventRecord.save();
      }

      if (isSponsoredAdPayment && adBusiness) {
        const promo = adBusiness.promotions.find(p => p._id.toString() === adPromotionId || p.id === adPromotionId);
        if (promo) {
          promo.sponsoredStatus = 'pending';
          promo.isSponsored = false;
          await adBusiness.save();
        }
      }
    } else if (eventType === 'payment.failed') {
      if (!payload.payment) {
        return res.json({ success: true, message: 'Webhook payment failure entity missing' });
      }

      const paymentEntity = payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;
      const amount = paymentEntity.amount / 100; // Rupee conversion

      let payment = await Payment.findOne({
        $or: [
          { paymentId: paymentId },
          { razorpayPaymentId: paymentId }
        ]
      });
      if (!payment && orderId) {
        payment = await Payment.findOne({ razorpayOrderId: orderId });
      }

      const subscription = await Subscription.findOne({
        $or: [
          { razorpayOrderId: orderId || undefined },
          { razorpaySubscriptionId: orderId || undefined }
        ].filter(Boolean)
      });
      let eventRecord = null;
      if (!subscription && orderId) {
        eventRecord = await Event.findOne({
          $or: [
            { razorpayOrderId: orderId },
            { orderId: orderId }
          ]
        });
      }

      if (!payment) {
        const userId = subscription ? (subscription.userId || subscription.ownerId) : (eventRecord ? eventRecord.ownerId : null);
        if (userId) {
          payment = await Payment.create({
            userId,
            businessId: subscription ? subscription.businessId : undefined,
            subscriptionId: subscription ? subscription._id : undefined,
            eventId: eventRecord ? eventRecord._id : undefined,
            orderId: orderId,
            paymentId: paymentId,
            razorpayOrderId: orderId,
            razorpayPaymentId: paymentId,
            amount: amount,
            paymentMethod: paymentEntity.method || 'UPI',
            status: 'Failed',
            paymentStatus: 'Failed',
            paymentDate: new Date(),
          });
        }
      } else {
        payment.status = 'Failed';
        payment.paymentStatus = 'Failed';
        payment.paymentId = paymentId;
        payment.razorpayPaymentId = paymentId;
        await payment.save();
      }

      if (subscription) {
        subscription.status = 'pending';
        await subscription.save();
      }
    } else if (eventType === 'payment.refunded') {
      if (!payload.payment) {
        return res.json({ success: true, message: 'Webhook payment refund entity missing' });
      }

      const paymentEntity = payload.payment.entity;
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;

      let payment = await Payment.findOne({
        $or: [
          { paymentId: paymentId },
          { razorpayPaymentId: paymentId }
        ]
      });

      if (payment) {
        payment.status = 'Refunded';
        payment.paymentStatus = 'Refunded';
        await payment.save();

        if (payment.subscriptionId) {
          const subscription = await Subscription.findById(payment.subscriptionId);
          if (subscription) {
            subscription.status = 'refunded';
            await subscription.save();

            const business = await Business.findById(subscription.businessId);
            if (business) {
              business.subscriptionStatus = 'expired';
              business.isPremium = false;
              await business.save();
            }
          }
        }

        if (payment.eventId) {
          const eventRecord = await Event.findById(payment.eventId);
          if (eventRecord) {
            eventRecord.paymentStatus = 'Refunded';
            await eventRecord.save();
          }
        }
      }
    }

    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create Razorpay Order for Sponsored Ad (₹99)
// @route   POST /api/payments/create-sponsored-ad-order
// @access  Private
router.post('/create-sponsored-ad-order', protect, async (req, res) => {
  try {
    const { businessId, promotionId } = req.body;

    if (!businessId || !promotionId) {
      return res.status(400).json({ success: false, message: 'Business ID and Promotion ID are required' });
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    const promotion = business.promotions.find(p => p.id === promotionId || p.get('id') === promotionId || p._id.toString() === promotionId);
    if (!promotion) {
      return res.status(404).json({ success: false, message: 'Promotion not found' });
    }

    let isMock = false;
    if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'rzp_test_mockKeyId12345' || !razorpay) {
      isMock = true;
    }

    const finalAmount = 11682; // ₹116.82 in paise (11682 paise)

    let order;
    if (!isMock) {
      try {
        order = await razorpay.orders.create({
          amount: finalAmount,
          currency: 'INR',
          receipt: `rcpt_ad_${businessId.toString().slice(-6)}_${promotionId.slice(-6)}_${Date.now()}`,
          notes: {
            businessId: businessId.toString(),
            promotionId: promotionId
          }
        });
      } catch (err) {
        console.error('Razorpay SDK Order creation failed for Ad. Error details:', err.message);
        isMock = true;
      }
    }

    if (isMock) {
      order = {
        id: 'order_mock_' + Math.random().toString(36).substr(2, 9),
        status: 'created'
      };
    }

    res.json({
      success: true,
      orderId: order.id,
      amount: finalAmount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mockKeyId12345'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Verify Razorpay Signature & Submit Sponsored Ad for Approval
// @route   POST /api/payments/verify-sponsored-ad-payment
// @access  Private
router.post('/verify-sponsored-ad-payment', protect, async (req, res) => {
  try {
    const {
      businessId,
      promotionId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature
    } = req.body;

    if (!businessId || !promotionId || !razorpayOrderId) {
      return res.status(400).json({ success: false, message: 'Missing parameters' });
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    const promotion = business.promotions.find(p => p.id === promotionId || p.get('id') === promotionId || p._id.toString() === promotionId);
    if (!promotion) {
      return res.status(404).json({ success: false, message: 'Promotion not found' });
    }

    // Verify Payment Signature
    let isSignatureValid = false;
    const isBypass = (razorpayOrderId && razorpayOrderId.startsWith('order_mock_'));

    if (isBypass) {
      console.log('Sandbox/Mock Ad Payment Signature Bypass verified.');
      isSignatureValid = true;
    } else {
      const keySecret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_mockSecret12345';
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(`${razorpayOrderId}|${razorpayPaymentId}`)
        .digest('hex');

      isSignatureValid = generatedSignature === razorpaySignature;
    }

    if (!isSignatureValid) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Update the promotion sponsorship status
    promotion.sponsoredStatus = 'pending';
    promotion.isSponsored = false; // Must await admin approval
    
    // Save the business document
    await business.save();

    try {
      await Payment.create({
        userId: req.user._id,
        businessId: business._id,
        paymentId: razorpayPaymentId || `pay_mock_ad_${Math.random().toString(36).substr(2, 9)}`,
        orderId: razorpayOrderId,
        amount: 116.82,
        status: 'Paid',
        paymentStatus: 'Paid',
        planType: 'Sponsored Ad Promotion',
        isSponsoredAd: true,
        promotionId: promotionId,
        paymentDate: new Date(),
        paidAt: new Date()
      });

      // Append to Google Sheets Income Tracker (Ad / Add-on = 116.82)
      const { appendToIncomeTracker } = require('../services/sheetsService');
      await appendToIncomeTracker({
        businessId: business._id,
        businessName: business.name,
        monthlyPaid: 0,
        yearlyPaid: 0,
        eventPaid: 0,
        addPaid: 116.82,
        sheetName: 'Income Tracker New'
      });
    } catch (payErr) {
      console.error('Error logging payment details for sponsored ad:', payErr.message);
    }

    res.json({
      success: true,
      message: 'Ad payment verified! Promotion submitted for admin moderation.',
      business
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
