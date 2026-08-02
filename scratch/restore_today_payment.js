const mongoose = require('../backend/node_modules/mongoose');
const path = require('path');
const dotenv = require('../backend/node_modules/dotenv');
const fs = require('fs');
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const Payment = require('../backend/models/Payment');
const Subscription = require('../backend/models/Subscription');
const Business = require('../backend/models/Business');

async function restore() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/udtbusiness';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const bizId = new mongoose.Types.ObjectId('6a5db6ee2e8fbf788ac1b054');
    let biz = await Business.findById(bizId);
    
    // 1. Re-create Payment in MongoDB for 20/07/2026
    const payment = await Payment.create({
      businessId: bizId,
      userId: biz ? biz.ownerId : new mongoose.Types.ObjectId('6a4e4368b1a1a7fbb4933610'),
      amount: 99,
      paymentMethod: 'UPI',
      status: 'Paid',
      paymentStatus: 'Paid',
      orderId: 'order_restored_20072026',
      paymentId: 'pay_restored_20072026',
      razorpayOrderId: 'order_restored_20072026',
      razorpayPaymentId: 'pay_restored_20072026',
      paymentDate: new Date('2026-07-20T12:00:00.000Z'),
      paidAt: new Date('2026-07-20T12:00:00.000Z'),
      createdAt: new Date('2026-07-20T12:00:00.000Z')
    });

    console.log('Recreated Payment record in MongoDB:', payment._id);

    // 2. Append to Google Sheets Income Tracker(new)
    const { google } = require('../backend/node_modules/googleapis');
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
    const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });
    const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
    const targetTab = 'Income Tracker(new)';

    const bizName = (biz && (biz.name || biz.businessName)) ? (biz.name || biz.businessName) : 'Unknown Business';

    // Append Payment row
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${targetTab}'!A2`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          ['20/07/2026', bizName, 99, 99, 0, 0, 0]
        ]
      }
    });

    // Append Daily Total row
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `'${targetTab}'!A2`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [
          ['20/07/2026', 'Daily Total', 99, 99, 0, 0, 0]
        ]
      }
    });

    console.log(`Successfully restored payment and daily total for "${bizName}" on 20/07/2026 in Google Sheet "${targetTab}".`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error restoring payment:', err);
  }
}

restore();
