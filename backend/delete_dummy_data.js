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

  // 1. Delete mock GMB testimonials
  const tResult = await Testimonial.deleteMany({
    authorName: { $in: ['Ramanathan K.', 'Santhosh Kumar', 'Meera Nair'] }
  });
  console.log(`✓ Deleted ${tResult.deletedCount} mock testimonials from database.`);

  // 2. Delete mock seeded events
  const eResult = await Event.deleteMany({
    title: { $in: [
      'Udumalpet Marathon 2025',
      'Arulmigu Subramanya Swamy Temple Festival',
      'Udumalpet Startup Meet 2025',
      'Carnatic Music Concert'
    ] }
  });
  console.log(`✓ Deleted ${eResult.deletedCount} mock events from database.`);

  await mongoose.disconnect();
  console.log('Disconnected from MongoDB.');
}

main().catch(console.error);
