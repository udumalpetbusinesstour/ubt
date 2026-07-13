const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const Review = require('../models/Review');
const Category = require('../models/Category');
const Lead = require('../models/Lead');
const { protect } = require('../middleware/auth');

const escapeRegex = (string) => string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

// Helper to scrape email address from website or fallback to host domain guess
const scrapeEmail = async (url) => {
  if (!url) return '';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000); // 2 second timeout
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return '';
    const text = await res.text();
    const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
    if (matches && matches.length > 0) {
      const excludeSuffixes = ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', 'bootstrap', 'jquery', 'wix', 'wordpress'];
      const found = matches.find(email => {
        const e = email.toLowerCase();
        return !excludeSuffixes.some(suffix => e.includes(suffix));
      });
      if (found) return found;
    }
  } catch (err) {
    console.warn(`[Autofill Email Scraper] Error scraping ${url}:`, err.message);
  }
  return '';
};

// Helper to identify public sector / governmental organizations
const isPublicSector = (types, name = '', category = '', parentCategory = '') => {
  const govTypes = [
    'local_government_office', 'government_office', 'police', 'hospital', 
    'bank', 'school', 'courthouse', 'city_hall', 'embassy', 'fire_station', 
    'post_office', 'library', 'primary_school', 'secondary_school', 'university'
  ];
  if (types && Array.isArray(types) && types.some(t => govTypes.includes(t))) {
    return true;
  }
  
  const lowerName = (name || '').toLowerCase();
  const govKeywords = ['taluk', 'municipality', 'police station', 'collectorate', 'government hospital', 'govt hospital', 'post office', 'sub registrar'];
  if (govKeywords.some(kw => lowerName.includes(kw))) {
    return true;
  }

  const lowerParent = (parentCategory || '').toLowerCase();
  const lowerCat = (category || '').toLowerCase();
  const govParents = ['governmental organisations', 'government organisations', 'governmental organisation', 'government organisation', 'public sector'];
  if (govParents.includes(lowerParent)) return true;
  
  const govCats = ['taluk office', 'municipality', 'police stations', 'police station', 'hospitals', 'hospital', 'banks', 'bank', 'schools', 'school'];
  if (govCats.includes(lowerCat)) return true;

  return false;
};

// Helper to dynamically check and auto-expire a business subscription in the database
const checkAndExpireBusiness = async (business) => {
  if (!business) return business;
  const now = new Date();
  if (business.subscriptionExpiry && new Date(business.subscriptionExpiry) < now) {
    const Subscription = require('../models/Subscription');
    const queuedSub = await Subscription.findOne({
      businessId: business._id,
      status: 'queued'
    }).sort({ startDate: 1 });

    if (queuedSub) {
      queuedSub.status = 'active';
      await queuedSub.save();

      // Mark other active plans for this business as expired
      await Subscription.updateMany(
        { businessId: business._id, status: 'active', _id: { $ne: queuedSub._id } },
        { $set: { status: 'expired' } }
      );

      business.subscriptionStatus = 'active';
      business.subscriptionExpiry = queuedSub.endDate;
      business.isPremium = true;
      await business.save();
      console.log(`[Auto-Activate Queued] Activated queued subscription for business "${business.name}" (new expiry: ${business.subscriptionExpiry})`);
    } else {
      if (business.subscriptionStatus === 'active') {
        business.subscriptionStatus = 'expired';
        business.isPremium = false;
        business.featured = false; // Turn off featured badges
        await business.save();
        console.log(`[Auto-Expire] Automatically expired subscription for business "${business.name}" (expired on ${business.subscriptionExpiry})`);
      }
    }
  }
  return business;
};

// Synchronize branches as child Business documents
async function syncBranches(parentBusiness, branchesData, userRole) {
  if (!branchesData || !Array.isArray(branchesData)) return;

  const existingBranches = await Business.find({ parentBusinessId: parentBusiness._id });
  const existingIds = existingBranches.map(b => b._id.toString());
  const incomingIds = [];

  const status = userRole === 'admin' ? 'Approved' : 'Pending Verification';

  for (const b of branchesData) {
    const bId = b._id || b.id;
    const branchFields = {
      name: b.name,
      businessName: b.name,
      address: b.address,
      phone: b.phone,
      whatsapp: b.whatsapp || parentBusiness.whatsapp,
      email: b.email || parentBusiness.email,
      website: b.website || parentBusiness.website,
      instagram: b.instagram || parentBusiness.instagram,
      facebook: b.facebook || parentBusiness.facebook,
      googleMapsLocation: b.googleMapsLocation,
      googleBusinessLink: b.googleBusinessLink,
      workingHours: b.workingHours,
      branchManagerName: b.branchManagerName,
      logoUrl: b.logoUrl || '',
      coverImageUrl: b.coverImageUrl || '',
      galleryUrls: b.galleryUrls || [],
      latitude: b.latitude || b.coordinates?.lat || 10.5891,
      longitude: b.longitude || b.coordinates?.lng || 77.2412,
      coordinates: {
        lat: b.latitude || b.coordinates?.lat || 10.5891,
        lng: b.longitude || b.coordinates?.lng || 77.2412
      },
      category: parentBusiness.category,
      categoryId: parentBusiness.categoryId,
      type: parentBusiness.type,
      ownerId: parentBusiness.ownerId,
      parentBusinessId: parentBusiness._id,
      businessId: parentBusiness._id,
      status: b.status || status,
      services: b.services || [],
      brands: b.brands || [],
      highlights: b.highlights || [],
      languagesKnown: b.languagesKnown || '',
      serviceArea: b.serviceArea || '',
      yearEstablished: b.yearEstablished,
      employeeCount: b.employeeCount,
      gstNumber: b.gstNumber,
      timings: b.timings,
    };

    if (bId && existingIds.includes(bId.toString())) {
      incomingIds.push(bId.toString());
      await Business.findByIdAndUpdate(bId, branchFields, { new: true });
    } else {
      const newBranch = await Business.create(branchFields);
      incomingIds.push(newBranch._id.toString());
    }
  }

  // Delete branches that are no longer in the list
  const toDelete = existingIds.filter(id => !incomingIds.includes(id));
  if (toDelete.length > 0) {
    await Business.deleteMany({ _id: { $in: toDelete } });
  }
}

// Allowed Udumalpet division pincodes and corresponding valid addresses for fraud verification
const validAddressesMap = {
  '642126': [
    'Head Post Office Road, Udumalpet Main Town, Tamil Nadu - 642126',
    'Bazaar Street, Udumalpet Main Town, Tamil Nadu - 642126',
    'Eripalayam Main Road, Udumalpet Main Town, Tamil Nadu - 642126',
    'Dharapuram Road, Udumalpet Main Town, Tamil Nadu - 642126',
    'Gandhi Nagar Main Road, Udumalpet Main Town, Tamil Nadu - 642126'
  ],
  '642207': [
    'Erisinampatti Main Road, Pungamuthur, Tamil Nadu - 642207',
    'Devanurpudur Road, Pungamuthur, Tamil Nadu - 642207',
    'Vilamarathupatti Junction, Pungamuthur, Tamil Nadu - 642207',
    'Udukkampalayam Village, Pungamuthur, Tamil Nadu - 642207'
  ],
  '642154': [
    'Bodipatti Panchayat Ground Road, Bodipatti, Tamil Nadu - 642154',
    'Gandhi Nagar Road East, Udumalpet, Tamil Nadu - 642154',
    'Andiyagoundanur Village Road, Udumalpet, Tamil Nadu - 642154',
    'Kuralkuttai Road, Bodipatti, Tamil Nadu - 642154',
    'Thumbalapatti Village, Udumalpet, Tamil Nadu - 642154'
  ],
  '642112': [
    'Thirumoorthi Nagar Main Road, Dhali, Tamil Nadu - 642112',
    'Jallipatti Village Road, Dhali, Tamil Nadu - 642112',
    'Manupatti Bus Stop, Dhali, Tamil Nadu - 642112',
    'Kurichikottai Road, Dhali, Tamil Nadu - 642112'
  ],
  '642205': [
    'Kongalnagaram Main Road, Pethappampatti, Tamil Nadu - 642205',
    'Poosaripatti Village Road, Pethappampatti, Tamil Nadu - 642205',
    'Dhottampatti Road, Pethappampatti, Tamil Nadu - 642205'
  ],
  '642122': [
    'Anthiyur Road, Poolankinar, Tamil Nadu - 642122',
    'Ganapathipalayam Road, Poolankinar, Tamil Nadu - 642122',
    'Kodingium Village, Poolankinar, Tamil Nadu - 642122'
  ],
  '642204': [
    'Kolumam Main Road, Kolumam, Tamil Nadu - 642204',
    'Bazaar Street, Komaralingam, Tamil Nadu - 642204',
    'Samarayapatti Village Road, Komaralingam, Tamil Nadu - 642204',
    'Pappankulam Road, Kolumam, Tamil Nadu - 642204'
  ],
  '642201': [
    'Amandakadavoo Road, Gudimangalam, Tamil Nadu - 642201',
    'Kondampatti Road, Gudimangalam, Tamil Nadu - 642201',
    'Kottamangalam Road, Gudimangalam, Tamil Nadu - 642201'
  ],
  '642203': [
    'Kadathur Main Road, Kaniyur, Tamil Nadu - 642203',
    'Myvadi Junction Road, Kaniyur, Tamil Nadu - 642203',
    'Thungavi Road, Kaniyur, Tamil Nadu - 642203'
  ],
  '642102': [
    'Kallapuram Village Road, Amaravathi Nagar, Tamil Nadu - 642102',
    'Amaravathi Dam Area Road, Amaravathi Nagar, Tamil Nadu - 642102'
  ],
  '642128': [
    'Venkatesa Mills Colony, Udumalpet, Tamil Nadu - 642128',
    'S V Puram Post Road, Udumalpet, Tamil Nadu - 642128',
    'Pollachi Road, Udumalpet, Tamil Nadu - 642128'
  ],
  '642113': [
    'Solamadevi Road, Madathukulam, Tamil Nadu - 642113',
    'Sarkarkannadipudur Main Road, Madathukulam, Tamil Nadu - 642113'
  ],
  '642206': [
    'Aathukinathupatti Road, Poolavadi, Tamil Nadu - 642206',
    'Munduvelampatti Village, Poolavadi, Tamil Nadu - 642206'
  ],
  '642132': [
    'Dheepalapatti Village Road, Valavadi, Tamil Nadu - 642132',
    'Sundakkampalayam Road, Valavadi, Tamil Nadu - 642132'
  ],
  '642111': [
    'Agrahara Kannadiputhur Main Road, Tamil Nadu - 642111',
    'Krishnapuram Village Road, Tamil Nadu - 642111'
  ]
};

const allowedPincodes = Object.keys(validAddressesMap);

// Haversine distance calculator
function getHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// ==========================================
// GEOCODING & BOUNDARY VALIDATION
// ==========================================
// This function validates that a business address falls within our permitted 35km radius 
// around Udumalpet's town center (10.5891, 77.2412) using the Haversine distance formula.
//
// API Integration:
// - Uses the Google Geocoding API to resolve the address string into latitude/longitude coordinates.
// - Secures the query with the GOOGLE_MAPS_API_KEY environment variable.
// - Supports a local mock fallback in case the API key is not configured in .env.
async function validateAddressAndBoundary(address, pincode, userLat, userLng) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const udtCenter = { lat: 10.5891, lng: 77.2412 };
  const { APPROVED_PINCODES } = require('../constants/pincodes');
  
  if (!APPROVED_PINCODES.includes(pincode)) {
    return {
      isValid: false,
      message: `Pincode "${pincode}" is outside Udumalpet operational boundaries. Authorized Udumalpet pincodes are: ${APPROVED_PINCODES.join(', ')}.`
    };
  }

  const latVal = parseFloat(userLat);
  const lngVal = parseFloat(userLng);

  let lat = !isNaN(latVal) ? latVal : udtCenter.lat;
  let lng = !isNaN(lngVal) ? lngVal : udtCenter.lng;

  if (!address || !address.trim()) {
    return {
      isValid: true,
      lat,
      lng
    };
  }

  // Determine if the coordinates passed in are fallback defaults.
  // If they are fallback defaults (or close to them, or not provided), we want to geocode to get a better location.
  // If they are custom coordinates (e.g. from Google Place Details), we skip geocoding to preserve their precision.
  const isFallback = (
    isNaN(latVal) || isNaN(lngVal) ||
    (latVal === 10.585 && lngVal === 77.251) ||
    (latVal === 10.5891 && lngVal === 77.2412) ||
    (latVal === 0 && lngVal === 0)
  );

  if (apiKey && isFallback) {
    try {
      const fullAddressQuery = `${address}, Tamil Nadu, India, ${pincode}`;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddressQuery)}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        const location = result.geometry.location;
        lat = location.lat;
        lng = location.lng;

        let geocodedPincode = '';
        for (const comp of result.address_components) {
          if (comp.types && comp.types.includes('postal_code')) {
            geocodedPincode = comp.long_name;
            break;
          }
        }

        if (geocodedPincode && geocodedPincode !== pincode && !APPROVED_PINCODES.includes(geocodedPincode)) {
          return {
            isValid: false,
            message: `Geocoded address postal code (${geocodedPincode}) is not within the approved Udumalpet region.`
          };
        }
      } else {
        console.warn(`Geocoding API returned status: ${data.status || 'EMPTY'}. Using fallback coordinates.`);
      }
    } catch (error) {
      console.error('Error during Geocoding API call:', error.message);
    }
  }

  const distance = getHaversineDistance(lat, lng, udtCenter.lat, udtCenter.lng);
  if (distance > 35) {
    return {
      isValid: false,
      message: `The address location is ${distance.toFixed(1)} km away from Udumalpet center, which exceeds the allowed 35 km service area.`
    };
  }

  return {
    isValid: true,
    lat,
    lng
  };
}

// Google Autocomplete Mock Suggestions
const mockSuggestions = [
  {
    description: "R.K. Electricals, Head Post Office Road, Udumalpet Main Town, Tamil Nadu - 642126",
    place_id: "mock_place_rk_electricals",
    structured_formatting: {
      main_text: "R.K. Electricals",
      secondary_text: "Head Post Office Road, Udumalpet Main Town, Tamil Nadu - 642126"
    }
  },
  {
    description: "Hotel Annapoorna, Coimbatore Road, Udumalpet, Tamil Nadu - 642128",
    place_id: "mock_place_hotel_annapoorna",
    structured_formatting: {
      main_text: "Hotel Annapoorna",
      secondary_text: "Coimbatore Road, Udumalpet, Tamil Nadu - 642128"
    }
  },
  {
    description: "Royal Textiles, Bazaar Street, Udumalpet Main Town, Tamil Nadu - 642126",
    place_id: "mock_place_royal_textiles",
    structured_formatting: {
      main_text: "Royal Textiles",
      secondary_text: "Bazaar Street, Udumalpet Main Town, Tamil Nadu - 642126"
    }
  },
  {
    description: "Sippi Opticals, 0, Katcheri St, opposite Udumalaipettai, Udumalpet Main Town, Tamil Nadu - 642126",
    place_id: "mock_place_sippi_opticals",
    structured_formatting: {
      main_text: "Sippi Opticals",
      secondary_text: "0, Katcheri St, opposite Udumalaipettai, Udumalpet Main Town, Tamil Nadu - 642126"
    }
  },
  {
    description: "Control N - CN Technologies Private Limited, Sippi Opticals, 0, Katcheri St, Udumalpet Main Town, Tamil Nadu - 642126",
    place_id: "mock_place_cn_technologies",
    structured_formatting: {
      main_text: "Control N - CN Technologies Private Limited",
      secondary_text: "Sippi Opticals, 0, Katcheri St, Udumalpet Main Town, Tamil Nadu - 642126"
    }
  },
  {
    description: "Dhosaikadai.com, Trigger Showroom, near Aishwarya Nagar, Gandhi Nagar, Udumalaipettai, Tamil Nadu - 642154",
    place_id: "mock_place_dhosaikadai",
    structured_formatting: {
      main_text: "Dhosaikadai.com",
      secondary_text: "Trigger Showroom, near Aishwarya Nagar, Gandhi Nagar, Udumalaipettai, Tamil Nadu - 642154"
    }
  },
  {
    description: "Udumalaipettai Taluk Office, Udumalpet Main Town, Tamil Nadu - 642126",
    place_id: "mock_place_udumalaipettai_taluk_office",
    structured_formatting: {
      main_text: "Udumalaipettai Taluk Office",
      secondary_text: "Udumalpet Main Town, Tamil Nadu - 642126"
    }
  }
];

// Google Address Autocomplete Mock Suggestions
const mockAddressSuggestions = [
  {
    description: "Head Post Office Road, Udumalpet Main Town, Tamil Nadu - 642126",
    place_id: "mock_addr_head_post_office",
    structured_formatting: {
      main_text: "Head Post Office Road",
      secondary_text: "Udumalpet Main Town, Tamil Nadu - 642126"
    }
  },
  {
    description: "Bazaar Street, Udumalpet Main Town, Tamil Nadu - 642126",
    place_id: "mock_addr_bazaar_street",
    structured_formatting: {
      main_text: "Bazaar Street",
      secondary_text: "Udumalpet Main Town, Tamil Nadu - 642126"
    }
  },
  {
    description: "Coimbatore Road, Udumalpet, Tamil Nadu - 642128",
    place_id: "mock_addr_coimbatore_road",
    structured_formatting: {
      main_text: "Coimbatore Road",
      secondary_text: "Udumalpet, Tamil Nadu - 642128"
    }
  }
];

// Google Place Details Mock Data
const mockDetails = {
  mock_place_udumalaipettai_taluk_office: {
    name: "Udumalaipettai Taluk Office",
    address: "Udumalaipettai Taluk Office, Udumalpet Main Town, Tamil Nadu - 642126",
    phone: "+91 4252 220261",
    website: "https://tiruppur.nic.in",
    email: "talukoffice.udt@tn.gov.in",
    latitude: 10.585,
    longitude: 77.251,
    pincode: "642126",
    locality: "Udumalpet Town",
    googlePlaceId: "mock_place_udumalaipettai_taluk_office",
    googleRating: 4.5,
    googleReviewsCount: 15,
    googleReviews: [
      { authorName: "Local Citizen", rating: 5, text: "Official government services. Helpful staff and well-maintained facility.", createdAt: new Date() },
      { authorName: "Ramesh Kumar", rating: 4, text: "Typical government office, queue is long but process gets completed.", createdAt: new Date() }
    ],
    openingHours: {
      Monday: "10:00 AM - 5:45 PM",
      Tuesday: "10:00 AM - 5:45 PM",
      Wednesday: "10:00 AM - 5:45 PM",
      Thursday: "10:00 AM - 5:45 PM",
      Friday: "10:00 AM - 5:45 PM",
      Saturday: "Closed",
      Sunday: "Closed"
    }
  },
  mock_place_sippi_opticals: {
    name: "Sippi Opticals",
    address: "0, Katcheri St, opposite Udumalaipettai, Udumalpet Main Town, Tamil Nadu - 642126",
    phone: "+91 95970 30291",
    website: "https://sippiopticals.business.site",
    email: "sippiopticals@gmail.com",
    latitude: 10.5878,
    longitude: 77.2465,
    pincode: "642126",
    locality: "Bazaar Street",
    googlePlaceId: "mock_place_sippi_opticals",
    googleRating: 4.6,
    googleReviewsCount: 85,
    googleReviews: [
      { authorName: "Kavin Prasad", rating: 5, text: "Excellent collection of frames and lenses. Fast service.", createdAt: new Date() },
      { authorName: "Sneha R", rating: 4, text: "Affordable pricing and very professional testing.", createdAt: new Date() }
    ],
    openingHours: {
      Monday: "9:00 AM - 8:00 PM",
      Tuesday: "9:00 AM - 8:00 PM",
      Wednesday: "9:00 AM - 8:00 PM",
      Thursday: "9:00 AM - 8:00 PM",
      Friday: "9:00 AM - 8:00 PM",
      Saturday: "9:00 AM - 8:00 PM",
      Sunday: "Closed"
    }
  },
  mock_place_cn_technologies: {
    name: "Control N - CN Technologies Private Limited",
    address: "Sippi Opticals, 0, Katcheri St, opposite Udumalaipettai, Udumalpet Main Town, Tamil Nadu - 642126",
    phone: "+91 89257 28260",
    website: "https://controln.in",
    email: "contact@controln.in",
    latitude: 10.585,
    longitude: 77.251,
    pincode: "642126",
    locality: "Udumalpet Town",
    googlePlaceId: "mock_place_cn_technologies",
    googleRating: 4.9,
    googleReviewsCount: 83,
    googleReviews: [
      { authorName: "Harish", rating: 5, text: "Best IT software consulting agency in Udumalpet.", createdAt: new Date() }
    ],
    openingHours: {
      Monday: "9:00 AM - 6:00 PM",
      Tuesday: "9:00 AM - 6:00 PM",
      Wednesday: "9:00 AM - 6:00 PM",
      Thursday: "9:00 AM - 6:00 PM",
      Friday: "9:00 AM - 6:00 PM",
      Saturday: "9:00 AM - 1:00 PM",
      Sunday: "Closed"
    }
  },
  mock_place_dhosaikadai: {
    name: "Dhosaikadai.com",
    address: "Trigger Showroom, near Aishwarya Nagar, Gandhi Nagar, Udumalaipettai, Tamil Nadu - 642154",
    phone: "+91 95970 30291",
    website: "https://www.dhosaikadai.com",
    email: "info@dhosaikadai.com",
    latitude: 10.585,
    longitude: 77.251,
    pincode: "642154",
    locality: "Udumalpet Town",
    googlePlaceId: "mock_place_dhosaikadai",
    googleRating: 4.7,
    googleReviewsCount: 31,
    googleReviews: [
      { authorName: "Mithra", rating: 5, text: "Fabulous taste of local dhosai!", createdAt: new Date() }
    ],
    openingHours: {
      Monday: "7:00 PM - 10:30 PM",
      Tuesday: "7:00 PM - 10:30 PM",
      Wednesday: "7:00 PM - 10:30 PM",
      Thursday: "7:00 PM - 10:30 PM",
      Friday: "7:00 PM - 10:30 PM",
      Saturday: "7:00 PM - 10:30 PM",
      Sunday: "Closed"
    }
  },
  mock_place_rk_electricals: {
    name: "R.K. Electricals",
    address: "Head Post Office Road, Udumalpet Main Town, Tamil Nadu - 642126",
    phone: "+91 98765 43210",
    website: "https://rkelectricals.com",
    email: "sales@rkelectricals.com",
    latitude: 10.5895,
    longitude: 77.2420,
    pincode: "642126",
    locality: "Head Post Office Road",
    googlePlaceId: "mock_place_rk_electricals",
    googleRating: 4.5,
    googleReviewsCount: 120,
    googleReviews: [
      { authorName: "Arun Kumar", rating: 5, text: "Excellent shop for electrical supplies. Reasonable prices and good behavior.", createdAt: new Date() },
      { authorName: "Meena S", rating: 4, text: "Good range of electric accessories. Very cooperative staff.", createdAt: new Date() }
    ],
    openingHours: {
      Monday: "9:00 AM - 8:00 PM",
      Tuesday: "9:00 AM - 8:00 PM",
      Wednesday: "9:00 AM - 8:00 PM",
      Thursday: "9:00 AM - 8:00 PM",
      Friday: "9:00 AM - 8:00 PM",
      Saturday: "9:00 AM - 8:00 PM",
      Sunday: "Closed"
    }
  },
  mock_place_hotel_annapoorna: {
    name: "Hotel Annapoorna",
    address: "Coimbatore Road, Udumalpet, Tamil Nadu - 642128",
    phone: "+91 94432 10987",
    website: "https://hotelannapoornaudt.com",
    email: "support@hotelannapoornaudt.com",
    latitude: 10.5921,
    longitude: 77.2398,
    pincode: "642128",
    locality: "coimbatore road",
    googlePlaceId: "mock_place_hotel_annapoorna",
    googleRating: 4.2,
    googleReviewsCount: 850,
    googleReviews: [
      { authorName: "Karthik R", rating: 5, text: "Best South Indian breakfast in Udumalpet! Sambar is outstanding.", createdAt: new Date() },
      { authorName: "Divya N", rating: 4, text: "Tasty vegetarian food, quick service, but crowded during peak hours.", createdAt: new Date() }
    ],
    openingHours: {
      Monday: "7:00 AM - 10:30 PM",
      Tuesday: "7:00 AM - 10:30 PM",
      Wednesday: "7:00 AM - 10:30 PM",
      Thursday: "7:00 AM - 10:30 PM",
      Friday: "7:00 AM - 10:30 PM",
      Saturday: "7:00 AM - 10:30 PM",
      Sunday: "7:00 AM - 10:30 PM"
    }
  },
  mock_place_royal_textiles: {
    name: "Royal Textiles",
    address: "Bazaar Street, Udumalpet Main Town, Tamil Nadu - 642126",
    phone: "+91 81223 94455",
    website: "https://royaltextilesudt.business.site",
    email: "info@royaltextilesudt.com",
    latitude: 10.5880,
    longitude: 77.2450,
    pincode: "642126",
    locality: "Bazaar Street",
    googlePlaceId: "mock_place_royal_textiles",
    googleRating: 4.7,
    googleReviewsCount: 320,
    googleReviews: [
      { authorName: "Sanjay Kumar", rating: 5, text: "Superb collection of ethnic wear and sarees. High quality material.", createdAt: new Date() },
      { authorName: "Rani P", rating: 4, text: "Affordable clothing range. Courteous staff. Clean showroom.", createdAt: new Date() }
    ],
    openingHours: {
      Monday: "9:30 AM - 9:30 PM",
      Tuesday: "9:30 AM - 9:30 PM",
      Wednesday: "9:30 AM - 9:30 PM",
      Thursday: "9:30 AM - 9:30 PM",
      Friday: "9:30 AM - 9:30 PM",
      Saturday: "9:30 AM - 9:30 PM",
      Sunday: "9:30 AM - 9:30 PM"
    }
  },
  mock_addr_head_post_office: {
    name: "Head Post Office Road",
    address: "Head Post Office Road, Udumalpet Main Town, Tamil Nadu - 642126",
    latitude: 10.5862,
    longitude: 77.2472,
    pincode: "642126",
    locality: "Head Post Office",
    googlePlaceId: "mock_addr_head_post_office"
  },
  mock_addr_bazaar_street: {
    name: "Bazaar Street",
    address: "Bazaar Street, Udumalpet Main Town, Tamil Nadu - 642126",
    latitude: 10.5855,
    longitude: 77.2495,
    pincode: "642126",
    locality: "Bazaar Street",
    googlePlaceId: "mock_addr_bazaar_street"
  },
  mock_addr_coimbatore_road: {
    name: "Coimbatore Road",
    address: "Coimbatore Road, Udumalpet, Tamil Nadu - 642128",
    latitude: 10.5921,
    longitude: 77.2398,
    pincode: "642128",
    locality: "coimbatore road",
    googlePlaceId: "mock_addr_coimbatore_road"
  }
};

// @desc    Get all active sponsored ads for homepage
// @route   GET /api/businesses/sponsored-ads
// @access  Public
router.get(['/sponsored-ads', '/homepage/sponsored-ads'], async (req, res) => {
  try {
    const businesses = await Business.find({
      'promotions.isSponsored': true,
      'promotions.active': { $ne: false }
    });

    const ads = [];
    businesses.forEach(b => {
      if (b.promotions && b.promotions.length) {
        b.promotions.forEach(p => {
          if (p.isSponsored && p.active !== false && p.active !== 'false' && p.sponsoredExpiry && new Date(p.sponsoredExpiry) > new Date()) {
            ads.push({
              businessId: b._id,
              businessName: b.name,
              businessSlug: b.slug,
              offer: {
                id: p.id,
                title: 'Sponsored Promotion Flyer',
                description: `Flyer promotion from ${b.name}`,
                banner: p.image,
                rate: '₹99 Promo',
                expiry: p.sponsoredExpiry ? new Date(p.sponsoredExpiry).toLocaleDateString() : '10 Days'
              }
            });
          }
        });
      }
    });

    res.json({ success: true, count: ads.length, data: ads });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all businesses with filters, search, and premium sorting
// @route   GET /api/businesses
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { q, category, locality, rating, verified, type, sort, limit } = req.query;

    let query = {};

    // Only return approved or active businesses unless requested by owner/admin
    if (req.query.includePending === 'true') {
      query.status = { $in: ['Approved', 'Pending Verification', 'Under Review'] };
    } else {
      query.status = 'Approved';
    }

    const conditions = [];

    // Search query (matches name, businessName, description, category, type, locality, services, brands)
    if (q) {
      const escapedQ = escapeRegex(q);
      conditions.push({
        $or: [
          { name: { $regex: escapedQ, $options: 'i' } },
          { businessName: { $regex: escapedQ, $options: 'i' } },
          { description: { $regex: escapedQ, $options: 'i' } },
          { category: { $regex: escapedQ, $options: 'i' } },
          { type: { $regex: escapedQ, $options: 'i' } },
          { locality: { $regex: escapedQ, $options: 'i' } },
          { services: { $elemMatch: { $regex: escapedQ, $options: 'i' } } },
          { brands: { $elemMatch: { $regex: escapedQ, $options: 'i' } } },
        ]
      });
    }

    // Category filter
    if (category && category !== 'All' && category !== 'All Categories') {
      const categoryList = category.split(',');
      let allCategoriesToQuery = [...categoryList];
      for (const cat of categoryList) {
        const subcats = await Category.find({ parentCategory: cat });
        if (subcats.length > 0) {
          allCategoriesToQuery.push(...subcats.map(c => c.categoryName));
        }
      }
      conditions.push({
        $or: [
          { category: { $in: allCategoriesToQuery } },
          { type: { $in: allCategoriesToQuery } },
          { 'categories.category': { $in: allCategoriesToQuery } },
          { 'categories.type': { $in: allCategoriesToQuery } }
        ]
      });
    }

    // Locality / Pincode filter
    if (locality && locality !== 'All' && locality !== 'Udumalpet') {
      const localityList = locality.split(',');
      const orConditions = [];
      localityList.forEach(loc => {
        const escapedLoc = escapeRegex(loc.trim());
        orConditions.push({ locality: { $regex: escapedLoc, $options: 'i' } });
        orConditions.push({ pincode: loc.trim() });
      });
      
      if (orConditions.length > 0) {
        conditions.push({ $or: orConditions });
      }
    }

    // Verified check
    if (verified === 'true') {
      conditions.push({
        $or: [
          { googlePlaceId: { $exists: true, $ne: '' } },
          { googleBusinessLink: { $exists: true, $ne: '' } },
          { googleLinked: true }
        ]
      });
    }

    // Business type (Premium / Verified)
    if (type === 'Premium') {
      conditions.push({ isPremium: true });
    } else if (type === 'Verified') {
      conditions.push({
        $or: [
          { googlePlaceId: { $exists: true, $ne: '' } },
          { googleBusinessLink: { $exists: true, $ne: '' } },
          { googleLinked: true }
        ]
      });
    }

    // Rating check (Database level)
    if (rating) {
      const minRating = parseFloat(rating);
      if (!isNaN(minRating)) {
        conditions.push({ googleRating: { $gte: minRating } });
      }
    }

    if (conditions.length > 0) {
      query.$and = conditions;
    }

    // Execute query
    let businesses = await Business.find(query).populate('ownerId', 'email phone mobileNumber');

    // Update active vs expired subscriptions on the fly, inherit parent subscription for branches, and attach branchCount
    const now = new Date();
    const businessesWithCounts = await Promise.all(businesses.map(async (b) => {
      await checkAndExpireBusiness(b);
      let bObj = b.toObject();

      // Inherit subscription details from parent if it is a branch
      if (bObj.parentBusinessId) {
        const parent = await Business.findById(bObj.parentBusinessId);
        if (parent) {
          bObj.subscriptionStatus = parent.subscriptionStatus;
          bObj.subscriptionExpiry = parent.subscriptionExpiry;
          bObj.isPremium = parent.isPremium;
        }
      }

      bObj.branchCount = await Business.countDocuments({ parentBusinessId: b._id, status: 'Approved' });
      
      const Referral = require('../models/Referral');
      const refCount = await Referral.countDocuments({
        $or: [
          { referrerId: b.ownerId },
          { referrerBusinessId: b._id }
        ]
      });
      bObj.referrals = refCount || bObj.referrals || 0;
      return bObj;
    }));
    businesses = businessesWithCounts;

    // Calculate Bayesian Average score helper
    let totalRatingSum = 0;
    let totalRatingCount = 0;
    businesses.forEach(b => {
      const r = Number(b.googleRating ?? b.rawGoogleRating ?? b.rating ?? 0);
      if (r > 0) {
        totalRatingSum += r;
        totalRatingCount++;
      }
    });
    const globalAvgC = totalRatingCount > 0 ? (totalRatingSum / totalRatingCount) : 4.0;
    const confidenceWeightM = 50;

    const getBayesianScore = (b) => {
      const R = Number(b.googleRating ?? b.rawGoogleRating ?? b.rating ?? 0);
      const v = Number(b.googleReviewsCount ?? b.rawGoogleReviewsCount ?? b.reviewsCount ?? (b.googleReviews ? b.googleReviews.length : 0) ?? 0);
      if (v === 0 && R === 0) return 0;
      const bayesianTerm = (v / (v + confidenceWeightM)) * R + (confidenceWeightM / (v + confidenceWeightM)) * globalAvgC;
      const volumeBonus = 0.1 * Math.log10(v + 1);
      return bayesianTerm + volumeBonus;
    };

    // Custom Sorting: 
    // If sort === 'views', sort by views count.
    // If sort === 'referrals', sort by referral count.
    // If sort === 'reviews' or 'rating', sort by Bayesian Average score.
    // Otherwise, use the standard priority sorting:
    if (sort === 'views') {
      businesses.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sort === 'referrals') {
      businesses.sort((a, b) => (b.referrals || 0) - (a.referrals || 0));
    } else if (sort === 'reviews' || sort === 'rating') {
      businesses.sort((a, b) => getBayesianScore(b) - getBayesianScore(a));
    } else {
      businesses.sort((a, b) => {
        // Premium active vs others
        const aPremium = a.isPremium && a.subscriptionStatus === 'active';
        const bPremium = b.isPremium && b.subscriptionStatus === 'active';
        if (aPremium && !bPremium) return -1;
        if (!aPremium && bPremium) return 1;

        // Active vs Expired
        const aActive = a.subscriptionStatus === 'active';
        const bActive = b.subscriptionStatus === 'active';
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;

        // Bayesian rating sort
        return getBayesianScore(b) - getBayesianScore(a);
      });
    }

    if (limit) {
      const limitNum = parseInt(limit);
      if (!isNaN(limitNum)) {
        businesses = businesses.slice(0, limitNum);
      }
    }

    res.json({ success: true, count: businesses.length, data: businesses });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/businesses/draft
// @desc    Get the current user's unpaid draft business listing
// @access  Private
router.get('/draft', protect, async (req, res) => {
  try {
    // Restrict access: Allow business owners, admins, visitors/writers, and partners to view draft
    if (req.user.role !== 'owner' && req.user.role !== 'merchant' && req.user.role !== 'admin' && req.user.role !== 'visitor' && req.user.role !== 'partner') {
      return res.status(403).json({ success: false, message: 'Access denied: Authorized role required' });
    }

    const listings = await Business.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
    let business = null;

    const isAdminUser = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');
    const isTestUser = 
      (req.user && (
        req.user.email === 'test@gmail.com' || 
        req.user.name === 'xxx' || 
        req.user.fullName === 'xxx' || 
        req.user.phone === '1234567891' || 
        req.user.mobileNumber === '1234567891'
      )) || isAdminUser;

    if (listings.length > 1) {
      business = listings[0];
      if (!isTestUser) {
        const deleteIds = listings.slice(1).map(b => b._id);
        await Business.deleteMany({ _id: { $in: deleteIds } });
        console.log(`[DUPLICATE CLEANUP ON DRAFT] Deleted ${deleteIds.length} duplicate business listings for owner ${req.user._id}`);
      }
    } else if (listings.length === 1) {
      business = listings[0];
    }

    if (!business || business.subscriptionStatus === 'active') {
      return res.json({ success: true, data: null });
    }
    res.json({ success: true, data: business });
  } catch (error) {
    console.error('Error fetching draft:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   GET /api/businesses/my-business
// @desc    Get the current user's business listing (regardless of status/subscription)
// @access  Private
router.get('/my-business', protect, async (req, res) => {
  try {
    // Merge/Clean duplicate entries for this owner (only for primary listings, not branches)
    const listings = await Business.find({
      ownerId: req.user._id,
      $or: [{ parentBusinessId: null }, { parentBusinessId: { $exists: false } }]
    }).sort({ createdAt: -1 });
    let business = null;
    
    const isAdminUser = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');
    const isTestUser = 
      (req.user && (
        req.user.email === 'test@gmail.com' || 
        req.user.name === 'xxx' || 
        req.user.fullName === 'xxx' || 
        req.user.phone === '1234567891' || 
        req.user.mobileNumber === '1234567891'
      )) || isAdminUser;

    if (listings.length > 1) {
      business = listings[0]; // Keep the most recently created listing
      if (!isTestUser) {
        const deleteIds = listings.slice(1).map(b => b._id);
        await Business.deleteMany({ _id: { $in: deleteIds } });
        console.log(`[DUPLICATE CLEANUP] Deleted ${deleteIds.length} duplicate business listings for owner ${req.user._id}`);
      }
    } else if (listings.length === 1) {
      business = listings[0];
    }
    
    const Subscription = require('../models/Subscription');
    const populatedListings = [];

    for (let biz of listings) {
      await checkAndExpireBusiness(biz);
      
      const activeSub = await Subscription.findOne({
        businessId: biz._id,
        status: 'active'
      }).sort({ createdAt: -1 });

      let bizObj = biz.toObject();

      if (activeSub) {
        bizObj.subscriptionStart = activeSub.startDate;
        bizObj.subscriptionExpiry = activeSub.endDate;
        bizObj.subscriptionPlan = activeSub.plan || activeSub.planName || 'PRO PLAN';
        bizObj.isAutopayEnabled = !!activeSub.razorpaySubscriptionId && activeSub.autoRenew === true;
      } else {
        if (bizObj.subscriptionStatus === 'active') {
          bizObj.subscriptionStart = bizObj.createdAt || new Date();
          bizObj.subscriptionPlan = 'PRO PLAN';
          bizObj.isAutopayEnabled = false;
        }
      }
      populatedListings.push(bizObj);
    }

    business = populatedListings[0] || null;
    
    if (isAdminUser) {
      res.json({ success: true, data: business, allBusinesses: populatedListings });
    } else {
      res.json({ success: true, data: business });
    }
  } catch (error) {
    console.error('Error fetching my-business:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// GOOGLE PLACES AUTOCOMPLETE API
// ==========================================
// This endpoint interfaces with the Google Places Autocomplete service to provide
// instant real-time predictions as a business owner types their store name.
//
// Key Details:
// - Restricts results to Country: India ('components=country:in').
// - Supports both 'establishment' (businesses) and 'geocode' (street addresses) queries.
// - Resolves environment variable GOOGLE_MAPS_API_KEY.
// - Dynamically falls back to local high-quality mock data if API key is not configured.
// @desc    Google Places Autocomplete
// @route   GET /api/businesses/google-autocomplete
// @access  Public
router.get('/google-autocomplete', async (req, res) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const q = req.query.q || '';
  const types = req.query.types || 'establishment';

  const clean = str => str.toLowerCase().replace(/[^a-z0-9]/g, '');
  const isGeocodeSearch = types === 'geocode' || types === 'address';
  const targetSuggestions = isGeocodeSearch ? mockAddressSuggestions : mockSuggestions;

  if (!apiKey) {
    const qClean = clean(q);
    const filtered = targetSuggestions.filter(s => 
      clean(s.structured_formatting?.main_text || '').includes(qClean) ||
      clean(s.description || '').includes(qClean)
    );
    return res.json({ success: true, predictions: filtered });
  }

  try {
    const url = 'https://places.googleapis.com/v1/places:autocomplete';
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat'
      },
      body: JSON.stringify({
        input: q,
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
    
    if (data && data.suggestions) {
      const predictions = data.suggestions.map(sug => {
        const p = sug.placePrediction || {};
        return {
          place_id: p.placeId || '',
          description: p.text?.text || '',
          structured_formatting: {
            main_text: p.structuredFormat?.mainText?.text || p.text?.text || '',
            secondary_text: p.structuredFormat?.secondaryText?.text || ''
          }
        };
      });
      return res.json({ success: true, predictions });
    } else {
      console.warn(`Google Places API (New) Autocomplete failed: ${JSON.stringify(data)}. Falling back to mock suggestions.`);
      const qClean = clean(q);
      const filtered = targetSuggestions.filter(s => 
        clean(s.structured_formatting?.main_text || '').includes(qClean) ||
        clean(s.description || '').includes(qClean)
      );
      return res.json({ success: true, predictions: filtered });
    }
  } catch (error) {
    console.error('Autocomplete API error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// GOOGLE PLACES DETAIL IMPORT API
// ==========================================
// This endpoint fetches full detailed information for a specific Place ID, mapping
// opening hours, formatted phone, address locality components, websites, coordinates, and reviews.

async function fetchLegacyDetails(placeId, cid, apiKey, extractedName, extractedLat, extractedLng) {
  if (!apiKey) return null;
  try {
    let legacyUrl = `https://maps.googleapis.com/maps/api/place/details/json?fields=place_id,name,formatted_address,formatted_phone_number,website,geometry,opening_hours,rating,user_ratings_total,reviews,address_components&key=${apiKey}`;
    if (placeId) {
      legacyUrl += `&place_id=${placeId}`;
    } else if (cid) {
      legacyUrl += `&cid=${cid}`;
    } else {
      return null;
    }

    const legacyResp = await fetch(legacyUrl);
    const legacyData = await legacyResp.json();
    if (legacyData.status === 'OK' && legacyData.result) {
      const legacyResult = legacyData.result;
      
      let hasGmbHours = false;
      let timings = {
        Monday: '',
        Tuesday: '',
        Wednesday: '',
        Thursday: '',
        Friday: '',
        Saturday: '',
        Sunday: '',
      };
      if (legacyResult.opening_hours && legacyResult.opening_hours.weekday_text) {
        hasGmbHours = true;
        for (const text of legacyResult.opening_hours.weekday_text) {
          const parts = text.split(': ');
          if (parts.length >= 2) {
            const day = parts[0];
            const hours = parts.slice(1).join(': ').trim();
            if (timings.hasOwnProperty(day)) {
              timings[day] = hours;
            }
          }
        }
      }
      
      const finalTimings = hasGmbHours ? timings : null;
      
      const legacyReviews = (legacyResult.reviews || []).map(r => ({
        authorName: r.author_name || 'A Google User',
        rating: r.rating || 0,
        text: r.text || '',
        createdAt: r.time ? new Date(r.time * 1000) : new Date(),
      }));

      let lat = legacyResult.geometry?.location?.lat || extractedLat || 10.585;
      let lng = legacyResult.geometry?.location?.lng || extractedLng || 77.251;
      
      let pincode = '642126';
      let locality = 'Udumalpet';
      if (legacyResult.address_components) {
        for (const comp of legacyResult.address_components) {
          if (comp.types && comp.types.includes('postal_code')) {
            pincode = comp.long_name;
          }
          if (comp.types && (comp.types.includes('sublocality') || comp.types.includes('neighborhood'))) {
            locality = comp.long_name;
          } else if (!locality && comp.types && comp.types.includes('locality')) {
            locality = comp.long_name;
          }
        }
      }

      const detail = {
        name: legacyResult.name || extractedName || '',
        address: legacyResult.formatted_address || '',
        phone: legacyResult.formatted_phone_number || '',
        website: legacyResult.website || '',
        email: '',
        latitude: lat,
        longitude: lng,
        googlePlaceId: placeId || legacyResult.place_id || '',
        googleRating: legacyResult.rating || 0,
        googleReviewsCount: legacyResult.user_ratings_total || 0,
        googleReviews: legacyReviews,
        timings: finalTimings,
        openingHours: finalTimings,
        pincode,
        locality
      };
      
      if (detail.website) {
        try {
          detail.email = await scrapeEmail(detail.website) || `info@${new URL(detail.website).hostname.replace('www.', '')}`;
        } catch (e) {}
      }
      
      return detail;
    }
  } catch (err) {
    console.warn('[fetchLegacyDetails] Legacy details call failed:', err.message);
  }
  return null;
}
// @desc    Generate Business Details with AI (Gemini or OpenAI)
// @route   POST /api/businesses/generate-ai-details
// @access  Public
router.post('/generate-ai-details', async (req, res) => {
  const { name, categories, field, hint } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Business name is required' });
  }

  const geminiKeys = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3
  ].filter(Boolean);
  const openaiApiKey = process.env.OPENAI_API_KEY;

  if (geminiKeys.length === 0 && !openaiApiKey) {
    return res.status(400).json({
      success: false,
      message: 'AI generation is not configured. Please set GEMINI_API_KEY, GEMINI_API_KEY_2, or OPENAI_API_KEY in your backend server environment.'
    });
  }

  const catList = Array.isArray(categories) ? categories.map(c => typeof c === 'object' ? (c.category || c.name || '') : c).filter(Boolean) : [];
  const catString = catList.length > 0 ? catList.join(', ') : 'General Business';

  let prompt = '';
  let responseSchema = null;
  let systemInstructionText = 'You are an AI assistant that generates business profiles in JSON format.';

  if (field === 'description') {
    systemInstructionText = 'You are an AI copywriting agent specializing in writing engaging, professional, and high-converting business descriptions.';
    prompt = `Generate a professional business description for a business named "${name}" in the category: "${catString}".
${hint ? `Incorporating keywords/hints: "${hint}".` : ''}
The description must be 3 to 4 sentences long.

Return the output strictly as a JSON object matching this schema:
{
  "description": "text string"
}`;
    responseSchema = {
      type: "OBJECT",
      properties: {
        description: { type: "STRING" }
      },
      required: ["description"]
    };
  } else if (field === 'highlights') {
    systemInstructionText = 'You are an AI marketing specialist agent specializing in writing concise, catchy, and high-impact highlights and features for businesses.';
    prompt = `Generate a list of 4 to 6 short highlights or features for a business named "${name}" in the category: "${catString}".
${hint ? `Incorporating keywords/hints: "${hint}".` : ''}
Highlights must be short phrases. Return the output strictly as a JSON object containing a single string of comma-separated values (e.g. "On-time Service, Affordable Price, Expert Technicians"). Highlights must NOT contain any green tick or check emojis.

Return the output strictly as a JSON object matching this schema:
{
  "highlights": "comma-separated values string"
}`;
    responseSchema = {
      type: "OBJECT",
      properties: {
        highlights: { type: "STRING" }
      },
      required: ["highlights"]
    };
  } else if (field === 'services') {
    systemInstructionText = 'You are an AI business operations consultant agent specializing in listing precise and descriptive products and services offered by businesses.';
    prompt = `Generate a list of 5 to 8 products or services offered by a business named "${name}" in the category: "${catString}".
${hint ? `Incorporating keywords/hints: "${hint}".` : ''}
Services should be relevant and specific. Return the output strictly as a JSON object containing a single string of comma-separated values (e.g. "Home Delivery, AC Installation").

Return the output strictly as a JSON object matching this schema:
{
  "services": "comma-separated values string"
}`;
    responseSchema = {
      type: "OBJECT",
      properties: {
        services: { type: "STRING" }
      },
      required: ["services"]
    };
  } else {
    // Default (generate everything)
    prompt = `Generate details for a business named "${name}" in the category: "${catString}".
${hint ? `Incorporating keywords/hints: "${hint}".` : ''}
Provide:
1. A professional description (3 to 4 sentences).
2. 4 to 6 short highlights or features (e.g. "On-time Service", "Affordable Price", "Expert Technicians"). Highlights must NOT contain any green tick or check emojis.
3. 5 to 8 products or services offered (e.g. "Home Delivery", "AC Installation").

Return the output strictly as a JSON object matching this schema:
{
  "description": "text string",
  "highlights": ["highlight 1", "highlight 2", ...],
  "services": ["service 1", "service 2", ...]
}`;
    responseSchema = {
      type: "OBJECT",
      properties: {
        description: { type: "STRING" },
        highlights: {
          type: "ARRAY",
          items: { type: "STRING" }
        },
        services: {
          type: "ARRAY",
          items: { type: "STRING" }
        }
      },
      required: ["description", "highlights", "services"]
    };
  }

  let geminiSuccess = false;
  let parsedData = null;
  let lastError = null;

  // 1. Try Gemini first if keys are present
  if (geminiKeys.length > 0) {
    for (let i = 0; i < geminiKeys.length; i++) {
      const apiKey = geminiKeys[i];
      try {
        console.log(`[AI Generator] Attempting with Gemini Key Index: ${i}`);
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: prompt }]
            }],
            systemInstruction: {
              parts: [{ text: systemInstructionText }]
            },
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: responseSchema
            }
          })
        });

        const result = await response.json();
        
        // Handle rate limit (429) or quota errors by trying next key
        if (response.status === 429 || result.error?.code === 429 || result.error?.status === 'RESOURCE_EXHAUSTED') {
          console.warn(`[AI Generator] Gemini Key Index ${i} rate limited (429). Trying next key...`);
          lastError = new Error(result.error?.message || 'Rate limit exceeded');
          continue; 
        }

        if (result.error) {
          throw new Error(result.error.message || 'Gemini API returned an error');
        }

        const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          parsedData = JSON.parse(text);
          geminiSuccess = true;
          break; // Stop loop on success
        }
      } catch (err) {
        console.error(`[AI Generator] Gemini Key Index ${i} failed:`, err.message);
        lastError = err;
        // Continue to check next key
      }
    }

    if (geminiSuccess && parsedData) {
      return res.json({ success: true, data: parsedData });
    }
  }

  // If Gemini failed but OpenAI is not available, fallback to mock template generator
  if (!geminiSuccess && !openaiApiKey) {
    console.log(`[AI Generator] Gemini failed (quota limit 0/429). Falling back to local context-aware generator for "${name}" (${catString})`);
    
    let mockResponse = {};
    const lowerName = name.toLowerCase();
    const lowerCat = catString.toLowerCase();
    
    const isFood = lowerCat.includes('food') || lowerCat.includes('rest') || lowerCat.includes('bake') || lowerCat.includes('sweet') || lowerCat.includes('cake') || lowerName.includes('bake') || lowerName.includes('sweet');
    const isTech = lowerCat.includes('tech') || lowerCat.includes('soft') || lowerCat.includes('comput') || lowerCat.includes('digital') || lowerCat.includes('it') || lowerName.includes('tech') || lowerName.includes('soft');
    const isService = lowerCat.includes('pack') || lowerCat.includes('move') || lowerCat.includes('shift') || lowerCat.includes('logis') || lowerCat.includes('service') || lowerCat.includes('clean');
    
    if (field === 'description') {
      let desc = '';
      if (isFood) {
        desc = `Welcome to ${name}, the ultimate destination for delicious food, fresh cakes, and premium sweets in the area. We pride ourselves on using high-quality ingredients to prepare mouth-watering dishes and treats daily. Whether you are dining in with family or ordering for a special event, we promise an exceptional culinary experience. Experience the perfect blend of taste, quality, and hospitality with us today.`;
      } else if (isTech) {
        desc = `${name} is a leading provider of innovative IT solutions, custom software engineering, and digital consulting services. We specialize in helping businesses leverage technology to optimize operations, enhance digital presence, and accelerate growth. Our dedicated team of engineers and consultants ensures top-tier performance, reliability, and security for every project. Partner with us to transform your vision into cutting-edge digital reality.`;
      } else if (isService) {
        desc = `${name} is a highly trusted and professional services provider specializing in local shifting, logistics, and domestic relocations. We are dedicated to providing hassle-free, secure, and highly efficient transport solutions tailored to your schedule. Our experienced and polite staff handle your belongings with utmost care, ensuring complete peace of mind. Choose us for safe, timely, and budget-friendly services you can rely on.`;
      } else {
        desc = `${name} is a premier business specializing in ${catString}. Dedicated to delivering high-quality products and exceptional customer service, we strive to exceed expectations. Our experienced team is committed to providing reliable solutions tailored to your unique needs. Visit us to experience professional service and quality you can trust.`;
      }
      mockResponse = { description: desc };
    } else if (field === 'highlights') {
      let hStr = '';
      if (isFood) {
        hStr = 'Hygiene Certified, Fresh Ingredients, Cozy Ambiance, Doorstep Delivery, Custom Cake Orders, Friendly Staff';
      } else if (isTech) {
        hStr = 'Expert Developers, Custom Solutions, 24/7 Support, Agile Delivery, Cutting-edge Tech, Scalable Systems';
      } else if (isService) {
        hStr = 'Safe Shifting, Affordable Rates, On-time Delivery, Polite Staff, Quality Packing, Fully Insured';
      } else {
        hStr = 'Professional Staff, Premium Quality, Affordable Rates, Exceptional Service, Highly Trusted, Customer Focused';
      }
      mockResponse = { highlights: hStr };
    } else if (field === 'services') {
      let sStr = '';
      if (isFood) {
        sStr = 'Specialty Cakes, Fresh Sweets, Custom Pastries, Catering Services, Dine-in Experience, Home Delivery';
      } else if (isTech) {
        sStr = 'Custom CRM Development, Mobile App Engineering, Web Application Development, Cloud Consulting, UI/UX Design, IT Support';
      } else if (isService) {
        sStr = 'House Shifting, Office Relocation, Local Transport, Secure Packing, Bike Transportation, Cargo Loading';
      } else {
        sStr = 'Custom Orders, Consultation, Retail Service, Customer Support, Quality Auditing, Delivery Assistance';
      }
      mockResponse = { services: sStr };
    } else {
      mockResponse = {
        description: `${name} is a premier business specializing in ${catString}. Dedicated to delivering high-quality products and exceptional customer service, we strive to exceed expectations. Our experienced team is committed to providing reliable solutions tailored to your unique needs. Visit us to experience professional service and quality you can trust.`,
        highlights: 'Professional Staff, Premium Quality, Affordable Rates, Exceptional Service',
        services: 'Custom Orders, Consultation, Retail Service, Customer Support'
      };
    }
    
    return res.json({ success: true, data: mockResponse });
  }

  // 2. Fallback to OpenAI if key is present
  if (openaiApiKey) {
    try {
      let messages = [
        {
          role: 'system',
          content: systemInstructionText
        }
      ];

      if (field === 'description') {
        messages.push({
          role: 'user',
          content: `Generate a professional business description for a business named "${name}" in the category: "${catString}".
${hint ? `Incorporating keywords/hints: "${hint}".` : ''}
Return a JSON object exactly with this key:
- description: A professional description (3 to 4 sentences).`
        });
      } else if (field === 'highlights') {
        messages.push({
          role: 'user',
          content: `Generate a list of 4 to 6 short highlights or features for a business named "${name}" in the category: "${catString}".
${hint ? `Incorporating keywords/hints: "${hint}".` : ''}
Return a JSON object exactly with this key:
- highlights: A single string containing 4 to 6 short highlights separated by commas (e.g. "On-time Service, Affordable Price, Expert Technicians"). The string must NOT contain any emojis.`
        });
      } else if (field === 'services') {
        messages.push({
          role: 'user',
          content: `Generate a list of 5 to 8 products or services offered by a business named "${name}" in the category: "${catString}".
${hint ? `Incorporating keywords/hints: "${hint}".` : ''}
Return a JSON object exactly with this key:
- services: A single string containing 5 to 8 products or services separated by commas (e.g. "Home Delivery, AC Installation").`
        });
      } else {
        messages.push({
          role: 'user',
          content: `Generate details for a business named "${name}" in the category: "${catString}".
${hint ? `Incorporating keywords/hints: "${hint}".` : ''}
Return a JSON object exactly with these keys:
- description: A professional description (3 to 4 sentences).
- highlights: 4 to 6 short highlights or features (e.g. "On-time Service", "Affordable Price", "Expert Technicians"). Highlights must NOT contain any emojis.
- services: 5 to 8 products or services offered (e.g. "Home Delivery", "AC Installation").`
        });
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiApiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: messages
        })
      });

      const result = await response.json();
      if (result.error) {
        throw new Error(result.error.message || 'OpenAI API returned an error');
      }

      const content = result.choices?.[0]?.message?.content;
      if (content) {
        const parsed = JSON.parse(content);
        return res.json({ success: true, data: parsed });
      }
    } catch (err) {
      console.error('OpenAI generation failed:', err.message);
      return res.status(500).json({ success: false, message: `AI generation failed: ${err.message}` });
    }
  }
});

// @desc    Google Places Auto-fill Details
// @route   POST /api/businesses/google-autofill
// @access  Public
router.post('/google-autofill', async (req, res) => {
  const { placeId } = req.body;
  if (!placeId) {
    return res.status(400).json({ success: false, message: 'placeId is required' });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey || mockDetails[placeId] || placeId.startsWith('mock_place_') || placeId.startsWith('mock_addr_')) {
    let detail = mockDetails[placeId];
    if (!detail) {
      const lowerId = String(placeId || '').toLowerCase();
      if (lowerId.includes('taluk') || lowerId.includes('office') || lowerId.includes('gov') || lowerId.includes('police') || lowerId.includes('municipality')) {
        detail = mockDetails['mock_place_udumalaipettai_taluk_office'];
      } else {
        detail = mockDetails['mock_place_rk_electricals'];
      }
    }
    return res.json({ success: true, data: detail });
  }

  try {
    const isMockKey = !apiKey || apiKey.includes('mockKeyId');

    // 1. Try Google Places Details API (New) first
    if (!isMockKey) {
      try {
        const url = `https://places.googleapis.com/v1/places/${placeId}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'id,displayName,formattedAddress,nationalPhoneNumber,websiteUri,location,regularOpeningHours,rating,userRatingCount,reviews,addressComponents,types'
          }
        });

        const result = await response.json();

        if (result.error) {
          throw new Error(result.error.message || 'Places API New returned an error');
        }
        
        if (!result.error) {
          const lat = result.location?.latitude || 10.585;
          const lng = result.location?.longitude || 77.251;

          let pincode = '';
          let locality = '';
          if (result.addressComponents) {
            for (const comp of result.addressComponents) {
              if (comp.types && comp.types.includes('postal_code')) {
                pincode = comp.longText;
              }
              if (comp.types && (comp.types.includes('sublocality') || comp.types.includes('neighborhood'))) {
                locality = comp.longText;
              } else if (!locality && comp.types && comp.types.includes('locality')) {
                locality = comp.longText;
              }
            }
          }

          let address = result.formattedAddress || '';
          if (!address || address.split(',').length < 3) {
            try {
              const legacyDetail = await fetchLegacyDetails(placeId, null, apiKey);
              if (legacyDetail && legacyDetail.address) {
                address = legacyDetail.address;
              }
            } catch (e) {
              console.warn('Failed to retrieve fallback legacy address:', e.message);
            }
          }

          const cleanTimingStr = (str) => str.replace(/[\u2013\u2014\u2012\u2010]/g, '-').replace(/[\u202F\u00A0]/g, ' ').trim();

          let hasGmbHours = false;
          const timings = {
            Monday: '9:00 AM - 8:00 PM',
            Tuesday: '9:00 AM - 8:00 PM',
            Wednesday: '9:00 AM - 8:00 PM',
            Thursday: '9:00 AM - 8:00 PM',
            Friday: '9:00 AM - 8:00 PM',
            Saturday: '9:00 AM - 8:00 PM',
            Sunday: 'Closed',
          };

          if (result.regularOpeningHours && result.regularOpeningHours.weekdayDescriptions) {
            hasGmbHours = true;
            for (const text of result.regularOpeningHours.weekdayDescriptions) {
              const parts = text.split(': ');
              if (parts.length >= 2) {
                const day = parts[0];
                const hours = cleanTimingStr(parts.slice(1).join(': '));
                if (timings.hasOwnProperty(day)) {
                  timings[day] = hours;
                }
              }
            }
          }

          const isPublic = isPublicSector(result.types, result.displayName?.text);
          const finalTimings = (isPublic && !hasGmbHours) ? null : timings;

          let googleReviews = (result.reviews || []).map(r => ({
            authorName: r.authorAttribution?.displayName || 'A Google User',
            rating: r.rating || 0,
            text: r.text?.text || '',
            createdAt: r.publishTime ? new Date(r.publishTime) : new Date(),
          }));

          let rating = result.rating || 0;
          let reviewsCount = result.userRatingCount || 0;

          if (googleReviews.length === 0 || !rating || !reviewsCount) {
            try {
              const legacyUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${apiKey}`;
              const legacyResp = await fetch(legacyUrl);
              const legacyData = await legacyResp.json();
              if (legacyData.status === 'OK' && legacyData.result) {
                if (legacyData.result.reviews && googleReviews.length === 0) {
                  googleReviews = legacyData.result.reviews.slice(0, 5).map(r => ({
                    authorName: r.author_name || 'A Google User',
                    rating: r.rating || 0,
                    text: r.text || '',
                    createdAt: new Date(r.time * 1000),
                  }));
                }
                if (legacyData.result.rating && !rating) {
                  rating = legacyData.result.rating;
                }
                if (legacyData.result.user_ratings_total && !reviewsCount) {
                  reviewsCount = legacyData.result.user_ratings_total;
                }
              }
            } catch (e) {}
          }

          let email = '';
          if (result.websiteUri) {
            email = await scrapeEmail(result.websiteUri);
            if (!email) {
              try {
                const urlObj = new URL(result.websiteUri);
                const host = urlObj.hostname.replace('www.', '');
                email = `info@${host}`;
              } catch (e) {}
            }
          }

          const detail = {
            name: result.displayName?.text || '',
            address: address,
            phone: result.nationalPhoneNumber || '',
            website: result.websiteUri || '',
            email,
            latitude: lat,
            longitude: lng,
            googlePlaceId: placeId,
            googleRating: rating,
            googleReviewsCount: reviewsCount,
            googleReviews,
            openingHours: finalTimings,
            timings: finalTimings,
            pincode,
            locality
          };

          return res.json({ success: true, data: detail });
        }
      } catch (err) {
        console.warn('Google Places Details (New) failed, attempting legacy:', err.message);
      }
    }

    // 2. Try legacy Places Details API
    if (!isMockKey) {
      const legacyDetail = await fetchLegacyDetails(placeId, null, apiKey);
      if (legacyDetail) {
        return res.json({ success: true, data: legacyDetail });
      }
    }

    // If it's a real API key and a real Place ID, return error instead of falling back to mock details
    if (!isMockKey && !String(placeId).startsWith('mock_') && !mockDetails[placeId]) {
      return res.status(400).json({ success: false, message: 'Failed to retrieve details from Google Places API for the provided Place ID.' });
    }

    // Default Mock fallback
    let detail = mockDetails[placeId];
    if (!detail) {
      const lowerId = String(placeId || '').toLowerCase();
      if (lowerId.includes('taluk') || lowerId.includes('office') || lowerId.includes('gov') || lowerId.includes('police') || lowerId.includes('municipality')) {
        detail = mockDetails['mock_place_udumalaipettai_taluk_office'];
      } else {
        detail = mockDetails['mock_place_rk_electricals'];
      }
    }
    return res.json({ success: true, data: detail });
  } catch (error) {
    console.error('Google Place Details error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Google Places Autofill by link
// @route   POST /api/businesses/google-autofill-link
// @access  Public
router.post('/google-autofill-link', async (req, res) => {
  const link = req.body.link || req.body.url;
  if (!link) {
    return res.status(400).json({ success: false, message: 'link or url is required' });
  }

  try {
    const originalLink = link.trim();
    let targetLink = originalLink;
    
    // Follow short URL redirect with User-Agent to resolve standard Google Maps short links
    if (targetLink.includes('goo.gl') || targetLink.includes('google.com') || targetLink.includes('google.co.in') || targetLink.includes('share.google')) {
      try {
        const response = await fetch(targetLink, {
          method: 'GET',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          redirect: 'follow'
        });
        targetLink = response.url;
      } catch (redirectErr) {
        console.warn('Redirect check failed:', redirectErr.message);
      }
    }

    // 1. Attempt Place ID extraction
    let placeId = '';
    const match = targetLink.match(/ChIJ[a-zA-Z0-9_-]+/);
    if (match) {
      placeId = match[0];
    } else {
      try {
        const urlObj = new URL(targetLink);
        placeId = urlObj.searchParams.get('query_place_id') || '';
      } catch (e) {}
    }

    // Attempt CID extraction (common in Google My Business profile/review links)
    let cid = '';
    const cidMatch = targetLink.match(/cid=(\d+)/) || originalLink.match(/cid=(\d+)/);
    if (cidMatch) {
      cid = cidMatch[1];
    }

    // 2. Try to extract Name from URL path (check targetLink and originalLink)
    let extractedName = '';
    const parseName = (urlStr) => {
      const placeMatch = urlStr.match(/\/place\/([^/@?]+)/);
      if (placeMatch) {
        return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
      }
      const searchMatch = urlStr.match(/\/search\/([^/@?]+)/);
      if (searchMatch) {
        return decodeURIComponent(searchMatch[1].replace(/\+/g, ' '));
      }
      try {
        const urlObj = new URL(urlStr);
        const query = urlObj.searchParams.get('query') || urlObj.searchParams.get('q');
        if (query) {
          return query;
        }
      } catch (e) {}
      return '';
    };
    try {
      extractedName = parseName(targetLink) || parseName(originalLink);
    } catch (e) {
      console.warn('Failed to extract name from URL:', e);
    }

    // 3. Try to extract coordinates from URL (e.g. @10.5878,77.2465)
    let extractedLat = null;
    let extractedLng = null;
    try {
      const coordMatch = targetLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/) || originalLink.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (coordMatch) {
        extractedLat = parseFloat(coordMatch[1]);
        extractedLng = parseFloat(coordMatch[2]);
      }
    } catch (e) {
      console.warn('Failed to extract coordinates from URL:', e);
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const isMockKey = !apiKey || apiKey.includes('mockKeyId');

    // Resolve name to Place ID via Text Search if API Key is real and we still don't have placeId or cid
    if (!placeId && !cid && extractedName && apiKey && !isMockKey) {
      try {
        const searchUrl = 'https://places.googleapis.com/v1/places:searchText';
        const searchRes = await fetch(searchUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress'
          },
          body: JSON.stringify({
            textQuery: `${extractedName} Udumalpet`
          })
        });
        const searchData = await searchRes.json();
        if (searchData.places && searchData.places.length > 0) {
          placeId = searchData.places[0].id;
        }
      } catch (err) {
        console.warn('Text search fallback failed:', err.message);
      }
    }

    // Try real fetch if API key is real and we have placeId or cid
    if (!isMockKey && (placeId || cid) && !String(placeId).startsWith('mock_place_') && !String(placeId).startsWith('mock_addr_') && !mockDetails[placeId]) {
      // 1. Try New Places API first (only works if we have placeId)
      if (placeId) {
        try {
          const url = `https://places.googleapis.com/v1/places/${placeId}`;
          const response = await fetch(url, {
            method: 'GET',
                  headers: {
              'Content-Type': 'application/json',
              'X-Goog-Api-Key': apiKey,
              'X-Goog-FieldMask': 'id,displayName,formattedAddress,nationalPhoneNumber,websiteUri,location,regularOpeningHours,rating,userRatingCount,reviews,addressComponents,types'
            }
          });
          const result = await response.json();
          if (result.error) {
            throw new Error(result.error.message || 'Places API New returned an error');
          }

          if (!result.error) {
            const lat = result.location?.latitude || extractedLat || 10.585;
            const lng = result.location?.longitude || extractedLng || 77.251;

            let pincode = '';
            let locality = '';
            if (result.addressComponents) {
              for (const comp of result.addressComponents) {
                if (comp.types && comp.types.includes('postal_code')) {
                  pincode = comp.longText;
                }
                if (comp.types && (comp.types.includes('sublocality') || comp.types.includes('neighborhood'))) {
                  locality = comp.longText;
                } else if (!locality && comp.types && comp.types.includes('locality')) {
                  locality = comp.longText;
                }
              }
            }

            let address = result.formattedAddress || '';
            if (!address || address.split(',').length < 3) {
              try {
                const legacyDetail = await fetchLegacyDetails(placeId, null, apiKey, extractedName, extractedLat, extractedLng);
                if (legacyDetail && legacyDetail.address) {
                  address = legacyDetail.address;
                }
              } catch (e) {
                console.warn('Failed to retrieve fallback legacy address:', e.message);
              }
            }

            const cleanTimingStr = (str) => str.replace(/[\u2013\u2014\u2012\u2010]/g, '-').replace(/[\u202F\u00A0]/g, ' ').trim();

            let hasGmbHours = false;
            const timings = {
              Monday: '',
              Tuesday: '',
              Wednesday: '',
              Thursday: '',
              Friday: '',
              Saturday: '',
              Sunday: '',
            };

            if (result.regularOpeningHours && result.regularOpeningHours.weekdayDescriptions) {
              hasGmbHours = true;
              for (const text of result.regularOpeningHours.weekdayDescriptions) {
                const parts = text.split(': ');
                if (parts.length >= 2) {
                  const day = parts[0];
                  const hours = cleanTimingStr(parts.slice(1).join(': '));
                  if (timings.hasOwnProperty(day)) {
                    timings[day] = hours;
                  }
                }
              }
            }

            const finalTimings = hasGmbHours ? timings : null;

            let googleReviews = (result.reviews || []).map(r => ({
              authorName: r.authorAttribution?.displayName || 'A Google User',
              rating: r.rating || 0,
              text: r.text?.text || '',
              createdAt: r.publishTime ? new Date(r.publishTime) : new Date(),
            }));

            let rating = result.rating || 0;
            let reviewsCount = result.userRatingCount || 0;

            if (googleReviews.length === 0 || !rating || !reviewsCount) {
              try {
                const legacyUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${apiKey}`;
                const legacyResp = await fetch(legacyUrl);
                const legacyData = await legacyResp.json();
                if (legacyData.status === 'OK' && legacyData.result) {
                  if (legacyData.result.reviews && googleReviews.length === 0) {
                    googleReviews = legacyData.result.reviews.slice(0, 5).map(r => ({
                      authorName: r.author_name || 'A Google User',
                      rating: r.rating || 0,
                      text: r.text || '',
                      createdAt: new Date(r.time * 1000),
                    }));
                  }
                  if (legacyData.result.rating && !rating) {
                    rating = legacyData.result.rating;
                  }
                  if (legacyData.result.user_ratings_total && !reviewsCount) {
                    reviewsCount = legacyData.result.user_ratings_total;
                  }
                }
              } catch (e) {}
            }

            let email = '';
            if (result.websiteUri) {
              email = await scrapeEmail(result.websiteUri);
              if (!email) {
                try {
                  const urlObj = new URL(result.websiteUri);
                  const host = urlObj.hostname.replace('www.', '');
                  email = `info@${host}`;
                } catch (e) {}
              }
            }

            const detail = {
              name: result.displayName?.text || extractedName || '',
              address: address,
              phone: result.nationalPhoneNumber || '',
              website: result.websiteUri || '',
              email,
              latitude: lat,
              longitude: lng,
              googlePlaceId: placeId,
              googleRating: rating,
              googleReviewsCount: reviewsCount,
              googleReviews,
              timings: finalTimings,
              openingHours: finalTimings,
              pincode,
              locality
            };

            return res.json({ success: true, data: detail });
          }
        } catch (err) {
          console.warn('New Places Details API link call failed, trying legacy:', err.message);
        }
      }

      // 2. Try legacy Places Details API (works with placeId or cid)
      try {
        const legacyDetail = await fetchLegacyDetails(placeId, cid, apiKey, extractedName, extractedLat, extractedLng);
        if (legacyDetail) {
          return res.json({ success: true, data: legacyDetail });
        }
      } catch (err) {
        console.warn('Legacy Places Details API link call failed:', err.message);
      }
    }

    // Default mock fallbacks - only triggers if it is explicitly a mock environment or a mock Place ID.
    // If it's a real API key and we couldn't parse a valid Place ID / CID or failed to fetch, return error.
    if (isMockKey || (placeId && (mockDetails[placeId] || String(placeId).startsWith('mock_place_') || String(placeId).startsWith('mock_addr_')))) {
      let baseDetail = mockDetails[placeId];
      if (!baseDetail) {
        const lowerId = String(placeId || '').toLowerCase();
        const lowerName = String(extractedName || '').toLowerCase();
        if (lowerId.includes('taluk') || lowerId.includes('office') || lowerId.includes('gov') || lowerId.includes('police') || lowerId.includes('municipality') ||
            lowerName.includes('taluk') || lowerName.includes('office') || lowerName.includes('gov') || lowerName.includes('police') || lowerName.includes('municipality')) {
          baseDetail = mockDetails['mock_place_udumalaipettai_taluk_office'];
        } else {
          baseDetail = mockDetails['mock_place_rk_electricals'];
        }
      }
      const detail = {
        logoUrl: "",
        coverImageUrl: "",
        galleryUrls: [],
        ...baseDetail
      };
      return res.json({ success: true, data: detail });
    }

    res.status(404).json({ success: false, message: 'Google Place details not found' });
  } catch (error) {
    console.error('Autofill by link error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});


// @desc    Validate Address and Boundaries
// @route   POST /api/businesses/validate-address
// @access  Public
router.post('/validate-address', async (req, res) => {
  const { address, locality, pincode, latitude, longitude } = req.body;

  if (!pincode) {
    return res.status(400).json({ success: false, message: 'Pincode is required' });
  }

  const { APPROVED_PINCODES } = require('../constants/pincodes');
  if (!APPROVED_PINCODES.includes(pincode)) {
    return res.json({
      success: true,
      isAddressValid: false,
      isWithinBoundary: false,
      message: `Pincode "${pincode}" is outside Udumalpet operational boundaries.`
    });
  }

  if (!address || !address.trim()) {
    return res.json({
      success: true,
      isAddressValid: true,
      isWithinBoundary: true,
      distanceFromCenter: 0,
      message: "Valid pincode selected."
    });
  }

  const udtCenter = { lat: 10.5891, lng: 77.2412 };
  const userLat = parseFloat(latitude) || udtCenter.lat;
  const userLng = parseFloat(longitude) || udtCenter.lng;

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  let geocodedLat = userLat;
  let geocodedLng = userLng;
  let isAddressValid = true;
  let matchMessage = "Address, pincode and coordinates match.";

  if (apiKey) {
    try {
      const fullAddressQuery = `${address || ''} ${locality || ''}, Tamil Nadu, India, ${pincode}`;
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddressQuery)}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results.length > 0) {
        const result = data.results[0];
        geocodedLat = result.geometry.location.lat;
        geocodedLng = result.geometry.location.lng;

        // Check distance between geocoded location and user input coordinates
        const distFromInput = getHaversineDistance(geocodedLat, geocodedLng, userLat, userLng);
        if (distFromInput > 5) {
          isAddressValid = false;
          matchMessage = `Coordinates are ${distFromInput.toFixed(1)} km away from the geocoded address location. Please align the coordinates.`;
        }

        // Verify pincode in geocoded components
        let geocodedPincode = '';
        for (const comp of result.address_components) {
          if (comp.types && comp.types.includes('postal_code')) {
            geocodedPincode = comp.long_name;
            break;
          }
        }
        if (geocodedPincode && geocodedPincode !== pincode && !APPROVED_PINCODES.includes(geocodedPincode)) {
          isAddressValid = false;
          matchMessage = `Address pincode mismatch: geocoded pincode is ${geocodedPincode}.`;
        }
      } else {
        isAddressValid = false;
        matchMessage = `Address could not be validated by Google Geocoding API (Status: ${data.status}).`;
      }
    } catch (error) {
      console.error('Error during validation geocoding:', error.message);
    }
  } else {
    // Mock Validation Fallback (pincode already verified above, check if address is not completely empty)
    if (!address || address.length < 5) {
      isAddressValid = false;
      matchMessage = "Address is too short to validate.";
    }
  }

  // Calculate distance to Udumalpet center
  const distFromCenter = getHaversineDistance(geocodedLat, geocodedLng, udtCenter.lat, udtCenter.lng);
  const isWithinBoundary = distFromCenter <= 35;

  return res.json({
    success: true,
    isAddressValid,
    isWithinBoundary,
    distanceFromCenter: distFromCenter,
    message: matchMessage
  });
});

// @desc    Get business details by ID
// @route   GET /api/businesses/:id
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const skipInc = req.query.skipInc === 'true' || !!req.headers.authorization;
    const idOrSlug = req.id || req.params.id;
    const isObjectId = require('mongoose').Types.ObjectId.isValid(idOrSlug);
    
    let business;
    if (isObjectId) {
      business = skipInc
        ? await Business.findById(idOrSlug).populate('ownerId', 'email phone mobileNumber')
        : await Business.findByIdAndUpdate(idOrSlug, { $inc: { views: 1 } }, { new: true }).populate('ownerId', 'email phone mobileNumber');
    } else {
      const searchSlug = idOrSlug.toLowerCase();
      business = skipInc
        ? await Business.findOne({ slug: searchSlug }).populate('ownerId', 'email phone mobileNumber')
        : await Business.findOneAndUpdate({ slug: searchSlug }, { $inc: { views: 1 } }, { new: true }).populate('ownerId', 'email phone mobileNumber');
        
      if (!business) {
        // Fallback: try searching by name or businessName
        const nameRegex = new RegExp(`^${idOrSlug.replace(/[-_]/g, ' ')}$`, 'i');
        business = skipInc
          ? await Business.findOne({ $or: [{ name: nameRegex }, { businessName: nameRegex }] }).populate('ownerId', 'email phone mobileNumber')
          : await Business.findOneAndUpdate({ $or: [{ name: nameRegex }, { businessName: nameRegex }] }, { $inc: { views: 1 } }, { new: true }).populate('ownerId', 'email phone mobileNumber');
      }
    }

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    await checkAndExpireBusiness(business);

    let bObj = business.toObject();

    // Inject the Google Maps API key from backend environment
    bObj.mapsApiKey = process.env.GOOGLE_MAPS_API_KEY || '';

    // If it's a branch, inherit subscription details from parent and find siblings
    let parentId = business._id;
    if (business.parentBusinessId) {
      const parent = await Business.findById(business.parentBusinessId);
      if (parent) {
        bObj.parentBusiness = parent.toObject();
        bObj.subscriptionStatus = parent.subscriptionStatus;
        bObj.subscriptionExpiry = parent.subscriptionExpiry;
        bObj.isPremium = parent.isPremium;
        parentId = parent._id;
      }
    }

    // Get reviews for this business
    const reviews = await Review.find({ businessId: business._id });
    bObj.reviews = reviews;

    // Get approved branches/siblings for this business
    const branches = await Business.find({ parentBusinessId: parentId, status: 'Approved' });
    bObj.branches = branches;
    bObj.branchesCount = branches.length;

    // Apply restriction if expired
    if (bObj.subscriptionStatus === 'expired') {
      bObj.isRestricted = true;
      // Note: Front-end blurs images and hides WhatsApp, but let's send indicator
    }

    res.json({ success: true, data: bObj });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Invalid business ID format or server error' });
  }
});

// @desc    Add a directory listing anonymously (Pending Verification, Public Sector only)
// @route   POST /api/businesses/anonymous-add
// @access  Public
router.post('/anonymous-add', async (req, res) => {
  try {
    const {
      name,
      requestedParentCategory,
      category,
      customCategoryName,
      address,
      locality,
      phone,
      website,
      description,
      googleMapsLocation,
      googlePlaceId,
      pincode,
      latitude,
      longitude,
      googleRating,
      googleReviewsCount,
      googleReviews,
      logoUrl,
      coverImageUrl,
      galleryUrls
    } = req.body;

    const resolvedName = (name && name.trim()) ? name.trim() : 'Unnamed Public Listing';
    const resolvedParentCategory = requestedParentCategory || 'Public Sector';
    const resolvedCategory = category || 'Others';
    const resolvedPhone = phone || '';
    const resolvedAddress = address || '';
    const resolvedLocality = locality || 'Udumalpet';

    if (resolvedParentCategory !== 'Public Sector') {
      return res.status(400).json({ success: false, message: 'Anonymous directory addition is restricted to Public Sector category listings only.' });
    }

    const resolvedPincode = pincode || '642126';
    const lat = latitude || 10.5891;
    const lng = longitude || 77.2412;

    const geoValidation = await validateAddressAndBoundary(
      `${resolvedAddress} ${resolvedLocality}`.trim(),
      resolvedPincode,
      lat,
      lng
    );
    if (!geoValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: geoValidation.message,
      });
    }

    const User = require('../models/User');
    const adminUser = await User.findOne({ email: 'admin@gmail.com' }) || await User.findOne({ role: 'admin' }) || await User.findOne({ role: 'superadmin' });
    if (!adminUser) {
      return res.status(500).json({ success: false, message: 'Administrative user account not found to associate with listing' });
    }

    const business = await Business.create({
      ownerId: adminUser._id,
      name: resolvedName,
      businessName: resolvedName,
      requestedParentCategory: resolvedParentCategory,
      category: resolvedCategory,
      type: resolvedCategory,
      customCategoryName: resolvedCategory === 'Others' ? customCategoryName : '',
      categoryStatus: (resolvedCategory === 'Others') ? 'Pending Review' : 'Normal',
      address: resolvedAddress || `${resolvedLocality}, Udumalpet`,
      locality: resolvedLocality || 'Udumalpet',
      phone: resolvedPhone,
      whatsapp: resolvedPhone,
      website: website || '',
      description: description || `${resolvedName} is listed in the Udumalpet Business Tour local directory.`,
      googleBusinessLink: googleMapsLocation || '',
      googleMapsLocation: googleMapsLocation || '',
      googlePlaceId: googlePlaceId || '',
      pincode: resolvedPincode,
      latitude: geoValidation.lat,
      longitude: geoValidation.lng,
      coordinates: { lat: geoValidation.lat, lng: geoValidation.lng },
      status: 'Pending Verification',
      verificationStatus: 'pending',
      subscriptionStatus: 'none',
      isPremium: false,
      googleRating: googleRating || 0,
      googleReviewsCount: googleReviewsCount || 0,
      rawGoogleRating: googleRating || 0,
      rawGoogleReviewsCount: googleReviewsCount || 0,
      googleReviews: googleReviews || [],
      logoUrl: logoUrl || '',
      coverImageUrl: coverImageUrl || '',
      galleryUrls: galleryUrls || [],
      galleryImages: galleryUrls || []
    });

    // Notify all admins and superadmins of new anonymous business submission
    try {
      const User = require('../models/User');
      const Notification = require('../models/Notification');
      const adminUsers = await User.find({ role: { $in: ['admin', 'superadmin'] } });
      const notifications = adminUsers.map(adminUser => ({
        userId: adminUser._id,
        businessId: business._id,
        title: 'New Anonymous Listing Pending',
        message: `A new anonymous business "${business.name}" has been submitted and is pending verification.`,
        type: 'approval_status'
      }));
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notifError) {
      console.error('Failed to notify admins of anonymous business addition:', notifError);
    }

    res.status(201).json({ success: true, data: business });
  } catch (error) {
    console.error('Error in anonymous-add route:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a new business listing (Pending Approval)
// @route   POST /api/businesses
// @desc    Register a new business listing
// @route   POST /api/businesses
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      name,
      category,
      type,
      description,
      yearEstablished,
      employeeCount,
      gstNumber,
      services,
      brands,
      highlights,
      phone,
      whatsapp,
      email,
      website,
      instagram,
      facebook,
      address,
      locality,
      pincode,
      isAddressVerified,
      logoUrl,
      coverImageUrl,
      galleryUrls,
      googlePlaceId,
      googleRating,
      googleReviewsCount,
      googleReviews,
      coordinates,
      timings,
      customCategoryName,
      requestedParentCategory,
      categoryStatus,
      offers,
      menuUrls,
      isFoodBusiness,
      languagesKnown,
      serviceArea,
      categories
    } = req.body;

    // 0. Final validation of required fields
    if (!name || !description || !phone || !whatsapp || !pincode ||
        !services || (Array.isArray(services) && services.length === 0) ||
        !highlights || (Array.isArray(highlights) && highlights.length === 0) ||
        !languagesKnown || !languagesKnown.trim() ||
        !serviceArea || !serviceArea.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: Please fill in all required business profile details.',
      });
    }

    // Validate categories array or single fields fallback
    let resolvedCategories = categories;
    if (!resolvedCategories || !Array.isArray(resolvedCategories) || resolvedCategories.length === 0) {
      if (!category || !category.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed: Please select at least one category.',
        });
      }
      resolvedCategories = [{
        category: requestedParentCategory || 'Others',
        type: category,
        customCategoryName: customCategoryName || '',
        categoryStatus: categoryStatus || 'Normal'
      }];
    }

    if (resolvedCategories.length > 5) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed: You can select at most 5 categories.',
      });
    }

    // 1. Address Geocoding & Boundary validation (must be within 35km of Udumalpet center)
    const geoValidation = await validateAddressAndBoundary(
      `${address || ''} ${locality || ''}`,
      pincode,
      coordinates ? coordinates.lat : req.body.latitude,
      coordinates ? coordinates.lng : req.body.longitude
    );
    if (!geoValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: geoValidation.message,
      });
    }

    // 2. Address verification audit
    let finalAddressVerified = isAddressVerified;
    if (address && isAddressVerified) {
      const validAddresses = validAddressesMap[pincode] || [];
      if (!validAddresses.includes(address)) {
        finalAddressVerified = false;
        console.log(`[ADDRESS AUDIT] Free-form or custom address entered: "${address}". Placed in manual audit queue.`);
      }
    }

    // Restrict access: Allow business owners, admins, visitors/writers, and partners to register a business
    if (req.user.role !== 'owner' && req.user.role !== 'merchant' && req.user.role !== 'admin' && req.user.role !== 'visitor' && req.user.role !== 'partner') {
      return res.status(403).json({
        success: false,
        message: 'Registration denied: Authorized role required to register listings.',
      });
    }

    // Automatically upgrade visitor's role to merchant upon registering their business
    if (req.user.role === 'visitor') {
      const User = require('../models/User');
      await User.findByIdAndUpdate(req.user._id, { role: 'merchant' });
      req.user.role = 'merchant';
      console.log(`[ROLE UPGRADE] Upgraded user ${req.user._id} role from visitor to merchant upon registering business.`);
    }

    // Merge/Clean duplicates first to make sure there is at most one business listing
    const isAdminUser = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');
    const isTestUser = 
      (req.user && (
        req.user.email === 'test@gmail.com' || 
        req.user.name === 'xxx' || 
        req.user.fullName === 'xxx' || 
        req.user.phone === '1234567891' || 
        req.user.mobileNumber === '1234567891'
      )) ||
      phone === '1234567891' ||
      email === 'test@gmail.com' ||
      name === 'xxx' ||
      isAdminUser; // Bypasses duplicate deletion for admins

    let business = null;
    if (req.body._id) {
      business = await Business.findOne({ _id: req.body._id, ownerId: req.user._id });
    } else if (!isTestUser) {
      const listings = await Business.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
      if (listings.length > 0) {
        business = listings[0];
        if (listings.length > 1) {
          const deleteIds = listings.slice(1).map(b => b._id);
          await Business.deleteMany({ _id: { $in: deleteIds } });
          console.log(`[DUPLICATE CLEANUP ON CREATE] Deleted ${deleteIds.length} duplicate business listings for owner ${req.user._id}`);
        }
      }
    } else {
      console.log(`[TEST USER BYPASS] Allowed duplicate registration for test/admin account: ${req.user?.email || email}`);
    }

    const updateData = {
      name,
      category,
      type,
      description,
      yearEstablished,
      employeeCount,
      gstNumber,
      services: services || [],
      brands: brands || [],
      highlights: highlights || [],
      tags: (req.body.tags || []).filter(t => t !== 'draft'),
      phone,
      whatsapp,
      email,
      website: website || '',
      instagram: instagram || '',
      facebook: facebook || '',
      address,
      locality,
      pincode,
      isAddressVerified: finalAddressVerified, // set to match verified status
      logoUrl: logoUrl || '',
      coverImageUrl: coverImageUrl || '',
      galleryUrls: galleryUrls || [],
      menuUrls: menuUrls || [],
      isFoodBusiness: isFoodBusiness !== undefined ? isFoodBusiness : false,
      googlePlaceId: googlePlaceId || '',
      googleRating: googleRating || 0,
      googleReviewsCount: googleReviewsCount || 0,
      rawGoogleRating: googleRating || 0,
      rawGoogleReviewsCount: googleReviewsCount || 0,
      googleReviews: googleReviews || [],
      latitude: geoValidation.lat,
      longitude: geoValidation.lng,
      coordinates: { lat: geoValidation.lat, lng: geoValidation.lng },
      timings: timings || {
        Monday: '9:00 AM - 8:00 PM',
        Tuesday: '9:00 AM - 8:00 PM',
        Wednesday: '9:00 AM - 8:00 PM',
        Thursday: '9:00 AM - 8:00 PM',
        Friday: '9:00 AM - 8:00 PM',
        Saturday: '9:00 AM - 8:00 PM',
        Sunday: '9:00 AM - 1:00 PM',
      },
      status: 'Pending Verification',
      subscriptionStatus: business ? (business.subscriptionStatus || 'none') : 'none',
      isPremium: business ? (business.isPremium || false) : false,
      customCategoryName: customCategoryName || undefined,
      requestedParentCategory: requestedParentCategory || undefined,
      categoryStatus: categoryStatus || undefined,
      offers: offers || [],
      languagesKnown: languagesKnown || '',
      serviceArea: serviceArea || '',
      categories: resolvedCategories
    };

    // If user is referred, run anti-fraud checks before creating/updating
    try {
      const Referral = require('../models/Referral');
      const referral = await Referral.findOne({ referredUserId: req.user._id, status: 'pending' });
      if (referral) {
        let duplicateGST = false;
        if (gstNumber) {
          const existingGstBiz = await Business.findOne({
            gstNumber: gstNumber.trim(),
            ownerId: { $ne: req.user._id }
          });
          if (existingGstBiz) duplicateGST = true;
        }

        const existingNameBiz = await Business.findOne({
          $or: [
            { name: name },
            { businessName: name }
          ],
          ownerId: { $ne: req.user._id }
        });
        const duplicateBusiness = !!existingNameBiz;

        let duplicateMobile = false;
        if (phone) {
          const existingPhoneBiz = await Business.findOne({
            $or: [{ phone }, { whatsapp: phone }],
            ownerId: { $ne: req.user._id }
          });
          if (existingPhoneBiz) duplicateMobile = true;
        }

        if (duplicateGST) {
          return res.status(400).json({ success: false, message: 'Referral validation failed: This GST number is already registered on UBT.' });
        }
        if (duplicateBusiness) {
          return res.status(400).json({ success: false, message: 'Referral validation failed: This business name is already registered on UBT.' });
        }
        if (duplicateMobile) {
          return res.status(400).json({ success: false, message: 'Referral validation failed: This mobile number is already registered on UBT.' });
        }
      }
    } catch (err) {
      console.error('Error during pre-save referral checks:', err);
    }

    if (business) {
      if (false && business.subscriptionStatus === 'active') {
        return res.status(400).json({
          success: false,
          message: 'This business registration has already been finalized and subscription is active.',
        });
      }
      Object.assign(business, updateData);
      if (Array.isArray(business.tags)) {
        business.tags = business.tags.filter(t => t !== 'draft');
      }
      await business.save();
    } else {
      business = await Business.create({
        ownerId: req.user._id,
        ...updateData,
      });

      // Notify all admins and superadmins of new business submission
      try {
        const User = require('../models/User');
        const Notification = require('../models/Notification');
        const adminUsers = await User.find({ role: { $in: ['admin', 'superadmin'] } });
        const notifications = adminUsers.map(adminUser => ({
          userId: adminUser._id,
          businessId: business._id,
          title: 'New Business Pending Verification',
          message: `A new business listing "${business.name}" has been submitted by "${req.user.fullName || req.user.name}" and is pending verification.`,
          type: 'approval_status'
        }));
        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
        }
      } catch (notifError) {
        console.error('Failed to notify admins of new business registration:', notifError);
      }
    }

    // Save link to referral
    try {
      const Referral = require('../models/Referral');
      const referral = await Referral.findOne({ referredUserId: req.user._id, status: 'pending' });
      if (referral) {
        referral.referredBusinessId = business._id;
        await referral.save();
      }
    } catch (err) {
      console.error('Error in post-save referral link:', err);
    }

    // Save branches if provided
    if (req.body.branches && Array.isArray(req.body.branches)) {
      try {
        await syncBranches(business, req.body.branches, req.user.role);
        console.log(`[BRANCHES SAVE] Synchronized branches for business ${business._id}`);
      } catch (branchErr) {
        console.error('Error saving branches in business POST route:', branchErr);
      }
    }

    res.status(201).json({ success: true, data: business });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update a business listing
// @route   PUT /api/businesses/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let business = await Business.findById(req.params.id);

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    // Verify owner, admin, or superadmin
    if (business.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this listing' });
    }

    // Geocoding and allowed area boundary validation on update
    if (req.body.address || req.body.pincode || req.body.coordinates || req.body.latitude || req.body.longitude) {
      const checkAddress = req.body.address || business.address || '';
      const checkLocality = req.body.locality || business.locality || '';
      const checkPincode = req.body.pincode || business.pincode;
      const checkLat = req.body.coordinates?.lat || req.body.latitude || business.coordinates?.lat || business.latitude;
      const checkLng = req.body.coordinates?.lng || req.body.longitude || business.coordinates?.lng || business.longitude;

      const geoValidation = await validateAddressAndBoundary(
        `${checkAddress} ${checkLocality}`,
        checkPincode,
        checkLat,
        checkLng
      );
      if (!geoValidation.isValid) {
        return res.status(400).json({
          success: false,
          message: geoValidation.message
        });
      }

      req.body.latitude = geoValidation.lat;
      req.body.longitude = geoValidation.lng;
      req.body.coordinates = {
        lat: geoValidation.lat,
        lng: geoValidation.lng
      };
    }

    // Fraud address verification on update (relaxed to allow free-form addresses)
    if (req.body.address || req.body.pincode) {
      const checkPincode = req.body.pincode || business.pincode;
      const checkAddress = req.body.address || business.address;
      const isVerified = req.body.isAddressVerified !== undefined ? req.body.isAddressVerified : business.isAddressVerified;
      
      if (isVerified) {
        const validAddresses = validAddressesMap[checkPincode] || [];
        if (!validAddresses.includes(checkAddress)) {
          req.body.isAddressVerified = false;
          console.log(`[ADDRESS AUDIT UPDATE] Free-form or custom address updated: "${checkAddress}". Set verified to false.`);
        }
      }
    }

    if (req.body.categories && Array.isArray(req.body.categories)) {
      if (req.body.categories.length === 0) {
        return res.status(400).json({ success: false, message: 'Please select at least one category.' });
      }
      if (req.body.categories.length > 5) {
        return res.status(400).json({ success: false, message: 'You can select at most 5 categories.' });
      }
    }

    // Do not allow updating status or subscription via standard PUT (must be approved via Admin or Payments routes)
    delete req.body.status;
    delete req.body.subscriptionStatus;
    delete req.body.subscriptionExpiry;
    delete req.body.isPremium;
    if (req.body.tags && Array.isArray(req.body.tags)) {
      req.body.tags = req.body.tags.filter(t => t !== 'draft');
    }
    if (req.body.googlePlaceId) {
      req.body.googleLinked = true;
    }

    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      const existingData = (business.pendingEdits && business.pendingEdits.data) ? business.pendingEdits.data : {};
      const mergedData = { ...existingData, ...req.body };
      
      business.pendingEdits = {
        data: mergedData,
        submittedAt: new Date()
      };
      
      await business.save({ validateBeforeSave: false });
      return res.json({ success: true, message: 'Edits submitted for admin approval', data: business, pendingApproval: true });
    }

    Object.assign(business, req.body);
    await business.save();

    // Save branches if provided
    if (req.body.branches && Array.isArray(req.body.branches)) {
      try {
        await syncBranches(business, req.body.branches, req.user.role);
        console.log(`[BRANCHES UPDATE] Synchronized branches for business ${business._id}`);
      } catch (branchErr) {
        console.error('Error saving branches in business PUT route:', branchErr);
      }
    }

    res.json({ success: true, data: business });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @route   POST /api/businesses/draft
// @desc    Save or update business draft progress
// @access  Private
router.post('/draft', protect, async (req, res) => {
  try {
    const fields = req.body;
    if (fields.googlePlaceId) {
      fields.googleLinked = true;
    }
    
    let business = null;
    const isAdminUser = req.user && (req.user.role === 'admin' || req.user.role === 'superadmin');

    if (fields._id) {
      business = await Business.findOne({ _id: fields._id, ownerId: req.user._id });
    } else if (!isAdminUser) {
      // Find existing business for this user (primary listing only)
      business = await Business.findOne({
        ownerId: req.user._id,
        $or: [{ parentBusinessId: null }, { parentBusinessId: { $exists: false } }]
      });
    }
    
    if (business) {
      // If the business is already paid, don't allow modifying it via draft (bypassed in dev mode)
      if (false && business.subscriptionStatus === 'active') {
        return res.status(400).json({ success: false, message: 'Cannot edit an active paid listing via draft.' });
      }
      
      // Update existing draft, excluding metadata/version/owner fields to prevent VersionError
      const { _id, __v, ownerId, createdAt, updatedAt, ...updateFields } = fields;
      Object.assign(business, updateFields);
      if (!Array.isArray(business.tags)) {
        business.tags = [];
      }
      if (!business.tags.includes('draft')) {
        business.tags.push('draft');
      }
      await business.save();
    } else {
      // Create new draft
      business = new Business({
        ownerId: req.user._id,
        ...fields,
        tags: ['draft'],
        status: fields.status || 'Pending Verification',
        subscriptionStatus: fields.subscriptionStatus || 'none',
        isPremium: fields.isPremium !== undefined ? fields.isPremium : false,
      });
      await business.save();
    }

    // Save branches draft if provided
    if (fields.branches && Array.isArray(fields.branches)) {
      try {
        await syncBranches(business, fields.branches, req.user.role);
        console.log(`[BRANCHES DRAFT] Drafted branches for business ${business._id}`);
      } catch (branchErr) {
        console.error('Error saving branches in business draft route:', branchErr);
      }
    }
    
    res.json({ success: true, data: business });
  } catch (error) {
    console.error('Error saving draft:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Sync Google business parameters
// @route   POST /api/businesses/:id/sync-google
// @access  Private
const { syncGoogleBusiness } = require('../controllers/businessController');
router.post('/:id/sync-google', protect, syncGoogleBusiness);

// @desc    Increment click count for a business by action type and record as Lead log
// @route   POST /api/businesses/:id/click
// @access  Public
router.post('/:id/click', async (req, res) => {
  const { type } = req.body;
  const validTypes = ['call', 'whatsapp', 'website', 'instagram', 'facebook', 'email', 'directions', 'phonebook'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ success: false, message: 'Invalid click type' });
  }

  try {
    const updateField = `${type}Clicks`;
    const schemaClicks = ['call', 'whatsapp', 'website', 'instagram', 'facebook', 'directions'];
    
    let business;
    if (schemaClicks.includes(type)) {
      business = await Business.findByIdAndUpdate(
        req.params.id,
        { $inc: { [updateField]: 1 } },
        { new: true }
      );
    } else {
      business = await Business.findById(req.params.id);
    }

    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    // Create a new Lead document for this touch interaction
    let leadName = 'Customer (Click)';
    let leadPhone = '+91 00000 00000';
    let leadMessage = `Clicked '${type.charAt(0).toUpperCase() + type.slice(1)}' button on your profile.`;

    if (type === 'call') {
      leadName = 'Customer (Call)';
      leadMessage = 'Initiated a phone call from your listing profile.';
    } else if (type === 'whatsapp') {
      leadName = 'Customer (WhatsApp)';
      leadMessage = 'Opened WhatsApp chat from your listing profile.';
    } else if (type === 'website') {
      leadName = 'Customer (Website)';
      leadMessage = 'Visited your website link from your listing profile.';
    } else if (type === 'facebook') {
      leadName = 'Customer (Facebook)';
      leadMessage = 'Visited your Facebook page from your listing profile.';
    } else if (type === 'instagram') {
      leadName = 'Customer (Instagram)';
      leadMessage = 'Visited your Instagram profile from your listing profile.';
    } else if (type === 'email') {
      leadName = 'Customer (Email)';
      leadMessage = 'Initiated an email draft from your listing profile.';
    } else if (type === 'directions') {
      leadName = 'Customer (Map Directions)';
      leadMessage = 'Requested navigation directions to your business locality in Google Maps.';
    } else if (type === 'phonebook') {
      leadName = 'Customer (Saved Contact)';
      leadMessage = 'Downloaded your business contact card to save to their phonebook.';
    }

    await Lead.create({
      businessId: req.params.id,
      name: leadName,
      phone: leadPhone,
      message: leadMessage,
      status: 'Pending'
    });

    res.json({ success: true, clicks: schemaClicks.includes(type) ? business[updateField] : 0 });
  } catch (error) {
    console.error(`Error processing click lead for ${type}:`, error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Toggle Like on a business profile
// @route   POST /api/businesses/:id/like
// @access  Public (Optional Auth)
router.post('/:id/like', async (req, res) => {
  try {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ success: false, message: 'Business not found (Invalid ID format)' });
    }
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    // Extract authorization header to check if user is logged in
    let userIdStr = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ubt_jwt_secret_token_123456');
        userIdStr = decoded.id;
      } catch (err) {
        // Continue as guest
      }
    }

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || 'unknown_ip';
    const guestId = req.body.guestId || '';

    // Toggle identifier in likes array
    if (!business.likes) business.likes = [];
    
    let foundIndex = -1;
    let ipMatchIndex = -1;
    for (let i = 0; i < business.likes.length; i++) {
      const likeStr = business.likes[i];
      if (!likeStr) continue;
      const parts = likeStr.split('|');
      
      if (parts.length === 1) {
        const oldId = parts[0];
        if ((userIdStr && oldId === userIdStr) || (guestId && oldId === guestId)) {
          foundIndex = i;
          break;
        }
        if (ip && oldId === ip) {
          ipMatchIndex = i;
        }
      } else {
        const [dbUserId, dbGuestId, dbIp] = parts;
        if (userIdStr && dbUserId === userIdStr) {
          foundIndex = i;
          break;
        }
        if (guestId && dbGuestId === guestId) {
          foundIndex = i;
          break;
        }
        if (ip && dbIp === ip) {
          ipMatchIndex = i;
        }
      }
    }

    if (foundIndex !== -1) {
      business.likes.splice(foundIndex, 1);
    } else if (ipMatchIndex !== -1) {
      // Already liked by this IP, do not add another but do not unlike the other user's like
    } else {
      business.likes.push(`${userIdStr || ''}|${guestId || ''}|${ip}`);
    }

    await business.save();
    
    // Check if the current user/device/IP has liked it now
    let isLikedNow = false;
    for (const likeStr of business.likes) {
      if (!likeStr) continue;
      const parts = likeStr.split('|');
      if (parts.length === 1) {
        if (likeStr === userIdStr || likeStr === guestId || likeStr === ip) {
          isLikedNow = true;
          break;
        }
      } else {
        const [dbUserId, dbGuestId, dbIp] = parts;
        if (userIdStr && dbUserId === userIdStr) { isLikedNow = true; break; }
        if (guestId && dbGuestId === guestId) { isLikedNow = true; break; }
        if (ip && dbIp === ip) { isLikedNow = true; break; }
      }
    }

    res.json({ success: true, likesCount: business.likes.length, isLiked: isLikedNow, data: business.likes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
