require('dotenv').config();
const mongoose = require('mongoose');
const Business = require('./models/Business');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const cleanDrafts = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected.');

    const dummyRecords = await Business.find({
      $and: [
        { name: { $in: [null, undefined, '', 'undefined'] } },
        { businessName: { $in: [null, undefined, '', 'undefined'] } }
      ]
    });

    console.log(`Found ${dummyRecords.length} empty unnamed test/draft records in MongoDB.`);

    for (const d of dummyRecords) {
      console.log(`Deleting empty test record ID: ${d._id} (CreatedAt: ${d.createdAt})`);
      await Business.findByIdAndDelete(d._id);
    }

    console.log(`Successfully cleaned up ${dummyRecords.length} empty test records.`);
    process.exit(0);
  } catch (err) {
    console.error('Error cleaning dummy records:', err);
    process.exit(1);
  }
};

cleanDrafts();
