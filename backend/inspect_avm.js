require('dotenv').config();
const mongoose = require('mongoose');
const Business = require('./models/Business');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const inspectAvm = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected.');

    const avmList = await Business.find({
      $or: [
        { name: { $regex: 'AVM', $options: 'i' } },
        { businessName: { $regex: 'AVM', $options: 'i' } }
      ]
    });

    console.log(`Found ${avmList.length} business(es) matching AVM:\n`);

    for (const b of avmList) {
      console.log(`ID: ${b._id}`);
      console.log(`Name: ${b.name || b.businessName}`);
      console.log(`logoUrl: ${b.logoUrl}`);
      console.log(`coverImageUrl: ${b.coverImageUrl}`);
      console.log(`galleryUrls:`, b.galleryUrls);
      console.log(`photos:`, b.photos);
      console.log(`rawGooglePhotoUrl: ${b.rawGooglePhotoUrl}`);
      console.log(`createdAt: ${b.createdAt}`);
      console.log('-------------------------------------------');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

inspectAvm();
