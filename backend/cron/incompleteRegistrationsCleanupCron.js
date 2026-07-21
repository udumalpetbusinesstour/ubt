const cron = require('node-cron');
const Business = require('../models/Business');
const User = require('../models/User');
const Subscription = require('../models/Subscription');
const Payment = require('../models/Payment');

/**
 * Sweeps and automatically deletes incomplete registrations and their associated user signups
 * if created > 10 days ago without approval and without completed payment.
 */
const cleanupIncompleteRegistrations = async () => {
  try {
    console.log('[Incomplete Registration Cron] Running 10-day stale registration cleanup audit...');

    const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
    const tenDaysAgo = new Date(Date.now() - TEN_DAYS_MS);

    // Find businesses created more than 10 days ago that are NOT Approved AND have NO active payment/subscription
    const staleBusinesses = await Business.find({
      createdAt: { $lt: tenDaysAgo },
      status: { $ne: 'Approved' },
      subscriptionStatus: { $ne: 'active' },
      paymentStatus: { $ne: 'Paid' }
    });

    console.log(`[Incomplete Registration Cron] Found ${staleBusinesses.length} incomplete/unapproved registration(s) older than 10 days.`);

    let deletedBusinessCount = 0;
    let deletedUserCount = 0;

    for (const biz of staleBusinesses) {
      const bizName = biz.name || biz.businessName || biz._id;
      const ownerId = biz.ownerId || biz.userId;

      // Check if there is any successful payment for this business
      const hasPaid = await Payment.findOne({ businessId: biz._id, status: 'Paid' });
      const hasSub = await Subscription.findOne({ businessId: biz._id, status: { $in: ['active', 'Paid'] } });

      if (hasPaid || hasSub) {
        console.log(`[Incomplete Registration Cron Skip] Business "${bizName}" has paid history. Skipping deletion.`);
        continue;
      }

      // Safe to delete business
      await Business.findByIdAndDelete(biz._id);
      deletedBusinessCount++;
      console.log(`[Incomplete Registration Cron Deleted] Business listing "${bizName}" (ID: ${biz._id}) created on ${biz.createdAt}.`);

      // Check user account for cleanup
      if (ownerId) {
        const user = await User.findById(ownerId);
        if (user && user.role !== 'superadmin' && user.role !== 'admin') {
          // Check if user owns any OTHER approved or active businesses
          const otherActiveBiz = await Business.findOne({
            _id: { $ne: biz._id },
            $or: [{ ownerId: user._id }, { userId: user._id }],
            $or: [{ status: 'Approved' }, { subscriptionStatus: 'active' }]
          });

          // Check if user account was also created > 10 days ago
          const userCreatedAgo = user.createdAt ? (Date.now() - new Date(user.createdAt).getTime()) : TEN_DAYS_MS + 1000;

          if (!otherActiveBiz && userCreatedAgo >= TEN_DAYS_MS) {
            await User.findByIdAndDelete(user._id);
            deletedUserCount++;
            console.log(`[Incomplete Registration Cron Deleted User] Signup account "${user.email || user.fullName}" (ID: ${user._id}) deleted.`);
          }
        }
      }
    }

    console.log(`[Incomplete Registration Cron Completed] Cleaned ${deletedBusinessCount} stale listings and ${deletedUserCount} unverified/incomplete user accounts.`);
  } catch (err) {
    console.error('[Incomplete Registration Cron Error]:', err.message);
  }
};

/**
 * Initializes the daily cron job (runs at 3:00 AM every night)
 */
const startIncompleteRegistrationsCleanupCron = () => {
  console.log('[Cron Setup] Incomplete Registrations Cleanup Cron scheduler registered (runs daily at 3:00 AM).');

  // Trigger once on server boot after 10-second buffer
  setTimeout(() => {
    cleanupIncompleteRegistrations();
  }, 10000);

  // Schedule daily at 3:00 AM (0 3 * * *)
  cron.schedule('0 3 * * *', () => {
    cleanupIncompleteRegistrations();
  });
};

module.exports = {
  startIncompleteRegistrationsCleanupCron,
  cleanupIncompleteRegistrations
};
