const cron = require('node-cron');
const { appendDailyTotal } = require('../services/sheetsService');

/**
 * Automate Daily Sheets Income Tracker Total
 * Scheduled to run every day at 11:59 PM in Asia/Kolkata timezone
 */
const startDailyTotalCron = () => {
  console.log('[Cron Service] Initializing Daily Total Sheets Cron (23:59 Asia/Kolkata)...');

  cron.schedule('59 23 * * *', () => {
    console.log('[Cron Service] Triggering daily summary sheets total...');
    appendDailyTotal();
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata'
  });
};

module.exports = {
  startDailyTotalCron
};
