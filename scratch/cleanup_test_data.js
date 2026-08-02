const mongoose = require('../backend/node_modules/mongoose');
const path = require('path');
const dotenv = require('../backend/node_modules/dotenv');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const Payment = require('../backend/models/Payment');
const Subscription = require('../backend/models/Subscription');
const Business = require('../backend/models/Business');
const { getSheetsClient, getSpreadsheetId } = require('../backend/services/sheetsService');

async function runCleanup() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/udtbusiness';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // 1. Find payments created today (2026-07-20) or matching test business names
    const testBizs = await Business.find({
      $or: [
        { name: /antigravity|test/i },
        { businessName: /antigravity|test/i }
      ]
    });
    const testBizIds = testBizs.map(b => b._id);
    console.log('Found Test Businesses:', testBizs.map(b => ({ id: b._id, name: b.businessName || b.name })));

    // Find Payments
    const paymentsToDelete = await Payment.find({
      $or: [
        { businessId: { $in: testBizIds } },
        { createdAt: { $gte: new Date('2026-07-20T00:00:00.000Z') } }
      ]
    }).populate('businessId');

    console.log('\n--- PAYMENTS TO REMOVE FROM MONGO ---');
    paymentsToDelete.forEach(p => {
      console.log(`Payment ID: ${p._id}, Amount: ₹${p.amount}, Biz: ${p.businessId?.name || p.businessId?.businessName || 'Unknown Business'}, Date: ${p.createdAt}`);
    });

    const paymentIds = paymentsToDelete.map(p => p._id);
    if (paymentIds.length > 0) {
      const delPayResult = await Payment.deleteMany({ _id: { $in: paymentIds } });
      console.log(`\nDeleted ${delPayResult.deletedCount} Payment records from MongoDB.`);
    }

    // Find Subscriptions
    const subsToDelete = await Subscription.find({
      $or: [
        { businessId: { $in: testBizIds } },
        { createdAt: { $gte: new Date('2026-07-20T00:00:00.000Z') } }
      ]
    });
    const subIds = subsToDelete.map(s => s._id);
    if (subIds.length > 0) {
      const delSubResult = await Subscription.deleteMany({ _id: { $in: subIds } });
      console.log(`Deleted ${delSubResult.deletedCount} Subscription records from MongoDB.`);
    }

    // Delete Test Businesses
    if (testBizIds.length > 0) {
      const delBizResult = await Business.deleteMany({ _id: { $in: testBizIds } });
      console.log(`Deleted ${delBizResult.deletedCount} Test Business records from MongoDB.`);
    }

    // 2. Clean up Google Sheets Income Tracker
    console.log('\n--- CLEANING GOOGLE SHEETS INCOME TRACKER ---');
    const { google } = require('../backend/node_modules/googleapis');
    const fs = require('fs');

    const keyPath = path.join(__dirname, '../backend/config/google-indexing-key.json');
    let authConfig = {
      scopes: [
        'https://www.googleapis.com/auth/indexing',
        'https://www.googleapis.com/auth/spreadsheets'
      ]
    };

    if (process.env.GOOGLE_INDEXING_CREDENTIALS) {
      authConfig.credentials = JSON.parse(process.env.GOOGLE_INDEXING_CREDENTIALS);
    } else if (fs.existsSync(keyPath)) {
      authConfig.keyFile = keyPath;
    }

    const auth = new google.auth.GoogleAuth(authConfig);
    const authClient = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: authClient });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const targetTab = 'Income Tracker(new)';
    console.log(`Fetching rows from tab: "${targetTab}"...`);

    const getRes = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${targetTab}'!A:G`
    });

    const rows = getRes.data.values || [];
    console.log(`Total rows currently in Google Sheet tab "${targetTab}": ${rows.length}`);

    // Filter out rows containing "Antigravity", "Test Business", or "Unknown Business" created on 20/07/2026
    const cleanedRows = rows.filter((row, index) => {
      if (index === 0) return true; // Keep header row
      const dateCell = row[0] || '';
      const bizCell = row[1] || '';
      
      const isTestRow = bizCell.toLowerCase().includes('antigravity') || 
                        bizCell.toLowerCase().includes('test business') || 
                        (bizCell.toLowerCase().includes('unknown business') && (dateCell.includes('20/07/2026') || dateCell.includes('20/7/2026')));

      if (isTestRow) {
        console.log(`Removing row ${index + 1}: Date=${dateCell}, Business=${bizCell}, Amount=${row[2]}`);
        return false;
      }
      return true;
    });

    if (cleanedRows.length < rows.length) {
      // Clear sheet and rewrite cleaned rows
      await sheets.spreadsheets.values.clear({
        spreadsheetId,
        range: `'${targetTab}'!A:G`
      });

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${targetTab}'!A1`,
        valueInputOption: 'USER_ENTERED',
        resource: {
          values: cleanedRows
        }
      });
      console.log(`Successfully updated Google Sheet! Removed ${rows.length - cleanedRows.length} test rows.`);
    } else {
      console.log('No matching test rows found in Google Sheet.');
    }

    await mongoose.disconnect();
    console.log('\nCleanup finished successfully!');
  } catch (err) {
    console.error('Cleanup error:', err);
  }
}

runCleanup();
