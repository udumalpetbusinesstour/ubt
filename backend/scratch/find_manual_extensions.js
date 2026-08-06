const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Business = require('../models/Business');
const Subscription = require('../models/Subscription');
const User = require('../models/User');

const findManual = async () => {
  await connectDB();
  try {
    console.log('Finding all manual subscription extensions in the database...');
    
    // Find all subscriptions with plan "Monthly Manual Extend" or planType "manual"
    const manualSubs = await Subscription.find({
      $or: [
        { plan: 'Monthly Manual Extend' },
        { planType: 'manual' }
      ]
    }).populate('businessId').populate('ownerId');

    console.log(`Found ${manualSubs.length} manual extension subscription records:\n`);
    
    for (const sub of manualSubs) {
      const bizName = sub.businessId ? sub.businessId.name : 'Unknown Listing';
      const bizId = sub.businessId ? sub.businessId._id : 'N/A';
      const ownerName = sub.ownerId ? (sub.ownerId.fullName || sub.ownerId.name) : 'Unknown Owner';
      
      console.log(`------------------------------------------`);
      console.log(`Business Name : "${bizName}" (ID: ${bizId})`);
      console.log(`Owner Name    : ${ownerName}`);
      console.log(`Extension Date: ${new Date(sub.startDate || sub.createdAt).toString()}`);
      console.log(`New Expiry    : ${new Date(sub.endDate || sub.expiryDate).toString()}`);
      console.log(`Status        : "${sub.status}"`);
    }
    
    console.log(`\n------------------------------------------`);
    console.log('Search completed.');
  } catch (err) {
    console.error('Error searching database:', err);
  } finally {
    mongoose.connection.close();
  }
};

findManual();
