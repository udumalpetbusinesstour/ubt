const mongoose = require('../backend/node_modules/mongoose');
const path = require('path');
const dotenv = require('../backend/node_modules/dotenv');
dotenv.config({ path: path.join(__dirname, '../backend/.env') });

async function inspectMap() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/udtbusiness');
  const Business = require('../backend/models/Business');

  const sowbarnika = await Business.find({ name: /sowbarnika/i });
  const khanda = await Business.find({ name: /khanda|kandha/i });

  console.log('--- SOWBARNIKA BUSINESSES ---');
  sowbarnika.forEach(b => {
    console.log({
      id: b._id,
      name: b.name,
      address: b.address,
      latitude: b.latitude,
      longitude: b.longitude,
      location: b.location
    });
  });

  console.log('--- KHANDA / KANDHA BUSINESSES ---');
  khanda.forEach(b => {
    console.log({
      id: b._id,
      name: b.name,
      address: b.address,
      latitude: b.latitude,
      longitude: b.longitude,
      location: b.location
    });
  });

  await mongoose.disconnect();
}
inspectMap();
