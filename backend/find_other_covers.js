require('dotenv').config();
const mongoose = require('mongoose');
const Business = require('./models/Business');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const checkCovers = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    const customCovers = await Business.find({
      coverImageUrl: { $exists: true, $ne: null, $ne: '' }
    });

    console.log(`Found ${customCovers.length} business(es) with custom uploaded cover images:`);
    customCovers.forEach(b => {
      console.log(`- "${b.name || b.businessName}": ${b.coverImageUrl}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkCovers();
