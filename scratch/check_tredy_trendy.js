const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const mongoUri = process.env.MONGO_URI;

async function main() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.');

  const collection = mongoose.connection.db.collection('businesses');
  const b = await collection.findOne({ name: /Tredy Trendy/i });

  if (!b) {
    console.log('Business "TREDY TRENDY" not found in DB!');
  } else {
    console.log('FOUND BUSINESS:', JSON.stringify({
      name: b.name,
      category: b.category,
      description: b.description ? `${b.description.substring(0, 50)}...` : null,
      phone: b.phone,
      pincode: b.pincode,
      address: b.address,
      logoUrl: b.logoUrl,
      coverImageUrl: b.coverImageUrl,
      galleryUrls: b.galleryUrls,
      tags: b.tags,
      status: b.status
    }, null, 2));
  }

  await mongoose.disconnect();
}

main().catch(console.error);
