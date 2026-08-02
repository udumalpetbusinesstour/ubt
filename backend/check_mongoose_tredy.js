const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Business = require('./models/Business');

dotenv.config();

const mongoUri = process.env.MONGO_URI;

async function main() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.');

  const results = await Business.find({ name: /Tredy Trendy/i }).populate('ownerId', 'fullName name email phone mobileNumber status role referralPoints');

  console.log(`Found ${results.length} business(es) matching "Tredy Trendy":`);
  
  results.forEach((b, idx) => {
    const bObj = b.toObject();
    const totalPhotos = (bObj.galleryUrls ? (Array.isArray(bObj.galleryUrls) ? bObj.galleryUrls.length : (typeof bObj.galleryUrls === 'string' ? bObj.galleryUrls.split(',').filter(Boolean).length : 0)) : 0) + (bObj.logoUrl ? 1 : 0) + (bObj.coverImageUrl ? 1 : 0);
    const isDraft = !bObj.name || !bObj.category || !bObj.description || !bObj.phone || !bObj.pincode || !bObj.address || totalPhotos < 3;
    
    console.log(`\n--- BUSINESS #${idx+1} ---`);
    console.log('ID:', bObj._id);
    console.log('Name:', bObj.name);
    console.log('Status:', bObj.status);
    console.log('Category:', bObj.category);
    console.log('Description Present:', !!bObj.description);
    console.log('Phone:', bObj.phone);
    console.log('Pincode:', bObj.pincode);
    console.log('Address:', bObj.address);
    console.log('Total Photos:', totalPhotos);
    console.log('Is Draft:', isDraft);
    console.log('Tags:', bObj.tags);
  });

  await mongoose.disconnect();
}

main().catch(console.error);
