const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const mongoUri = process.env.MONGO_URI;

async function main() {
  await mongoose.connect(mongoUri);
  const collection = mongoose.connection.db.collection('businesses');
  const b = await collection.findOne({ _id: new mongoose.Types.ObjectId('6a574b9619895113b646c549') });

  console.log('DIRECT MONGO QUERY RESULT:');
  console.log('phone in DB:', JSON.stringify(b.phone));
  console.log('whatsapp in DB:', JSON.stringify(b.whatsapp));

  await mongoose.disconnect();
}

main().catch(console.error);
