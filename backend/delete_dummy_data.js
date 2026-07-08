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

  // 1. Mark ALL current testimonials as Rejected (so they disappear from homepage and aren't re-imported by cron)
  const tResult = await Testimonial.updateMany({}, { $set: { status: 'Rejected' } });
  console.log(`✓ Marked ${tResult.modifiedCount} testimonials as Rejected in database.`);

  // 2. Delete ALL events from database
  const eResult = await Event.deleteMany({});
  console.log(`✓ Deleted ${eResult.deletedCount} events from database.`);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

main().catch(console.error);
