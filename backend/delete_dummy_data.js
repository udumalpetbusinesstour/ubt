const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const mongoUri = process.env.MONGO_URI;

async function main() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.');

  const Testimonial = mongoose.connection.db.collection('testimonials');
  const Event = mongoose.connection.db.collection('events');

  // 1. Delete ALL testimonials from database
  const tResult = await Testimonial.deleteMany({});
  console.log(`✓ Deleted ${tResult.deletedCount} testimonials from database.`);

  // 2. Delete ALL events from database
  const eResult = await Event.deleteMany({});
  console.log(`✓ Deleted ${eResult.deletedCount} events from database.`);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

main().catch(console.error);
