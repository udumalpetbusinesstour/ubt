const mongoose = require('mongoose');

const mongoUri = 'mongodb://adminuser:M0ngo%402026%23Srv1757975%21Db@187.127.175.59:28018/udtbusiness?authSource=admin';

const PaymentSchema = new mongoose.Schema({}, { strict: false, collection: 'payments' });
const SubscriptionSchema = new mongoose.Schema({}, { strict: false, collection: 'subscriptions' });
const BusinessSchema = new mongoose.Schema({}, { strict: false, collection: 'businesses' });

const Payment = mongoose.model('Payment', PaymentSchema);
const Subscription = mongoose.model('Subscription', SubscriptionSchema);
const Business = mongoose.model('Business', BusinessSchema);

async function run() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB!');
    
    const payments = await Payment.find().lean();
    console.log(`\n--- PAYMENTS (${payments.length} total) ---`);
    for (const p of payments) {
      const biz = p.businessId ? await Business.findById(p.businessId).lean() : null;
      console.log(`ID: ${p._id}, Date: ${p.createdAt}, Amount: ₹${p.amount}, Status: ${p.paymentStatus || p.status}, Business: ${biz ? biz.name || biz.businessName : 'N/A'}`);
    }

    const subscriptions = await Subscription.find().lean();
    console.log(`\n--- SUBSCRIPTIONS (${subscriptions.length} total) ---`);
    for (const s of subscriptions) {
      const biz = s.businessId ? await Business.findById(s.businessId).lean() : null;
      console.log(`ID: ${s._id}, Date: ${s.createdAt}, Plan: ${s.planName || s.plan}, AmountPaid: ₹${s.amountPaid}, Status: ${s.status}, Business: ${biz ? biz.name || biz.businessName : 'N/A'}`);
    }

    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
}

run();
