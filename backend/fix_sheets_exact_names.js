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

const fixExactNames = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected.');

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
      authConfig.credentials = JSON.parse(process.env.GOOGLE_INDEXING_CREDENTIALS);
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
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

    // Fetch payments sorted chronological asc
    const allPayments = await Payment.find({})
      .sort({ createdAt: 1 })
      .populate('businessId')
      .populate('userId');

    console.log(`Loaded ${allPayments.length} total payments from MongoDB.`);

    // Get spreadsheet tabs
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const sheetsList = meta.data.sheets.map(s => s.properties.title);

    for (const tabTitle of sheetsList) {
      if (!tabTitle.toLowerCase().includes('income')) continue;

      console.log(`\nProcessing Tab: "${tabTitle}"...`);
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${tabTitle}'!A1:Z500`
      });

      const rows = res.data.values;
      if (!rows || rows.length === 0) continue;

      for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        if (!row || row.length < 2) continue;

        const dateCol = (row[0] || '').trim();
        const currentName = (row[1] || '').trim();

        // Check if row has an amount
        const monthlyVal = Number(row[2]) || 0;
        const yearlyVal = Number(row[4]) || Number(row[3]) || 0;
        const amount = yearlyVal > 0 ? yearlyVal : monthlyVal;

        if (amount <= 0 || dateCol.toLowerCase().includes('total') || dateCol.toLowerCase().includes('date')) {
          continue; // Skip headers & total summary rows
        }

        // Convert DD/MM/YYYY to Date comparison window
        const parts = dateCol.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const year = parseInt(parts[2], 10);

          const rowDateStart = new Date(year, month, day, 0, 0, 0);
          const rowDateEnd = new Date(year, month, day, 23, 59, 59);

          // Find MongoDB payment matching date window & amount
          const matchingPayments = allPayments.filter(p => {
            const pDate = new Date(p.createdAt || p.paymentDate);
            return pDate >= rowDateStart && pDate <= rowDateEnd && Math.abs(p.amount - amount) < 50;
          });

          if (matchingPayments.length > 0) {
            // Match payment
            let bestMatch = matchingPayments[0];
            // If multiple payments on same date, try to consume unused one
            if (matchingPayments.length > 1) {
              const matchedName = matchingPayments.find(p => p.businessId && (p.businessId.name || p.businessId.businessName));
              if (matchedName) bestMatch = matchedName;
            }

            const pBiz = bestMatch.businessId;
            const targetName = pBiz ? (pBiz.name || pBiz.businessName) : (bestMatch.userId ? (bestMatch.userId.fullName || bestMatch.userId.name) : '');

            if (targetName && targetName !== currentName) {
              console.log(`[Row ${r + 1}] Date: ${dateCol} | Amount: ₹${amount} | Changing "${currentName}" -> "${targetName}"`);

              const cellRange = `'${tabTitle}'!B${r + 1}`;
              await sheets.spreadsheets.values.update({
                spreadsheetId,
                range: cellRange,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                  values: [[targetName]]
                }
              });
            }
          }
        }
      }
    }

    console.log('\nExact Google Sheets Name Sync Completed Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error syncing exact names:', err.message);
    process.exit(1);
  }
};

fixExactNames();
