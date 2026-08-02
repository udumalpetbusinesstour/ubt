const mongoose = require('mongoose');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

dotenv.config();

const mongoUri = process.env.MONGO_URI;
const jwtSecret = process.env.JWT_SECRET || 'ubt_jwt_secret_token_123456';

async function main() {
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB.');

  const admin = await User.findOne({ role: { $in: ['admin', 'superadmin'] } });
  if (!admin) {
    console.error('No admin/superadmin user found in DB!');
    await mongoose.disconnect();
    return;
  }

  console.log(`Using admin user: ${admin.email} (${admin.role})`);
  const token = jwt.sign({ id: admin._id }, jwtSecret, { expiresIn: '1h' });

  console.log('Fetching businesses from API...');
  const res = await fetch('http://localhost:5000/api/admin/businesses', {
    headers: { 'Authorization': `Bearer ${token}` }
  });

  const data = await res.json();
  if (!data.success) {
    console.error('API call failed:', data);
  } else {
    const biz = data.data.find(b => b.name && b.name.toLowerCase().includes('tredy trendy'));
    if (!biz) {
      console.log('Tredy Trendy not found in API response!');
    } else {
      console.log('API RESPONSE FOR TREDY TRENDY:');
      console.log(JSON.stringify(biz, null, 2));
    }
  }

  await mongoose.disconnect();
}

main().catch(console.error);
