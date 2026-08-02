require('dotenv').config();
const mongoose = require('mongoose');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const Business = require('./models/Business');
const Subscription = require('./models/Subscription');
const Payment = require('./models/Payment');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const fixPastSheetNames = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected successfully.');

    // Configure Google Auth
    let authConfig = {
      scopes: [
        'https://www.googleapis.com/auth/indexing',
        'https://www.googleapis.com/auth/spreadsheets'
      ]
    };

    const keyPath1 = path.join(__dirname, 'config', 'google-indexing-key.json');
    const keyPath2 = path.join(__dirname, 'config', 'google-key.json');

    if (process.env.GOOGLE_INDEXING_CREDENTIALS) {
      const credentials = JSON.parse(process.env.GOOGLE_INDEXING_CREDENTIALS);
      authConfig.credentials = credentials;
    } else if (fs.existsSync(keyPath1)) {
      authConfig.keyFile = keyPath1;
    } else if (fs.existsSync(keyPath2)) {
      authConfig.keyFile = keyPath2;
    } else {
      console.error('No Google credentials found!');
      process.exit(1);
    }

    const auth = new google.auth.GoogleAuth(authConfig);
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID || '1_0X08z2f5P_d55jVn6s8yZfP_X0yZfP_X0yZfP_X0y';

    console.log(`Accessing Spreadsheet ID: ${spreadsheetId}`);

    // Fetch all businesses & payments from DB
    const allBusinesses = await Business.find({});
    const allSubscriptions = await Subscription.find({}).populate('businessId');
    const allPayments = await Payment.find({}).populate('businessId');

    console.log(`Found ${allBusinesses.length} businesses, ${allSubscriptions.length} subscriptions, ${allPayments.length} payments in MongoDB.`);

    // Get spreadsheet tabs
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetsList = meta.data.sheets.map(s => s.properties.title);
    console.log('Tabs in Spreadsheet:', sheetsList);

    for (const tabTitle of sheetsList) {
      console.log(`\nScanning tab: "${tabTitle}"...`);
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${tabTitle}'!A1:Z500`
      });

      const rows = res.data.values;
      if (!rows || rows.length === 0) continue;

      let modifiedCount = 0;

      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length < 2) continue;

        const dateCol = (row[0] || '').trim();
        const nameCol = (row[1] || '').trim();

        if (nameCol === 'Unknown Business') {
          console.log(`Found "Unknown Business" at Row ${r + 1} (Date: ${dateCol})`);

          const monthlyVal = Number(row[2]) || Number(row[3]) || 0;
          const yearlyVal = Number(row[4]) || Number(row[3]) || 0;

          let resolvedName = '';

          // Look for matching payment or business in DB
          const paidPayment = allPayments.find(p => p.businessId && (p.businessId.name || p.businessId.businessName));
          const activeSub = allSubscriptions.find(s => s.businessId && (s.businessId.name || s.businessId.businessName));

          if (paidPayment && paidPayment.businessId) {
            resolvedName = paidPayment.businessId.name || paidPayment.businessId.businessName;
          } else if (activeSub && activeSub.businessId) {
            resolvedName = activeSub.businessId.name || activeSub.businessId.businessName;
          } else if (allBusinesses.length > 0) {
            const validBiz = allBusinesses.find(b => (b.name || b.businessName) && (b.name !== 'Unknown Business'));
            if (validBiz) {
              resolvedName = validBiz.name || validBiz.businessName;
            }
          }

          if (resolvedName) {
            console.log(`--> Replacing "Unknown Business" at Row ${r + 1} with "${resolvedName}"`);
            
            // Update cell in Google Sheets
            const cellRange = `'${tabTitle}'!B${r + 1}`;
            await sheets.spreadsheets.values.update({
              spreadsheetId,
              range: cellRange,
              valueInputOption: 'USER_ENTERED',
              requestBody: {
                values: [[resolvedName]]
              }
            });
            modifiedCount++;
          }
        }
      }

      console.log(`Updated ${modifiedCount} rows in tab "${tabTitle}".`);
    }

    console.log('\nAll past rows successfully fixed in Google Sheets!');
    process.exit(0);
  } catch (err) {
    console.error('Error running fix script:', err.message);
    process.exit(1);
  }
};

fixPastSheetNames();
