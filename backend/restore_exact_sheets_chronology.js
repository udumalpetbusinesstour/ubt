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

const restoreExactChronology = async () => {
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

    // Fetch successful payments & subscriptions ordered by createdAt ASC
    const activePayments = await Payment.find({ status: 'Paid' })
      .sort({ createdAt: 1 })
      .populate('businessId')
      .populate('userId');

    const activeSubscriptions = await Subscription.find({ status: { $in: ['active', 'Paid'] } })
      .sort({ createdAt: 1 })
      .populate('businessId')
      .populate('userId');

    console.log(`Loaded ${activePayments.length} paid payments and ${activeSubscriptions.length} active subscriptions.`);

    // Build chronological list of successful transactions with distinct business names
    const transactionsList = [];
    
    // Combine payments and active subscriptions
    for (const p of activePayments) {
      const pDate = new Date(p.createdAt || p.paymentDate);
      const bName = p.businessId ? (p.businessId.name || p.businessId.businessName) : (p.userId ? (p.userId.fullName || p.userId.name) : '');
      if (bName && bName !== 'Unknown Business') {
        transactionsList.push({
          date: pDate,
          amount: p.amount,
          businessName: bName,
          source: 'payment'
        });
      }
    }

    // Sort transactions by date ASC
    transactionsList.sort((a, b) => a.date - b.date);

    console.log(`Prepared ${transactionsList.length} distinct chronological transactions.`);

    const tabTitle = 'Income Tracker(new)';
    console.log(`\nReading sheet tab: "${tabTitle}"...`);
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${tabTitle}'!A1:Z500`
    });

    const rows = res.data.values;
    if (!rows || rows.length === 0) {
      console.error('No rows found in sheet');
      process.exit(1);
    }

    // Group sheet rows by date string DD/MM/YYYY
    const dateRowMap = {};
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      if (!row || row.length < 2) continue;

      const dateCol = (row[0] || '').trim();
      const currentName = (row[1] || '').trim();

      const monthlyVal = Number(row[2]) || 0;
      const yearlyVal = Number(row[4]) || Number(row[3]) || 0;
      const amount = yearlyVal > 0 ? yearlyVal : monthlyVal;

      if (amount <= 0 || dateCol.toLowerCase().includes('total') || dateCol.toLowerCase().includes('date')) {
        continue; // Skip headers & summary rows
      }

      if (!dateRowMap[dateCol]) dateRowMap[dateCol] = [];
      dateRowMap[dateCol].push({ rowIndex: r + 1, currentName, amount });
    }

    console.log('Sheet transaction dates found:', Object.keys(dateRowMap));

    // Group MongoDB transactions by date string DD/MM/YYYY
    const dbDateMap = {};
    for (const t of transactionsList) {
      const d = t.date;
      const dateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      if (!dbDateMap[dateStr]) dbDateMap[dateStr] = [];
      dbDateMap[dateStr].push(t);
    }

    // Process each date in Google Sheets and map 1-to-1 to MongoDB transactions on that date
    for (const dateStr of Object.keys(dateRowMap)) {
      const sheetRowsOnDate = dateRowMap[dateStr];
      const dbTxnsOnDate = dbDateMap[dateStr] || [];

      console.log(`\nDate ${dateStr}: ${sheetRowsOnDate.length} sheet row(s), ${dbTxnsOnDate.length} DB transaction(s).`);

      const usedDbIndices = new Set();

      for (let i = 0; i < sheetRowsOnDate.length; i++) {
        const sRow = sheetRowsOnDate[i];
        
        // Find best unused DB transaction matching amount
        let matchedTxn = null;
        for (let j = 0; j < dbTxnsOnDate.length; j++) {
          if (!usedDbIndices.has(j) && Math.abs(dbTxnsOnDate[j].amount - sRow.amount) < 50) {
            matchedTxn = dbTxnsOnDate[j];
            usedDbIndices.add(j);
            break;
          }
        }

        // Fallback to next unused DB transaction on that date
        if (!matchedTxn) {
          for (let j = 0; j < dbTxnsOnDate.length; j++) {
            if (!usedDbIndices.has(j)) {
              matchedTxn = dbTxnsOnDate[j];
              usedDbIndices.add(j);
              break;
            }
          }
        }

        if (matchedTxn && matchedTxn.businessName !== sRow.currentName) {
          console.log(`  -> Row ${sRow.rowIndex} (₹${sRow.amount}): Restoring "${sRow.currentName}" -> "${matchedTxn.businessName}"`);

          const cellRange = `'${tabTitle}'!B${sRow.rowIndex}`;
          await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: cellRange,
            valueInputOption: 'USER_ENTERED',
            requestBody: {
              values: [[matchedTxn.businessName]]
            }
          });
        }
      }
    }

    console.log('\nExact Chronological Restoration Completed Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error restoring exact chronology:', err);
    process.exit(1);
  }
};

restoreExactChronology();
