const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Business = require('../models/Business');
const Subscription = require('../models/Subscription');

const debug = async () => {
  await connectDB();
  try {
    const now = new Date();
    console.log('Current Server Time (UTC):', now.toISOString());
    console.log('Current Local Time:', now.toString());

    // Find business by name "Crystal Code Labs" (case-insensitive regex)
    const bizList = await Business.find({ name: { $regex: /crystal/i } }).populate('ownerId');
    console.log(`Found ${bizList.length} business(es) containing "crystal":`);
    
    for (const biz of bizList) {
      console.log(`\n==========================================`);
      console.log(`Business Name: "${biz.name}"`);
      console.log(`ID: ${biz._id}`);
      console.log(`subscriptionStatus: "${biz.subscriptionStatus}"`);
      console.log(`isPremium: ${biz.isPremium}`);
      console.log(`subscriptionExpiry (raw):`, biz.subscriptionExpiry);
      if (biz.subscriptionExpiry) {
        const expiry = new Date(biz.subscriptionExpiry);
        const diffMs = expiry.getTime() - now.getTime();
        const diffDays = diffMs / (1000 * 60 * 60 * 24);
        console.log(`subscriptionExpiry (parsed): ${expiry.toString()} (${expiry.toISOString()})`);
        console.log(`Time Difference: ${diffDays.toFixed(3)} days`);
        console.log(`Is Expired (diff <= 0): ${diffDays <= 0}`);
      } else {
        console.log(`subscriptionExpiry is missing or null!`);
      }
      
      console.log(`Owner:`, biz.ownerId ? {
        _id: biz.ownerId._id,
        name: biz.ownerId.name,
        fullName: biz.ownerId.fullName,
        email: biz.ownerId.email
      } : 'null');

      // Find active subscriptions
      const subs = await Subscription.find({ businessId: biz._id });
      console.log(`Subscriptions associated with this business (total ${subs.length}):`);
      for (const s of subs) {
        console.log(`  * ID: ${s._id}`);
        console.log(`    Plan: ${s.plan || s.planType}`);
        console.log(`    Status: "${s.status}"`);
        console.log(`    StartDate:`, s.startDate);
        console.log(`    EndDate:`, s.endDate);
        console.log(`    expiryDate:`, s.expiryDate);
        console.log(`    autoRenew: ${s.autoRenew}`);
      }
    }
  } catch (err) {
    console.error('Error during debug:', err);
  } finally {
    mongoose.connection.close();
  }
};

debug();
