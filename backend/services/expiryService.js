const Business = require('../models/Business');
const Notification = require('../models/Notification');

const checkSubscriptionExpiries = async () => {
  const mongoose = require('mongoose');
  if (mongoose.connection.readyState !== 1) {
    console.log('Skipping expiry checks (No active database connection)');
    return;
  }
  try {
    console.log('--- Background subscription check worker started ---');
    const now = new Date();
    
    // Find all businesses with non-null expiry date
    const businesses = await Business.find({
      subscriptionExpiry: { $exists: true, $ne: null },
    });

    console.log(`Auditing ${businesses.length} businesses for subscription status...`);

    let expiriesUpdated = 0;
    let warningsSent = 0;

    for (let business of businesses) {
      const expiryTime = new Date(business.subscriptionExpiry).getTime();
      const nowTime = now.getTime();
      const diffMs = expiryTime - nowTime;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);

      if (diffDays <= 0) {
        // Business has EXPIRED
        if (business.subscriptionStatus !== 'expired') {
          business.subscriptionStatus = 'expired';
          await business.save();
          expiriesUpdated++;

          // Send warning notification
          await Notification.create({
            userId: business.ownerId,
            businessId: business._id,
            message: `Subscription expired for "${business.name}". Renew to restore profile visibility.`,
            type: 'expired',
          });

          console.log(`[EXPIRED] Business "${business.name}" has been marked as expired.`);
        }
      } else if (diffDays <= 5) {
        // Business is nearing expiry (<= 5 days)
        // Check if we already sent a warning in the last 24 hours to prevent spamming
        const existingWarning = await Notification.findOne({
          userId: business.ownerId,
          businessId: business._id,
          type: 'expiry_warning',
          createdAt: { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }, // in last 24h
        });

        if (!existingWarning) {
          warningsSent++;
          const daysLeft = Math.ceil(diffDays);
          
          await Notification.create({
            userId: business.ownerId,
            businessId: business._id,
            message: `Your subscription for "${business.name}" expires in ${daysLeft} days. Renew to maintain ranking!`,
            type: 'expiry_warning',
          });

          console.log(`[WARNING] Expiry warning sent to "${business.name}". ${daysLeft} days remaining.`);
        }
      }
    }

    console.log(`--- Subscription check complete: ${expiriesUpdated} expired, ${warningsSent} warnings sent ---`);
  } catch (error) {
    console.error('Error running subscription expiry worker:', error.message);
  }
};

// Expose schedule trigger
const startExpiryCheckInterval = () => {
  // Run immediately on server boot
  checkSubscriptionExpiries();

  // Run every 12 hours (43200000 ms)
  setInterval(checkSubscriptionExpiries, 12 * 60 * 60 * 1000);
};

module.exports = {
  checkSubscriptionExpiries,
  startExpiryCheckInterval,
};
