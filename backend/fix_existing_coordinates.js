const mongoose = require('mongoose');
const dotenv = require('dotenv');
// Native fetch is globally available in modern Node.js environments

// Load environment variables
dotenv.config();

const Business = require('./models/Business');

const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/udtbusiness';
const apiKey = process.env.GOOGLE_MAPS_API_KEY;

async function run() {
  if (!apiKey) {
    console.error('GOOGLE_MAPS_API_KEY environment variable is not configured. Cannot fetch Place coordinates.');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    const businesses = await Business.find({});
    console.log(`Analyzing ${businesses.length} businesses...`);

    let updatedCount = 0;

    for (const biz of businesses) {
      if (biz.googlePlaceId) {
        console.log(`Business "${biz.name}" has fallback coordinates. Fetching from Google Place ID: ${biz.googlePlaceId}...`);
        
        try {
          // Attempt using New Places API
          const url = `https://places.googleapis.com/v1/places/${biz.googlePlaceId}`;
          const response = await fetch(url, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': apiKey,
              'X-Goog-FieldMask': 'location'
            }
          });
          const result = await response.json();

          let targetLat = null;
          let targetLng = null;

          if (result.location && result.location.latitude && result.location.longitude) {
            targetLat = result.location.latitude;
            targetLng = result.location.longitude;
          } else {
            // Fallback to legacy Place Details API
            const legacyUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${biz.googlePlaceId}&fields=geometry&key=${apiKey}`;
            const legacyRes = await fetch(legacyUrl);
            const legacyData = await legacyRes.json();
            if (legacyData.status === 'OK' && legacyData.result?.geometry?.location) {
              targetLat = legacyData.result.geometry.location.lat;
              targetLng = legacyData.result.geometry.location.lng;
            }
          }

          if (targetLat && targetLng) {
            console.log(`  Updating "${biz.name}" coordinates to: lat=${targetLat}, lng=${targetLng}`);
            biz.latitude = targetLat;
            biz.longitude = targetLng;
            biz.coordinates = { lat: targetLat, lng: targetLng };
            await biz.save();
            updatedCount++;
          } else {
            console.warn(`  Failed to retrieve location from Google APIs for "${biz.name}"`);
          }
        } catch (err) {
          console.error(`  Error resolving Place ID details for "${biz.name}":`, err.message);
        }
      }
    }

    console.log(`Finished updating coordinates. Updated ${updatedCount} listings.`);
    await mongoose.disconnect();
  } catch (err) {
    console.error('Migration failed:', err);
  }
}

run();
