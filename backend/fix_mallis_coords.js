require('dotenv').config();
const mongoose = require('mongoose');
const Business = require('./models/Business');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const fixMallisCoords = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected.');

    // Plus Code H7P3+8R Udumalaipettai exact coordinates:
    // Lat: 10.583203, Lng: 77.254641 (Santhosh Complex, Aishwarya Nagar - 5 meters from Adhithyaa Agencies)
    const newLat = 10.583203;
    const newLng = 77.254641;

    const result = await Business.updateMany(
      {
        $or: [
          { name: { $regex: 'Mallis', $options: 'i' } },
          { businessName: { $regex: 'Mallis', $options: 'i' } }
        ]
      },
      {
        $set: {
          latitude: newLat,
          longitude: newLng,
          'coordinates.lat': newLat,
          'coordinates.lng': newLng,
          googleMapsLocation: 'https://maps.google.com/?q=10.583203,77.254641',
          googleBusinessLink: 'https://maps.google.com/?q=10.583203,77.254641'
        }
      }
    );

    console.log(`Updated ${result.modifiedCount} Mallis Home Care record(s) with exact coordinates (Lat: ${newLat}, Lng: ${newLng}).`);
    process.exit(0);
  } catch (err) {
    console.error('Error updating Mallis coordinates:', err);
    process.exit(1);
  }
};

fixMallisCoords();
