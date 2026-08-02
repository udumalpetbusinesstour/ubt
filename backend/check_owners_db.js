const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/udtbusiness').then(async () => {
  const User = require('./models/User');
  const Business = require('./models/Business');

  const biz = await Business.findOne({ name: /Control N/i });
  if (biz) {
    console.log(`Business Name: ${biz.name}`);
    console.log(`Business ID: ${biz._id}`);
    console.log(`Owner User ID (ownerId): ${biz.ownerId}`);
    
    const owner = await User.findById(biz.ownerId);
    if (owner) {
      console.log(`Owner Name: ${owner.name}, Email: ${owner.email}`);
    }
  } else {
    console.log("Control N business not found in Business collection.");
  }

  const targetUser = await User.findById('6a4f45970fbded536616d05e');
  if (targetUser) {
    console.log(`\nUser '6a4f45970fbded536616d05e' Details:`);
    console.log(`Name: ${targetUser.name}`);
    console.log(`Email: ${targetUser.email}`);
    console.log(`Role: ${targetUser.role}`);
  } else {
    console.log(`\nUser '6a4f45970fbded536616d05e' not found in User collection.`);
  }

  process.exit(0);
}).catch(err => {
  console.error(err);
  process.exit(1);
});
