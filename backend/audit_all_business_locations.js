require('dotenv').config();
const mongoose = require('mongoose');
const Business = require('./models/Business');

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI;

const auditLocations = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB Connected.');

    const businesses = await Business.find({});
    console.log(`Auditing map coordinates & location data for ${businesses.length} total business directories...\n`);

    const missingCoords = [];
    const outOfBoundsCoords = [];
    const missingAddress = [];
    const validCoords = [];

    // Udumalpet & surrounding Tamil Nadu regional bounding box:
    // Latitude roughly 10.30 to 10.90, Longitude roughly 77.00 to 77.50
    const MIN_LAT = 10.30;
    const MAX_LAT = 10.90;
    const MIN_LNG = 77.00;
    const MAX_LNG = 77.50;

    for (const biz of businesses) {
      const bizName = biz.name || biz.businessName || 'Unnamed Business';
      const lat = biz.latitude || (biz.coordinates ? biz.coordinates.lat : null);
      const lng = biz.longitude || (biz.coordinates ? biz.coordinates.lng : null);

      if (!lat || !lng || lat === 0 || lng === 0) {
        missingCoords.push({
          id: biz._id,
          name: bizName,
          locality: biz.locality,
          address: biz.address || biz.streetAddress
        });
      } else if (lat < MIN_LAT || lat > MAX_LAT || lng < MIN_LNG || lng > MAX_LNG) {
        outOfBoundsCoords.push({
          id: biz._id,
          name: bizName,
          lat,
          lng,
          locality: biz.locality,
          address: biz.address || biz.streetAddress
        });
      } else {
        validCoords.push({
          id: biz._id,
          name: bizName,
          lat,
          lng
        });
      }

      if (!biz.address && !biz.streetAddress && !biz.locality) {
        missingAddress.push({
          id: biz._id,
          name: bizName
        });
      }
    }

    console.log('--- AUDIT RESULTS SUMMARY ---');
    console.log(`✅ Total Valid Udumalpet Coordinates: ${validCoords.length}`);
    console.log(`⚠️ Missing / Zero Coordinates: ${missingCoords.length}`);
    console.log(`🚨 Out-of-Bounds Coordinates (outside Udumalpet area): ${outOfBoundsCoords.length}`);
    console.log(`📍 Missing Address Details: ${missingAddress.length}\n`);

    if (missingCoords.length > 0) {
      console.log('--- MISSING COORDINATES LIST ---');
      missingCoords.forEach((b, i) => {
        console.log(`${i + 1}. "${b.name}" (Locality: ${b.locality || 'N/A'})`);
      });
      console.log('--------------------------------\n');
    }

    if (outOfBoundsCoords.length > 0) {
      console.log('--- OUT-OF-BOUNDS COORDINATES LIST ---');
      outOfBoundsCoords.forEach((b, i) => {
        console.log(`${i + 1}. "${b.name}" -> Lat: ${b.lat}, Lng: ${b.lng} (Address: ${b.address || 'N/A'})`);
      });
      console.log('--------------------------------------\n');
    }

    process.exit(0);
  } catch (err) {
    console.error('Audit failed:', err);
    process.exit(1);
  }
};

auditLocations();
