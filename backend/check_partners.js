const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();
const User = require('./models/User');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/udtbusiness');
    console.log('Connected to DB');
    const partners = await User.find({
      $or: [
        { role: 'partner' },
        { isPartnerRegistered: true },
        { isPartnerApproved: true }
      ]
    });
    console.log('Partners Count:', partners.length);
    console.log(JSON.stringify(partners.map(p => ({
      id: p._id,
      fullName: p.fullName,
      name: p.name,
      email: p.email,
      createdAt: p.createdAt,
      role: p.role,
      isPartnerRegistered: p.isPartnerRegistered,
      isPartnerApproved: p.isPartnerApproved
    })), null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
