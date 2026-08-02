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
  const tts = data.data.filter(b => b.name && b.name.toLowerCase().includes('tredy trendy'));
  console.log(`Found ${tts.length} item(s) in API response:`);
  tts.forEach((t, i) => {
    console.log(`\n--- ITEM #${i+1} ---`);
    console.log('ID:', t._id);
    console.log('Name:', t.name);
    console.log('Phone:', JSON.stringify(t.phone));
    console.log('WhatsApp:', JSON.stringify(t.whatsapp));
    console.log('Description:', JSON.stringify(t.description ? t.description.substring(0, 30) + '...' : null));
    console.log('Gallery URLs count:', t.galleryUrls ? t.galleryUrls.length : null);
    console.log('Logo URL:', JSON.stringify(t.logoUrl));
    console.log('Cover Image:', JSON.stringify(t.coverImageUrl));
  });

  await mongoose.disconnect();
}

main().catch(console.error);
