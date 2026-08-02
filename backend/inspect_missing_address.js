require('dotenv').config();
const mongoose = require('mongoose');
const Business = require('./models/Business');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const inspectMissing = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    const businesses = await Business.find({});

    console.log('--- 9 BUSINESSES WITH MISSING FULL ADDRESS TEXT ---');
    let count = 0;
    for (const biz of businesses) {
      if (!biz.address && !biz.streetAddress && !biz.locality) {
        count++;
        console.log(`${count}. "${biz.name || biz.businessName}" | Lat: ${biz.latitude}, Lng: ${biz.longitude} | City: ${biz.city}`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

inspectMissing();
