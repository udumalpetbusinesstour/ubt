const mongoose = require('../backend/node_modules/mongoose');
const path = require('path');
const dotenv = require('../backend/node_modules/dotenv');
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

async function searchAll() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/udtbusiness');
  const Business = require('../backend/models/Business');

  const all = await Business.find({}, { name: 1, address: 1, latitude: 1, longitude: 1, location: 1 });
  
  const sowMatches = all.filter(b => b.name && /sow|barnika|tex|silk/i.test(b.name));
  console.log('--- SOW MATCHES ---');
  sowMatches.forEach(b => console.log(b._id, b.name, 'Lat:', b.latitude, 'Lng:', b.longitude, 'Addr:', b.address));

  const kandhaMatches = all.filter(b => b.name && /khanda|kandha/i.test(b.name));
  console.log('--- KANDHA MATCHES ---');
  kandhaMatches.forEach(b => console.log(b._id, b.name, 'Lat:', b.latitude, 'Lng:', b.longitude, 'Addr:', b.address));

  await mongoose.disconnect();
}
searchAll();
