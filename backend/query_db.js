const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Business = require('./models/Business');
const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/udtbusiness';

async function query() {
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // 1. Search in Business collection
    const businesses = await Business.find({
      $or: [
        { name: { $regex: /murugan|sweets/i } },
        { businessName: { $regex: /murugan|sweets/i } },
        { description: { $regex: /murugan|sweets/i } },
        { category: { $regex: /murugan|sweets/i } },
        { customCategoryName: { $regex: /murugan|sweets/i } }
      ]
    });
    console.log(`Found ${businesses.length} matching businesses:`);
    for (const b of businesses) {
      console.log(`- ID: ${b._id}, Name: "${b.name}", GooglePlaceId: "${b.googlePlaceId}", OwnerId: ${b.ownerId}`);
    }

    // 2. Search in User collection
    const User = require('./models/User');
    const users = await User.find({
      $or: [
        { fullName: { $regex: /murugan|sweets/i } },
        { name: { $regex: /murugan|sweets/i } },
        { email: { $regex: /murugan|sweets/i } }
      ]
    });
    console.log(`Found ${users.length} matching users:`);
    for (const u of users) {
      console.log(`- ID: ${u._id}, Name: "${u.fullName}", Email: "${u.email}"`);
    }

    // 3. Search in Reviews collection
    const Review = require('./models/Review');
    const reviews = await Review.find({
      $or: [
        { authorName: { $regex: /murugan|sweets/i } },
        { text: { $regex: /murugan|sweets/i } }
      ]
    });
    console.log(`Found ${reviews.length} matching reviews:`);
    for (const r of reviews) {
      console.log(`- ID: ${r._id}, Author: "${r.authorName}", Text: "${r.text}", BusinessId: ${r.businessId}`);
    }

    mongoose.disconnect();
  } catch (err) {
    console.error('Error querying:', err);
    process.exit(1);
  }
}

query();
