const cron = require('node-cron');
const Business = require('../models/Business');
const Review = require('../models/Review');
const Testimonial = require('../models/Testimonial');

const cleanTimingStr = (str) => str.replace(/[\u2013\u2014\u2012\u2010]/g, '-').replace(/[\u202F\u00A0]/g, ' ').trim();

const parseWeekdayDescriptions = (weekdayDescriptions) => {
  if (!Array.isArray(weekdayDescriptions)) return null;
  const timings = {};
  weekdayDescriptions.forEach(desc => {
    const splitIndex = desc.indexOf(':');
    if (splitIndex !== -1) {
      const day = desc.substring(0, splitIndex).trim();
      const time = cleanTimingStr(desc.substring(splitIndex + 1).trim());
      const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
      if (validDays.includes(day)) {
        timings[day] = time;
      }
    }
  });
  return Object.keys(timings).length > 0 ? timings : null;
};

/**
 * Fetches the latest Google Place details (rating + up to 5 reviews + opening hours) for a business
 * using the Google Places API (New) or falls back gracefully if no API key is set.
 */
const fetchGooglePlaceDetails = async (placeId, apiKey) => {
  if (!apiKey) return null;

  try {
    // --- Try new Places API (New) first ---
    const url = `https://places.googleapis.com/v1/places/${placeId}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'id,rating,userRatingCount,reviews,regularOpeningHours'
      }
    });

    const result = await response.json();

    if (result.error) {
      console.warn(`[GoogleReviewsCron] Places API (New) error for ${placeId}: ${result.error.message}`);
      if (result.error.message.toLowerCase().includes('permission') || result.error.message.toLowerCase().includes('not enabled')) {
        console.warn(
          `[GoogleReviewsCron] DIAGNOSTIC TIP: "The caller does not have permission" usually means ` +
          `the "Places API (New)" is not enabled in your Google Cloud Console for the project associated ` +
          `with GOOGLE_MAPS_API_KEY, or your API key restrictions do not authorize this API, or billing is active. ` +
          `Please enable "Places API (New)" and ensure billing is linked.`
        );
      } else if (result.error.message.toLowerCase().includes('expired') || result.error.message.toLowerCase().includes('api key')) {
        console.warn(
          `[GoogleReviewsCron] DIAGNOSTIC TIP: The API key has expired or is invalid. Please renew it.`
        );
      }
      return null;
    }

    let timings = null;
    if (result.regularOpeningHours?.weekdayDescriptions) {
      timings = parseWeekdayDescriptions(result.regularOpeningHours.weekdayDescriptions);
    }

    // Map reviews from new API
    let googleReviews = (result.reviews || []).slice(0, 5).map(r => ({
      authorName: r.authorAttribution?.displayName || 'A Google User',
      rating: r.rating || 0,
      text: r.text?.text || '',
      createdAt: r.publishTime ? new Date(r.publishTime) : new Date(),
    }));

    // Fallback to legacy Places Details API if new API returns no reviews or if we need opening hours
    if (googleReviews.length === 0 || !timings) {
      try {
        const legacyUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total,opening_hours&key=${apiKey}`;
        const legacyResp = await fetch(legacyUrl);
        const legacyData = await legacyResp.json();
        if (legacyData.status === 'OK') {
          if (legacyData.result?.reviews && googleReviews.length === 0) {
            googleReviews = legacyData.result.reviews.slice(0, 5).map(r => ({
              authorName: r.author_name || 'A Google User',
              rating: r.rating || 0,
              text: r.text || '',
              createdAt: new Date(r.time * 1000),
            }));
          }
          if (!timings && legacyData.result?.opening_hours?.weekday_text) {
            timings = parseWeekdayDescriptions(legacyData.result.opening_hours.weekday_text);
          }
          console.log(`[GoogleReviewsCron] Fetched legacy details for ${placeId}`);
        }
      } catch (legacyErr) {
        console.warn(`[GoogleReviewsCron] Legacy API fallback failed for ${placeId}:`, legacyErr.message);
      }
    }

    return {
      googleRating: result.rating || 0,
      googleReviewsCount: result.userRatingCount || 0,
      googleReviews,
      timings,
    };
  } catch (err) {
    console.error(`[GoogleReviewsCron] Fetch error for placeId ${placeId}:`, err.message);
    return null;
  }
};

/**
 * Main review sync function — finds all businesses with a googlePlaceId and
 * refreshes their rating, total count, and up to 5 recent review texts.
 */
const runGoogleReviewsSync = async () => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('[GoogleReviewsCron] GOOGLE_MAPS_API_KEY not set — skipping review sync.');
    return;
  }

  console.log('[GoogleReviewsCron] Starting weekly Google Reviews sync...');

  try {
    // Find all businesses that have a linked Google Place ID
    const businesses = await Business.find({
      googlePlaceId: { $exists: true, $ne: '' }
    }).select('_id name googlePlaceId');

    console.log(`[GoogleReviewsCron] Found ${businesses.length} businesses with Google Place IDs.`);

    let updated = 0;
    let failed = 0;

    for (const biz of businesses) {
      // Skip mock place IDs used for development/testing
      if (biz.googlePlaceId.startsWith('mock_')) {
        continue;
      }

      const details = await fetchGooglePlaceDetails(biz.googlePlaceId, apiKey);

      if (details) {
        // Fetch all local reviews for this business
        const allLocalReviews = await Review.find({ businessId: biz._id });
        const localCount = allLocalReviews.length;
        const localSum = allLocalReviews.reduce((sum, r) => sum + r.rating, 0);

        // Compute combined count and rating
        const rawGoogleReviewsCount = details.googleReviewsCount || 0;
        const rawGoogleRating = details.googleRating || 0;

        const combinedReviewsCount = localCount + rawGoogleReviewsCount;
        let combinedRating = rawGoogleRating;
        if (combinedReviewsCount > 0) {
          const googleWeight = rawGoogleRating * rawGoogleReviewsCount;
          combinedRating = (localSum + googleWeight) / combinedReviewsCount;
        }

        const updateData = {
          rawGoogleRating,
          rawGoogleReviewsCount,
          googleRating: Number(combinedRating.toFixed(1)),
          googleReviewsCount: combinedReviewsCount,
          googleReviews: details.googleReviews,
          googleLinked: true,
        };
        if (details.timings) {
          updateData.timings = details.timings;
        }
        await Business.findByIdAndUpdate(biz._id, updateData);
        updated++;
        console.log(
          `[GoogleReviewsCron] ✓ Synced "${biz.name}" — ` +
          `Google: ${rawGoogleRating}★ (${rawGoogleReviewsCount} reviews), ` +
          `Combined: ${combinedRating.toFixed(1)}★ (${combinedReviewsCount} reviews)`
        );
      } else {
        failed++;
      }

      // Throttle API calls — 200ms delay between requests to avoid rate-limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(
      `[GoogleReviewsCron] Weekly sync complete — ${updated} updated, ${failed} failed.`
    );
  } catch (err) {
    console.error('[GoogleReviewsCron] Sync error:', err.message);
  }
};

/**
 * Syncs UBT's Google My Business reviews into the Testimonial collection.
 * Falls back to high-quality mock reviews if no Place ID is configured.
 */
const runUbtTestimonialsSync = async () => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const placeId = process.env.GOOGLE_PLACES_UBT_PLACE_ID;
  
  console.log('[GoogleReviewsCron] Starting UBT Testimonials sync...');

  // Fallback if Place ID is mock or empty or no API key
  if (!placeId || placeId === 'mock_ubt_place_id' || !apiKey) {
    console.log('[GoogleReviewsCron] GOOGLE_PLACES_UBT_PLACE_ID is empty or set to mock. Bypassing mock GMB testimonials seeding.');
    return;
  }

  try {
    const details = await fetchGooglePlaceDetails(placeId, apiKey);
    if (!details || !details.googleReviews) {
      console.warn('[GoogleReviewsCron] Failed to fetch reviews for UBT Place ID:', placeId);
      return;
    }

    let inserted = 0;
    for (const r of details.googleReviews) {
      if (!r.text || !r.text.trim()) {
        continue;
      }

      // Check if testimonial already exists by name and text
      const existing = await Testimonial.findOne({ authorName: r.authorName, text: r.text });
      if (!existing) {
        await Testimonial.create({
          authorName: r.authorName,
          role: 'Other',
          text: r.text,
          rating: r.rating,
          status: 'Approved',
          createdAt: r.createdAt || new Date(),
          googleLinked: true
        });
        inserted++;
      }
    }
    console.log(`[GoogleReviewsCron] UBT Testimonials sync complete — ${inserted} new reviews imported.`);
  } catch (err) {
    console.error('[GoogleReviewsCron] UBT Testimonials sync error:', err.message);
  }
};

/**
 * Start the weekly Google Reviews cron.
 * Runs every Sunday at 02:00 AM local time (low traffic window).
 * Also runs once immediately on server boot to prime the data.
 */
const startGoogleReviewsCron = () => {
  // Run once on startup to ensure fresh data
  runGoogleReviewsSync();
  runUbtTestimonialsSync();

  // Schedule weekly: every Sunday at 2:00 AM  (0 2 * * 0)
  cron.schedule('0 2 * * 0', () => {
    console.log('[GoogleReviewsCron] Weekly Sunday 2AM trigger fired.');
    runGoogleReviewsSync();
    runUbtTestimonialsSync();
  });

  console.log('[GoogleReviewsCron] Weekly Google Reviews sync scheduled (Sundays 02:00 AM).');
};

module.exports = {
  runGoogleReviewsSync,
  runUbtTestimonialsSync,
  startGoogleReviewsCron,
};
