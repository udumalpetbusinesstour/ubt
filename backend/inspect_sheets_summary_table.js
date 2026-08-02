require('dotenv').config();
const mongoose = require('mongoose');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const Business = require('./models/Business');
const Subscription = require('./models/Subscription');
const Payment = require('./models/Payment');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const inspectSummary = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected.');

    // Count paid subscriptions & payments in MongoDB
    const monthlyPayments = await Payment.find({ status: 'Paid', amount: { $gte: 90, $lte: 110 } });
    const yearlyPayments = await Payment.find({ status: 'Paid', amount: { $gte: 900, $lte: 1050 } });

    console.log(`\n--- MONODB ACTUAL PAID COUNTS ---`);
    console.log(`Monthly Paid Payments (₹99): ${monthlyPayments.length} | Revenue: ₹${monthlyPayments.reduce((acc, p) => acc + p.amount, 0)}`);
    console.log(`Yearly Paid Payments (₹999): ${yearlyPayments.length} | Revenue: ₹${yearlyPayments.reduce((acc, p) => acc + p.amount, 0)}`);

    const activeMonthlySubs = await Subscription.find({ status: 'active', amount: { $gte: 90, $lte: 110 } });
    const activeYearlySubs = await Subscription.find({ status: 'active', amount: { $gte: 900, $lte: 1050 } });

    console.log(`Active Monthly Subscriptions: ${activeMonthlySubs.length}`);
    console.log(`Active Yearly Subscriptions: ${activeYearlySubs.length}`);

    // Configure Google Auth
    let authConfig = {
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    };

    const keyPath1 = path.join(__dirname, 'config', 'google-indexing-key.json');
    if (process.env.GOOGLE_INDEXING_CREDENTIALS) {
      authConfig.credentials = JSON.parse(process.env.GOOGLE_INDEXING_CREDENTIALS);
    } else if (fs.existsSync(keyPath1)) {
      authConfig.keyFile = keyPath1;
    }

    const auth = new google.auth.GoogleAuth(authConfig);
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    // Get spreadsheet values AND formulas
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'Income Tracker(new)'!A1:Z100`,
      valueRenderOption: 'FORMULA'
    });

    const valRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'Income Tracker(new)'!A1:Z100`,
      valueRenderOption: 'FORMATTED_VALUE'
    });

    console.log('\n--- GOOGLE SHEETS FORMULAS & VALUES ---');
    const formulas = res.data.values || [];
    const values = valRes.data.values || [];

    for (let r = 0; r < values.length; r++) {
      const vRow = values[r] || [];
      const fRow = formulas[r] || [];
      const rowStr = vRow.join(' | ');
      if (rowStr.includes('Premium') || rowStr.includes('Revenue') || rowStr.includes('Count') || rowStr.includes('Monthly') || rowStr.includes('Yearly')) {
        console.log(`Row ${r + 1} Values:`, vRow);
        console.log(`Row ${r + 1} Formulas:`, fRow);
        console.log('-------------------------------------------');
      }
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

inspectSummary();
