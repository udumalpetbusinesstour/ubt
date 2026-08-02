const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const mongoUri = process.env.MONGO_URI;

async function main() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.');

  const collection = mongoose.connection.db.collection('users');
  const documents = await collection.find({}, { projection: { email: 1, role: 1, isVerified: 1, status: 1 } }).toArray();

  console.log('USERS IN DATABASE:');
  console.log(JSON.stringify(documents, null, 2));

  await mongoose.disconnect();
}

main().catch(console.error);
