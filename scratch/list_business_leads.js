const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const mongoUri = process.env.MONGO_URI;

async function main() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.');

  const businessesColl = mongoose.connection.db.collection('businesses');
  const leadsColl = mongoose.connection.db.collection('leads');

  const businesses = await businessesColl.find({}).toArray();
  console.log(`FOUND ${businesses.length} BUSINESSES:`);
  for (const b of businesses) {
    console.log(`- Business: ${b.name} (${b._id})`);
    const leads = await leadsColl.find({ businessId: b._id }).toArray();
    console.log(`  Leads count in DB: ${leads.length}`);
    console.log(`  Leads list:`, JSON.stringify(leads, null, 2));
  }

  await mongoose.disconnect();
}

main().catch(console.error);
