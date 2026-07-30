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
    console.log('[Incomplete Registration Cron] Running stale registration audit... Automatic deletion is now disabled. Unpaid registrations are preserved and moved to the "Non-Payment" admin panel section instead.');
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
