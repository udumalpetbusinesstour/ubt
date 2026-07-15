const cron = require('node-cron');
const { appendExpenseWeeklyTotal } = require('../services/sheetsService');

/**
 * Automate Weekly Sheets Expense Tracker Total
 * Scheduled to run every Sunday at 11:59 PM in Asia/Kolkata timezone
 */
const startWeeklyExpenseCron = () => {
  console.log('[Cron Service] Initializing Weekly Expense Sheets Cron (Sunday 23:59 Asia/Kolkata)...');

  cron.schedule('59 23 * * 0', () => {
    console.log('[Cron Service] Triggering weekly expense sheets total...');
    appendExpenseWeeklyTotal();
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata'
  });
};

module.exports = {
  startWeeklyExpenseCron
};
