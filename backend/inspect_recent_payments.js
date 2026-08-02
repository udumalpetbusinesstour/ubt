require('dotenv').config();
const mongoose = require('mongoose');

const Business = require('./models/Business');
const Subscription = require('./models/Subscription');
const Payment = require('./models/Payment');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const inspect = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected.');

    const payments = await Payment.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('businessId')
      .populate('userId')
      .populate('subscriptionId');

    console.log('\n--- RECENT 10 PAYMENTS IN MONODB ---');
    for (const p of payments) {
      console.log(`Payment ID: ${p._id}`);
      console.log(`Amount: ${p.amount} | Status: ${p.status} | Method: ${p.paymentMethod}`);
      console.log(`Date: ${p.createdAt || p.paymentDate}`);
      console.log(`User: ${p.userId ? (p.userId.fullName || p.userId.email) : 'NO USER'}`);
      console.log(`BusinessId Field: ${p.businessId ? (p.businessId.name || p.businessId.businessName || p.businessId._id) : 'NULL'}`);
      
      if (p.userId) {
        const userBiz = await Business.find({ ownerId: p.userId._id });
        console.log(`User Owned Businesses (${userBiz.length}):`, userBiz.map(b => b.name || b.businessName));
      }
      console.log('-----------------------------------');
    }

    const subscriptions = await Subscription.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('businessId')
      .populate('userId');

    console.log('\n--- RECENT 10 SUBSCRIPTIONS IN MONODB ---');
    for (const s of subscriptions) {
      console.log(`Sub ID: ${s._id} | Amount: ${s.amount} | Plan: ${s.plan} | Status: ${s.status}`);
      console.log(`Date: ${s.createdAt || s.startDate}`);
      console.log(`User: ${s.userId ? (s.userId.fullName || s.userId.email) : 'NO USER'}`);
      console.log(`Business: ${s.businessId ? (s.businessId.name || s.businessId.businessName || s.businessId._id) : 'NULL'}`);
      if (s.userId) {
        const userBiz = await Business.find({ ownerId: s.userId._id });
        console.log(`User Owned Businesses:`, userBiz.map(b => b.name || b.businessName));
      }
      console.log('-----------------------------------');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

inspect();
