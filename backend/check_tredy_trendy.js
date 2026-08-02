const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const mongoUri = process.env.MONGO_URI;

async function main() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.');

  const collection = mongoose.connection.db.collection('businesses');
  const b = await collection.findOne({ name: /Tredy Trendy/i });

  if (!b) {
    console.log('Business "TREDY TRENDY" not found in DB!');
  } else {
    const totalPhotos = (b.galleryUrls ? (Array.isArray(b.galleryUrls) ? b.galleryUrls.length : (typeof b.galleryUrls === 'string' ? b.galleryUrls.split(',').filter(Boolean).length : 0)) : 0) + (b.logoUrl ? 1 : 0) + (b.coverImageUrl ? 1 : 0);
    
    console.log('--- IS DRAFT CRITERIA EVALUATION ---');
    console.log('!b.name:', !b.name, `(Value: "${b.name}")`);
    console.log('!b.category:', !b.category, `(Value: "${b.category}")`);
    console.log('!b.description:', !b.description, `(Value: "${b.description ? b.description.substring(0, 30) + '...' : ''}")`);
    console.log('!b.phone:', !b.phone, `(Value: "${b.phone}")`);
    console.log('!b.pincode:', !b.pincode, `(Value: "${b.pincode}")`);
    console.log('!b.address:', !b.address, `(Value: "${b.address}")`);
    console.log('totalPhotos:', totalPhotos, `(logo: ${b.logoUrl ? 1 : 0}, cover: ${b.coverImageUrl ? 1 : 0}, gallery: ${b.galleryUrls ? b.galleryUrls.length : 0})`);
    console.log('totalPhotos < 3:', totalPhotos < 3);
    
    const isDraft = !b.name || !b.category || !b.description || !b.phone || !b.pincode || !b.address || totalPhotos < 3;
    console.log('FINAL isBizDraft Result:', isDraft);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
