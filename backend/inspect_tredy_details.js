const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

dotenv.config();

const mongoUri = process.env.MONGO_URI;
const jwtSecret = process.env.JWT_SECRET || 'ubt_jwt_secret_token_123456';

async function main() {
  await mongoose.connect(mongoUri);
  const admin = await User.findOne({ role: { $in: ['admin', 'superadmin'] } });
  const token = jwt.sign({ id: admin._id }, jwtSecret, { expiresIn: '1h' });

  const res = await fetch('http://localhost:5000/api/admin/businesses', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await res.json();
  const t = data.data.find(b => b.name && b.name.toLowerCase().includes('tredy trendy'));

  if (!t) {
    console.error('Tredy Trendy not found in API response!');
  } else {
    console.log('API payload fields:');
    console.log('name:', JSON.stringify(t.name));
    console.log('category:', JSON.stringify(t.category));
    console.log('description:', JSON.stringify(t.description ? t.description.substring(0, 30) + '...' : null));
    console.log('phone:', JSON.stringify(t.phone));
    console.log('pincode:', JSON.stringify(t.pincode));
    console.log('address:', JSON.stringify(t.address));
    console.log('logoUrl:', JSON.stringify(t.logoUrl));
    console.log('coverImageUrl:', JSON.stringify(t.coverImageUrl));
    console.log('galleryUrls:', Array.isArray(t.galleryUrls) ? `Array (length: ${t.galleryUrls.length})` : typeof t.galleryUrls);
    
    // Evaluate like the frontend
    const tagsDraft = Array.isArray(t.tags) && t.tags.includes('draft');
    const isApproved = t.status && t.status.toLowerCase().trim() === 'approved';
    
    const galleryCount = t.galleryUrls ? (Array.isArray(t.galleryUrls) ? t.galleryUrls.length : (typeof t.galleryUrls === 'string' ? t.galleryUrls.split(',').filter(Boolean).length : 0)) : 0;
    const logoCount = t.logoUrl ? 1 : 0;
    const coverCount = t.coverImageUrl ? 1 : 0;
    const totalPhotos = galleryCount + logoCount + coverCount;
    
    console.log('\n--- Frontend expression evaluation ---');
    console.log('tagsDraft:', tagsDraft);
    console.log('isApproved:', isApproved);
    console.log('!t.name:', !t.name);
    console.log('!t.category:', !t.category);
    console.log('!t.description:', !t.description);
    console.log('!t.phone:', !t.phone);
    console.log('!t.pincode:', !t.pincode);
    console.log('!t.address:', !t.address);
    console.log('totalPhotos:', totalPhotos);
    console.log('totalPhotos < 3:', totalPhotos < 3);
    
    const isDraft = !t.name || !t.category || !t.description || !t.phone || !t.pincode || !t.address || totalPhotos < 3;
    console.log('isDraft (before tags/approved overrides):', isDraft);
    
    let finalResult = isDraft;
    if (tagsDraft) finalResult = true;
    if (isApproved) finalResult = false;
    console.log('Final isBizDraft result:', finalResult);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
