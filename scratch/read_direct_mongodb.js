const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const mongoUri = process.env.MONGO_URI;

async function main() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB via Mongoose connection.');

  const collection = mongoose.connection.db.collection('businesses');
  const documents = await collection.find({}, { projection: { name: 1, category: 1, type: 1, categories: 1 } }).sort({ name: 1 }).toArray();

  console.log('BUSINESS CATEGORY MAPPING REPORT (RAW MONGO VIA MONGOOSE)\n');
  console.log('| Business Name | Legacy Parent | Legacy Subcategory | Native Categories Array Elements |');
  console.log('|---|---|---|---|');

  documents.forEach(b => {
    const cats = b.categories || [];
    const catsStr = cats.map(c => `[${c.category} -> ${c.type} (${c.categoryStatus || 'N/A'})]`).join(', ');
    console.log(`| ${b.name} | ${b.category || 'N/A'} | ${b.type || 'N/A'} | ${catsStr || 'Empty'} |`);
  });

  await mongoose.disconnect();
}

main().catch(console.error);
