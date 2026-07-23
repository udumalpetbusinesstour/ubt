require('dotenv').config();
const mongoose = require('mongoose');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const Payment = require('./models/Payment');
const Business = require('./models/Business');
const Subscription = require('./models/Subscription');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const rebuildSheetsTracker = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected.');

    // 1. Configure Google Auth
    let authConfig = {
      scopes: [
        'https://www.googleapis.com/auth/indexing',
        'https://www.googleapis.com/auth/spreadsheets'
      ]
    };

    const keyPath = path.join(__dirname, 'config', 'google-indexing-key.json');
    if (fs.existsSync(keyPath)) {
      authConfig.keyFile = keyPath;
    } else if (process.env.GOOGLE_INDEXING_CREDENTIALS) {
      authConfig.credentials = JSON.parse(process.env.GOOGLE_INDEXING_CREDENTIALS);
    } else {
      console.error('No Google credentials found!');
      process.exit(1);
    }

    const auth = new google.auth.GoogleAuth(authConfig);
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    if (!spreadsheetId) {
      console.error('GOOGLE_SPREADSHEET_ID is not set in environment.');
      process.exit(1);
    }

    const tabTitle = 'Income Tracker(new)';
    console.log(`Clearing existing content in sheet tab "${tabTitle}" A2:G500...`);
    await sheets.spreadsheets.values.clear({
      spreadsheetId,
      range: `'${tabTitle}'!A2:G500`
    });

    // 2. Fetch all July 2026 successful payments
    const start = new Date('2026-07-01T00:00:00+05:30');
    console.log('Fetching payments from database...');
    const payments = await Payment.find({
      paidAt: { $gte: start },
      $or: [{ status: { $in: ['Paid', 'captured'] } }, { paymentStatus: 'Paid' }]
    })
    .populate('businessId')
    .populate('subscriptionId')
    .sort({ paidAt: 1 });

    console.log(`Loaded ${payments.length} payments to write to Google Sheets.`);

    // 3. Group payments by local date string YYYY-MM-DD in Asia/Kolkata timezone
    const paymentsByDate = {};
    for (const p of payments) {
      const pDate = new Date(p.paidAt || p.paymentDate);
      
      // Extract local date components in Asia/Kolkata timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const parts = formatter.formatToParts(pDate);
      const month = parts.find(pt => pt.type === 'month').value;
      const day = parts.find(pt => pt.type === 'day').value;
      const year = ptIndex => parts.find(pt => pt.type === 'year').value;
      
      const localDateStr = `${parts.find(pt => pt.type === 'year').value}-${month}-${day}`; // "YYYY-MM-DD"
      
      if (!paymentsByDate[localDateStr]) {
        paymentsByDate[localDateStr] = [];
      }
      paymentsByDate[localDateStr].push(p);
    }

    const sortedDates = Object.keys(paymentsByDate).sort((a, b) => new Date(a) - new Date(b));

    const preparedRows = [];
    preparedRows.push(['July 2026']); // Row 2 Month Header

    const dailyTotalIndices = []; // To keep track of which row numbers represent daily totals for formatting (0-indexed)

    // Current row counter starting after header (row 1 is columns list, row 2 is "July 2026", row 3 is index 2)
    let currentRowIndex = 2; // 0-indexed index in preparedRows array

    for (const dateStr of sortedDates) {
      const datePayments = paymentsByDate[dateStr];
      
      let dailyMonthlySum = 0;
      let dailyYearlySum = 0;
      let dailyEventSum = 0;
      let dailyAddSum = 0;

      for (const p of datePayments) {
        let name = 'Unknown Business';
        if (p.businessId) {
          name = p.businessId.name || p.businessId.businessName || 'Unknown Business';
        }

        const amt = p.amount || 0;
        let monthlyPaid = 0;
        let yearlyPaid = 0;
        let eventPaid = 0;
        let addPaid = 0;

        if (p.isSponsoredAd || p.promotionId) {
          addPaid = amt;
          dailyAddSum += amt;
        } else if (p.eventId) {
          eventPaid = amt;
          dailyEventSum += amt;
        } else if (p.subscriptionId) {
          const sub = p.subscriptionId;
          const planStr = (sub.plan || sub.planName || '').toLowerCase();
          if (planStr.includes('monthly') || amt === 99 || amt === 116.82) {
            monthlyPaid = amt;
            dailyMonthlySum += amt;
          } else {
            yearlyPaid = amt;
            dailyYearlySum += amt;
          }
        } else {
          if (amt === 99 || amt === 116.82) {
            monthlyPaid = amt;
            dailyMonthlySum += amt;
          } else if (amt === 999 || amt === 1178.82) {
            yearlyPaid = amt;
            dailyYearlySum += amt;
          } else {
            monthlyPaid = amt;
            dailyMonthlySum += amt;
          }
        }

        preparedRows.push([
          dateStr,
          name,
          amt,
          monthlyPaid,
          yearlyPaid,
          eventPaid,
          addPaid
        ]);
        currentRowIndex++;
      }

      // Add Daily Total row for the day
      const overallTotal = dailyMonthlySum + dailyYearlySum + dailyEventSum + dailyAddSum;
      preparedRows.push([
        dateStr,
        'Daily Total',
        overallTotal,
        dailyMonthlySum,
        dailyYearlySum,
        dailyEventSum,
        dailyAddSum
      ]);
      dailyTotalIndices.push(currentRowIndex);
      currentRowIndex++;
    }

    console.log(`Writing ${preparedRows.length} rows of chronological tracker data to sheets...`);
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${tabTitle}'!A2`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: preparedRows
      }
    });

    console.log('Applying cell formatting for Daily Total summary rows...');
    const metaTab = await sheets.spreadsheets.get({ spreadsheetId });
    const targetSheet = metaTab.data.sheets.find(s => s.properties.title === tabTitle);
    
    if (targetSheet) {
      const sheetId = targetSheet.properties.sheetId;
      const requests = [];

      for (const idx of dailyTotalIndices) {
        // Adjust for index mapping. Since we started writing from row 2 (which is A2),
        // row index in sheets is idx + 1 (1-based sheet row index).
        const sheetRowIdx = idx + 1; // 0-indexed row for repeatCell
        
        requests.push({
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: sheetRowIdx,
              endRowIndex: sheetRowIdx + 1,
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
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE'
              }
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment,verticalAlignment)'
          }
        });

        // Format Date cell to align center
        requests.push({
          repeatCell: {
            range: {
              sheetId,
              startRowIndex: sheetRowIdx,
              endRowIndex: sheetRowIdx + 1,
              startColumnIndex: 0,
              endColumnIndex: 1
            },
            cell: {
              userEnteredFormat: {
                numberFormat: {
                  type: 'DATE',
                  pattern: 'dd/mm/yyyy'
                }
              }
            },
            fields: 'userEnteredFormat.numberFormat'
          }
        });
      }

      if (requests.length > 0) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests
          }
        });
        console.log(`Successfully formatted ${dailyTotalIndices.length} Daily Total summary rows.`);
      }
    }

    console.log('\n--- Rebuild of Google Sheets Income Tracker completed successfully! ---');
    process.exit(0);
  } catch (err) {
    console.error('Error rebuilding Google Sheets tracker:', err.message);
    process.exit(1);
  }
};

rebuildSheetsTracker();
