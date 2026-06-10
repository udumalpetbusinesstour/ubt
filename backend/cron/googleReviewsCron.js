const cron = require('node-cron');
const Business = require('../models/Business');

/**
 * Fetches the latest Google Place details (rating + up to 5 reviews) for a business
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
        'X-Goog-FieldMask': 'id,rating,userRatingCount,reviews'
      }
    });

    const result = await response.json();

    if (result.error) {
      console.warn(`[GoogleReviewsCron] Places API (New) error for ${placeId}: ${result.error.message}`);
      return null;
    }

    // Map reviews from new API
    let googleReviews = (result.reviews || []).slice(0, 5).map(r => ({
      authorName: r.authorAttribution?.displayName || 'A Google User',
      rating: r.rating || 0,
      text: r.text?.text || '',
      createdAt: r.publishTime ? new Date(r.publishTime) : new Date(),
    }));

    // Fallback to legacy Places Details API if new API returns no reviews
    if (googleReviews.length === 0) {
      try {
        const legacyUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=reviews,rating,user_ratings_total&key=${apiKey}`;
        const legacyResp = await fetch(legacyUrl);
        const legacyData = await legacyResp.json();
        if (legacyData.status === 'OK' && legacyData.result?.reviews) {
          googleReviews = legacyData.result.reviews.slice(0, 5).map(r => ({
            authorName: r.author_name || 'A Google User',
            rating: r.rating || 0,
            text: r.text || '',
            createdAt: new Date(r.time * 1000),
          }));
          console.log(`[GoogleReviewsCron] Fetched ${googleReviews.length} reviews via legacy API for ${placeId}`);
        }
      } catch (legacyErr) {
        console.warn(`[GoogleReviewsCron] Legacy API fallback failed for ${placeId}:`, legacyErr.message);
      }
    }

    return {
      googleRating: result.rating || 0,
      googleReviewsCount: result.userRatingCount || 0,
      googleReviews,
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
        await Business.findByIdAndUpdate(biz._id, {
          googleRating: details.googleRating,
          googleReviewsCount: details.googleReviewsCount,
          googleReviews: details.googleReviews,
          googleLinked: true,
        });
        updated++;
        console.log(
          `[GoogleReviewsCron] ✓ Synced "${biz.name}" — ` +
          `${details.googleRating}★ (${details.googleReviewsCount} reviews, ` +
          `${details.googleReviews.length} fetched)`
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
 * Start the weekly Google Reviews cron.
 * Runs every Sunday at 02:00 AM local time (low traffic window).
 * Also runs once immediately on server boot to prime the data.
 */
const startGoogleReviewsCron = () => {
  // Run once on startup to ensure fresh data
  runGoogleReviewsSync();

  // Schedule weekly: every Sunday at 2:00 AM  (0 2 * * 0)
  cron.schedule('0 2 * * 0', () => {
    console.log('[GoogleReviewsCron] Weekly Sunday 2AM trigger fired.');
    runGoogleReviewsSync();
  });

  console.log('[GoogleReviewsCron] Weekly Google Reviews sync scheduled (Sundays 02:00 AM).');
};

module.exports = {
  runGoogleReviewsSync,
  startGoogleReviewsCron,
};
