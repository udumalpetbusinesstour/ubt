const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const Business = require('./models/Business');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/udtbusiness';

async function printAllBiz() {
  try {
    await mongoose.connect(mongoUri);
    const businesses = await Business.find({});
    console.log(`Total businesses: ${businesses.length}`);
    businesses.forEach((b, index) => {
      console.log(`${index + 1}. ID: ${b._id}, Name: "${b.name}", lat: ${b.latitude}, lng: ${b.longitude}, coords: ${JSON.stringify(b.coordinates)}`);
    });
    await mongoose.disconnect();
  } catch (e) {
    console.error(e);
  }
}

printAllBiz();
