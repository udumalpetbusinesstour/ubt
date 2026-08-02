const mongoose = require('mongoose');
require('dotenv').config({ path: '../backend/.env' });

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

async function check() {
  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');
  const Payment = require('../backend/models/Payment');
  const Business = require('../backend/models/Business');

  const payments = await Payment.find({
    createdAt: { $gte: new Date('2026-07-20T00:00:00Z') }
  }).populate('businessId').populate('userId');

  console.log('Payments after 20/07/2026:');
  for (const p of payments) {
    console.log({
      id: p._id,
      amount: p.amount,
      createdAt: p.createdAt,
      status: p.status,
      businessName: p.businessId ? (p.businessId.name || p.businessId.businessName) : 'null',
      userName: p.userId ? (p.userId.fullName || p.userId.email) : 'null'
    });
  }
  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
