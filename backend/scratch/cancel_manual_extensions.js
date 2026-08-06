const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const Business = require('../models/Business');
const Subscription = require('../models/Subscription');

const cancelManual = async () => {
  await connectDB();
  try {
    console.log('Locating all manual subscription extensions to cancel...');
    
    // Find all active subscriptions with plan "Monthly Manual Extend" or planType "manual"
    const manualSubs = await Subscription.find({
      $or: [
        { plan: 'Monthly Manual Extend' },
        { planType: 'manual' }
      ],
      status: 'active'
    });

    console.log(`Found ${manualSubs.length} active manual extensions to cancel.`);

    for (const sub of manualSubs) {
      console.log(`\n------------------------------------------`);
      console.log(`Processing Subscription ID: ${sub._id}`);
      
      // Update Subscription status to expired
      sub.status = 'expired';
      await sub.save();
      console.log(`- Subscription status updated to "expired"`);

      // Update corresponding Business listing
      if (sub.businessId) {
        const business = await Business.findById(sub.businessId);
        if (business) {
          business.subscriptionStatus = 'expired';
          business.isPremium = false;
          // Set expiry to yesterday to ensure it is in the past
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          business.subscriptionExpiry = yesterday;
          
          await business.save();
          console.log(`- Business "${business.name}" status updated to "expired" and isPremium = false`);
          console.log(`- Business expiry set to yesterday: ${yesterday.toString()}`);
        } else {
          console.log(`- Associated business ${sub.businessId} not found`);
        }
      }
    }
    
    console.log(`\n------------------------------------------`);
    console.log('Cancellation migration completed successfully!');
  } catch (err) {
    console.error('Error during cancellation migration:', err);
  } finally {
    mongoose.connection.close();
  }
};

cancelManual();
