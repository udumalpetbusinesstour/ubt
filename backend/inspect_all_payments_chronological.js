require('dotenv').config();
const mongoose = require('mongoose');

const Business = require('./models/Business');
const Subscription = require('./models/Subscription');
const Payment = require('./models/Payment');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const inspectAll = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected.');

    const payments = await Payment.find({})
      .sort({ createdAt: 1 })
      .populate('businessId')
      .populate('userId');

    console.log(`\nFound ${payments.length} total payments in MongoDB.\n`);

    payments.forEach((p, idx) => {
      const pDate = new Date(p.createdAt || p.paymentDate);
      const dateStr = `${String(pDate.getDate()).padStart(2, '0')}/${String(pDate.getMonth() + 1).padStart(2, '0')}/${pDate.getFullYear()}`;
      const timeStr = `${String(pDate.getHours()).padStart(2, '0')}:${String(pDate.getMinutes()).padStart(2, '0')}:${String(pDate.getSeconds()).padStart(2, '0')}`;
      const bName = p.businessId ? (p.businessId.name || p.businessId.businessName) : (p.userId ? (p.userId.fullName || p.userId.name) : 'UNKNOWN');
      
      console.log(`[${idx + 1}] Date: ${dateStr} ${timeStr} | Amount: ₹${p.amount} | Business: "${bName}" | Status: ${p.status}`);
    });

    const subs = await Subscription.find({})
      .sort({ createdAt: 1 })
      .populate('businessId')
      .populate('userId');

    console.log(`\nFound ${subs.length} total subscriptions in MongoDB.\n`);
    subs.forEach((s, idx) => {
      const sDate = new Date(s.createdAt || s.startDate);
      const dateStr = `${String(sDate.getDate()).padStart(2, '0')}/${String(sDate.getMonth() + 1).padStart(2, '0')}/${sDate.getFullYear()}`;
      const timeStr = `${String(sDate.getHours()).padStart(2, '0')}:${String(sDate.getMinutes()).padStart(2, '0')}:${String(sDate.getSeconds()).padStart(2, '0')}`;
      const bName = s.businessId ? (s.businessId.name || s.businessId.businessName) : (s.userId ? (s.userId.fullName || s.userId.name) : 'UNKNOWN');

      console.log(`[${idx + 1}] Date: ${dateStr} ${timeStr} | Amount: ₹${s.amount} | Plan: ${s.plan} | Business: "${bName}" | Status: ${s.status}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

inspectAll();
