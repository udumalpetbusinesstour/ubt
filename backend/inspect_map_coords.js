require('dotenv').config();
const mongoose = require('mongoose');
const Business = require('./models/Business');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const inspectCoords = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected.');

    const mallis = await Business.find({ 
      $or: [
        { name: { $regex: 'Mallis', $options: 'i' } },
        { businessName: { $regex: 'Mallis', $options: 'i' } }
      ]
    });

    const adhithyaa = await Business.find({ 
      $or: [
        { name: { $regex: 'Adhithyaa', $options: 'i' } },
        { businessName: { $regex: 'Adhithyaa', $options: 'i' } }
      ]
    });

    console.log('\n--- MALLIS HOME CARE IN MONODB ---');
    for (const b of mallis) {
      console.log(`ID: ${b._id}`);
      console.log(`Name: ${b.name || b.businessName}`);
      console.log(`Address: ${b.address || b.streetAddress}`);
      console.log(`Locality: ${b.locality} | City: ${b.city} | Pincode: ${b.pincode}`);
      console.log(`googleMapsLocation: ${b.googleMapsLocation}`);
      console.log(`googleBusinessLink: ${b.googleBusinessLink}`);
      console.log(`Latitude: ${b.latitude} | Longitude: ${b.longitude}`);
      console.log(`Coordinates Object:`, b.coordinates);
      console.log('-----------------------------------');
    }

    console.log('\n--- ADHITHYAA AGENCIES IN MONODB ---');
    for (const b of adhithyaa) {
      console.log(`ID: ${b._id}`);
      console.log(`Name: ${b.name || b.businessName}`);
      console.log(`Address: ${b.address || b.streetAddress}`);
      console.log(`Locality: ${b.locality} | City: ${b.city} | Pincode: ${b.pincode}`);
      console.log(`googleMapsLocation: ${b.googleMapsLocation}`);
      console.log(`googleBusinessLink: ${b.googleBusinessLink}`);
      console.log(`Latitude: ${b.latitude} | Longitude: ${b.longitude}`);
      console.log(`Coordinates Object:`, b.coordinates);
      console.log('-----------------------------------');
    }

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

inspectCoords();
