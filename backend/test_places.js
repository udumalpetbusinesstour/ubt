const dotenv = require('dotenv');
dotenv.config();

const apiKey = process.env.GOOGLE_MAPS_API_KEY;

async function test() {
  console.log('Testing Google Places Autocomplete API with key:', apiKey);
  try {
    const url = 'https://places.googleapis.com/v1/places:autocomplete';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify({
        input: 'Murugan Sweets',
        includedRegionCodes: ['in'],
        locationBias: {
          circle: {
            center: {
              latitude: 10.5891,
              longitude: 77.2412
            },
            radius: 35000.0
          }
        }
      })
    });
    
    const data = await response.json();
    console.log('Autocomplete Suggestions:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error:', err);
  }
}

test();
