const mongoose = require('../backend/node_modules/mongoose');
const path = require('path');
const dotenv = require('../backend/node_modules/dotenv');
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

async function check() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/udtbusiness');
  const Business = require('../backend/models/Business');

  const bizs = await Business.find({
    updatedAt: { $gte: new Date('2026-07-20T00:00:00.000Z') }
  });

  console.log('Businesses updated today:', bizs.map(b => ({ id: b._id, name: b.name || b.businessName, subStatus: b.subscriptionStatus, updatedAt: b.updatedAt })));
  await mongoose.disconnect();
}
check();
