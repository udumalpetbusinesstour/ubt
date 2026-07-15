const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

const keyPath = path.join(__dirname, '../config/google-indexing-key.json');

/**
 * Append transaction data to the Income Tracker Google Sheet
 * @param {Object} data Transaction details
 * @param {string} data.businessName Name of the business
 * @param {number} data.monthlyPaid Amount paid for monthly plan (0 / 99)
 * @param {number} data.yearlyPaid Amount paid for yearly plan (0 / 999)
 * @param {number} data.eventPaid Amount paid for listing an event (0 / 99)
 * @param {number} data.addPaid Amount paid for add-ons / sponsored ads (0 / 99)
 */
const appendToIncomeTracker = async ({ businessName, monthlyPaid = 0, yearlyPaid = 0, eventPaid = 0, addPaid = 0 }) => {
  try {
    let authConfig = {
      scopes: [
        'https://www.googleapis.com/auth/indexing',
        'https://www.googleapis.com/auth/spreadsheets'
      ]
    };

    if (process.env.GOOGLE_INDEXING_CREDENTIALS) {
      try {
        const credentials = JSON.parse(process.env.GOOGLE_INDEXING_CREDENTIALS);
        authConfig.credentials = credentials;
      } catch (jsonErr) {
        console.error('[Google Sheets API] Failed to parse GOOGLE_INDEXING_CREDENTIALS env var:', jsonErr.message);
      }
    } else if (fs.existsSync(keyPath)) {
      authConfig.keyFile = keyPath;
    } else {
      console.warn('[Google Sheets API] Google credentials not found. Skipping entry.');
      return;
    }

    const auth = new google.auth.GoogleAuth(authConfig);
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    if (!spreadsheetId) {
      console.warn('[Google Sheets API] GOOGLE_SPREADSHEET_ID env variable is not set. Skipping entry.');
      return;
    }

    // Fetch spreadsheet metadata to verify if "Income Tracker" sheet exists. If not, fallback to first sheet.
    let targetTab = 'Income Tracker';
    try {
      const meta = await sheets.spreadsheets.get({ spreadsheetId });
      const sheetsList = meta.data.sheets.map(s => s.properties.title);
      if (!sheetsList.includes(targetTab) && sheetsList.length > 0) {
        targetTab = sheetsList[0];
      }
    } catch (metaErr) {
      console.warn('[Google Sheets API] Could not fetch sheets list metadata, using fallback range:', metaErr.message);
    }

    const range = `${targetTab}!A:G`;
    const localDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const totalPaid = monthlyPaid + yearlyPaid + eventPaid + addPaid;

    console.log(`[Google Sheets API] Appending transaction for: ${businessName} (M: ${monthlyPaid}, Y: ${yearlyPaid}, E: ${eventPaid}, A: ${addPaid}, Total: ${totalPaid})`);

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [
            dateStr,
            businessName,
            totalPaid,
            monthlyPaid,
            yearlyPaid,
            eventPaid,
            addPaid
          ]
        ]
      }
    });

    console.log(`[Google Sheets API] Recorded transaction successfully for "${businessName}"`);
  } catch (error) {
    console.error('[Google Sheets API] Error appending transaction to Google Sheet:', error.message);
  }
};

const appendDailyTotal = async () => {
  try {
    const Payment = require('../models/Payment');
    const Subscription = require('../models/Subscription');
    const Event = require('../models/Event');
    const Business = require('../models/Business');

    // 1. Fetch today's payments in Kolkata timezone (12:00:00 AM to 11:59:59 PM)
    const localDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Define search bounds in UTC corresponding to Kolkata day boundaries
    const startOfDay = new Date(`${dateStr}T00:00:00+05:30`);
    const endOfDay = new Date(`${dateStr}T23:59:59+05:30`);

    console.log(`[Google Sheets API] Auditing daily total for date ${dateStr} (Kolkata) from ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);

    const payments = await Payment.find({
      $or: [
        { status: { $in: ['Paid', 'captured'] } },
        { paymentStatus: 'Paid' }
      ],
      paidAt: { $gte: startOfDay, $lte: endOfDay }
    }).populate('subscriptionId');

    let monthlySum = 0;
    let yearlySum = 0;
    let eventSum = 0;
    let addSum = 0;

    for (const payment of payments) {
      const amt = payment.amount || 0;
      if (payment.isSponsoredAd || payment.promotionId) {
        addSum += amt;
      } else if (payment.eventId) {
        eventSum += amt;
      } else if (payment.subscriptionId) {
        const sub = payment.subscriptionId;
        const planStr = (sub.plan || sub.planName || '').toLowerCase();
        if (planStr.includes('monthly') || planStr.includes('plan_tb0vazlqupuhx8') || amt === 99) {
          monthlySum += amt;
        } else {
          yearlySum += amt;
        }
      } else {
        if (amt === 99) monthlySum += 99;
        else if (amt === 999) yearlySum += 999;
        else monthlySum += amt;
      }
    }

    // 2. Authenticate
    let authConfig = {
      scopes: [
        'https://www.googleapis.com/auth/indexing',
        'https://www.googleapis.com/auth/spreadsheets'
      ]
    };

    if (process.env.GOOGLE_INDEXING_CREDENTIALS) {
      try {
        const credentials = JSON.parse(process.env.GOOGLE_INDEXING_CREDENTIALS);
        authConfig.credentials = credentials;
      } catch (jsonErr) {
        console.error('[Google Sheets API] Failed to parse GOOGLE_INDEXING_CREDENTIALS env var:', jsonErr.message);
      }
    } else if (fs.existsSync(keyPath)) {
      authConfig.keyFile = keyPath;
    } else {
      console.warn('[Google Sheets API] Google credentials not found. Skipping entry.');
      return;
    }

    const auth = new google.auth.GoogleAuth(authConfig);
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });

    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    if (!spreadsheetId) {
      console.warn('[Google Sheets API] GOOGLE_SPREADSHEET_ID is not set.');
      return;
    }

    // 3. Resolve sheet name
    let targetTab = 'Income Tracker';
    try {
      const meta = await sheets.spreadsheets.get({ spreadsheetId });
      const sheetsList = meta.data.sheets.map(s => s.properties.title);
      if (!sheetsList.includes(targetTab) && sheetsList.length > 0) {
        targetTab = sheetsList[0];
      }
    } catch (metaErr) {
      console.warn('[Google Sheets API] Could not fetch sheet names for daily total:', metaErr.message);
    }

    console.log(`[Google Sheets API] Appending Daily Total to sheet "${targetTab}": [M: ${monthlySum}, Y: ${yearlySum}, E: ${eventSum}, A: ${addSum}]`);

    const overallTotal = monthlySum + yearlySum + eventSum + addSum;

    // 4. Append row
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${targetTab}!A2`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          [
            dateStr,
            'Daily Total',
            overallTotal,
            monthlySum,
            yearlySum,
            eventSum,
            addSum
          ]
        ]
      }
    });

    // 5. Format the daily total row (Grey background, bold text)
    const updatedRange = response.data.updates.updatedRange;
    const match = updatedRange.match(/A(\d+):G\d+/);
    if (match) {
      const rowIndex = parseInt(match[1]) - 1; // 0-indexed row
      const meta = await sheets.spreadsheets.get({ spreadsheetId });
      const targetSheet = meta.data.sheets.find(s => s.properties.title === targetTab);
      if (targetSheet) {
        const sheetId = targetSheet.properties.sheetId;
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          resource: {
            requests: [
              {
                repeatCell: {
                  range: {
                    sheetId,
                    startRowIndex: rowIndex,
                    endRowIndex: rowIndex + 1,
                    startColumnIndex: 0,
                    endColumnIndex: 7
                  },
                  cell: {
                    userEnteredFormat: {
                      backgroundColor: {
                        red: 0.94,
                        green: 0.94,
                        blue: 0.94
                      },
                      textFormat: {
                        bold: true,
                        fontSize: 10
                      },
                      horizontalAlignment: 'CENTER'
                    }
                  },
                  fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
                }
              }
            ]
          }
        });
      }
    }

    console.log(`[Google Sheets API] Daily Total successfully appended and styled for ${dateStr}`);
  } catch (error) {
    console.error('[Google Sheets API] Error processing daily total append:', error.message);
  }
};

module.exports = { appendToIncomeTracker, appendDailyTotal };
