const cron = require('node-cron');
const Business = require('../models/Business');
const Notification = require('../models/Notification');
const { sendEmail } = require('../utils/emailHelper');

/**
 * Automate Business Expiry Telemetry Checks
 * Scheduled to run daily at midnight
 */
const runExpiryAudit = async () => {
  try {
    console.log('--- Background Expiry Cron Service Started ---');
    const now = new Date();

    // 1. Activate queued subscriptions whose start date has arrived
    const Subscription = require('../models/Subscription');
    const queuedSubs = await Subscription.find({
      status: 'queued',
      startDate: { $lte: now }
    });

    for (const sub of queuedSubs) {
      console.log(`[Cron Activation] Activating queued subscription ${sub._id} for business ${sub.businessId}`);
      sub.status = 'active';
      await sub.save();

      // Mark other active plans for this business as expired
      await Subscription.updateMany(
        { businessId: sub.businessId, status: 'active', _id: { $ne: sub._id } },
        { $set: { status: 'expired' } }
      );

      // Update Business model too to reflect new coverage dates
      const business = await Business.findById(sub.businessId);
      if (business) {
        business.subscriptionStatus = 'active';
        business.subscriptionExpiry = sub.endDate;
        business.isPremium = true;
        await business.save();
        console.log(`[Cron Activation] Updated Business "${business.name}" expiry to ${business.subscriptionExpiry}`);
      }
    }

    // Find all businesses with active premium status
    const activePremiumBiz = await Business.find({
      subscriptionStatus: 'active',
      subscriptionExpiry: { $exists: true, $ne: null }
    }).populate('ownerId');

    console.log(`Auditing ${activePremiumBiz.length} active premium business directories for expirations...`);

    let expiredCount = 0;
    let warningCount = 0;

    for (const biz of activePremiumBiz) {
      const expiryDate = new Date(biz.subscriptionExpiry);
      const diffMs = expiryDate.getTime() - now.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays <= 0) {
        // subscription expired: update metadata
        biz.subscriptionStatus = 'expired';
        biz.isPremium = false;
        
        // Expiry features: disable whatsapp visibility & blur profile flag
        biz.whatsapp = ''; // Clear whatsapp contact link
        biz.featured = false; // Turn off featured badges
        
        await biz.save();
        expiredCount++;

        // Send expired notification alert
        await Notification.create({
          userId: biz.ownerId ? (biz.ownerId._id || biz.ownerId) : null,
          businessId: biz._id,
          title: 'Subscription Package Expired',
          message: `Your premium UBT listing "${biz.name}" has expired. WhatsApp links are disabled and your profile is de-boosted. Please renew today to restore.`,
          type: 'expired'
        });

        if (biz.ownerId && biz.ownerId.email) {
          const ownerName = biz.ownerId.fullName || biz.ownerId.name || 'Merchant';
          try {
            await sendEmail({
              to: biz.ownerId.email,
              subject: `UBT Premium Subscription Expired: "${biz.name}"`,
              text: `Hello ${ownerName},\n\nYour premium UBT listing "${biz.name}" has expired. WhatsApp contact buttons have been disabled and your profile has been de-boosted.\n\nPlease log in to your dashboard and renew your subscription today to restore full search placement and contact visibility.\n\nBest regards,\nUBT Billing Desk`
            });
          } catch (err) {
            console.error('[SMTP] Failed to send subscription expired email:', err.message);
          }
        }

        console.log(`[Cron Expired] Business directory listing "${biz.name}" has been marked as expired.`);
      } else if (diffDays <= 5) {
        // Expiry warning within 5 days (Avoid daily spamming by checking last 24 hours warnings)
        const previousWarning = await Notification.findOne({
          userId: biz.ownerId,
          businessId: biz._id,
          type: 'expiry_warning',
          createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
        });

        if (!previousWarning) {
          warningCount++;
          const daysRemaining = Math.ceil(diffDays);

          // Find active subscription for this business to check autoRenew / autopay status
          const activeSub = await Subscription.findOne({
            businessId: biz._id,
            status: 'active'
          }).sort({ endDate: -1 });

          const isAutopayOn = activeSub && activeSub.autoRenew === true;

          // DO NOT disturb members who have Autopay turned ON
          if (!isAutopayOn) {
            warningCount++;

            // Autopay is OFF: Send Urgent Manual Renewal Email & Notification
            await Notification.create({
              userId: biz.ownerId ? (biz.ownerId._id || biz.ownerId) : null,
              businessId: biz._id,
              title: 'UBT Subscription Expiring Soon',
              message: `Your premium UBT subscription for "${biz.name}" will expire in ${daysRemaining} days. Renew today to maintain visibility!`,
              type: 'expiry_warning'
            });

            if (biz.ownerId && biz.ownerId.email) {
              const ownerName = biz.ownerId.fullName || biz.ownerId.name || 'Merchant';
              try {
                await sendEmail({
                  to: biz.ownerId.email,
                  subject: `Renew Today: Your UBT Subscription for "${biz.name}" expires in ${daysRemaining} days`,
                  text: `Hello ${ownerName},\n\nYour premium UBT subscription for "${biz.name}" will expire in ${daysRemaining} days.\n\nSince Autopay is turned off, please log in and renew today to maintain your premium search placement, contact options, and page analytics.\n\nBest regards,\nUBT Billing Desk`
                });
              } catch (err) {
                console.error('[SMTP] Failed to send subscription warning email:', err.message);
              }
            }

            console.log(`[Cron Warning] Dispatched 5-day warning email to "${biz.name}" (Autopay: OFF). ${daysRemaining} days left.`);
          } else {
            console.log(`[Cron Skip] Skipped warning email for "${biz.name}" because Autopay is turned ON.`);
          }

          console.log(`[Cron Warning] dispatched warning notification to "${biz.name}". Autopay: ${isAutopayOn ? 'ON' : 'OFF'}. ${daysRemaining} days left.`);
        }
      }
    }

    console.log(`--- Expiry Cron Completed: ${expiredCount} expired, ${warningCount} warning notifications dispatched ---`);
  } catch (err) {
    console.error('Error running daily subscription expiry cron audit:', err);
  }
};

// Orchestrate Cron trigger pattern (Runs every 6 hours: 00:00, 06:00, 12:00, 18:00)
const startSubscriptionCron = () => {
  // Run immediately on boot to ensure database integrity
  runExpiryAudit();

  cron.schedule('0 */6 * * *', () => {
    runExpiryAudit();
  });
};

module.exports = {
  runExpiryAudit,
  startSubscriptionCron
};
