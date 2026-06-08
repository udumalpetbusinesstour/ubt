const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Business = require('../models/Business');

// @desc    Get reviews for a specific business
// @route   GET /api/reviews/:businessId
// @access  Public
router.get('/:businessId', async (req, res) => {
  try {
    const reviews = await Review.find({ businessId: req.params.businessId }).sort({ createdAt: -1 });
    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Add a review for a business (Public - No Login Required!)
// @route   POST /api/reviews/:businessId
// @access  Public
router.post('/:businessId', async (req, res) => {
  try {
    const { authorName, rating, text } = req.body;
    const businessId = req.params.businessId;

    if (!authorName || !rating || !text) {
      return res.status(400).json({ success: false, message: 'Author name, rating, and review text are required' });
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    // Create local review
    const review = await Review.create({
      businessId,
      authorName,
      rating: Number(rating),
      text,
      source: 'local',
    });

    // Recalculate average rating for Google Business / overall reviews
    const allReviews = await Review.find({ businessId });
    const localCount = allReviews.length;
    const localSum = allReviews.reduce((sum, r) => sum + r.rating, 0);

    // Merge with existing Google Rating for total display rating
    let newAvgRating = localSum / localCount;
    if (business.googlePlaceId && business.googleRating) {
      // Weight average between Google reviews and local reviews
      const totalCount = localCount + (business.googleReviewsCount || 0);
      const googleWeight = (business.googleRating * (business.googleReviewsCount || 0));
      newAvgRating = (localSum + googleWeight) / totalCount;
    }

    // Update business rating
    business.googleRating = Number(newAvgRating.toFixed(1));
    business.googleReviewsCount = localCount + (business.googleReviewsCount || 0);
    await business.save();

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Moderate user reviews (approve, hide, spam, delete)
// @route   PUT /status
// @access  Private/Admin
const { protect, admin } = require('../middleware/auth');
const { moderateReview } = require('../controllers/adminController');
router.put('/status', protect, admin, moderateReview);

// @desc    Get all local reviews for admin moderation
// @route   GET /
// @access  Private/Admin
router.get('/', protect, admin, async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate('businessId', 'name businessName')
      .sort({ createdAt: -1 });
    res.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    next(error);
  }
});

// @desc    Reply to a review (Owner only)
// @route   PUT /api/reviews/:reviewId/reply
// @access  Private
router.put('/:reviewId/reply', protect, async (req, res) => {
  try {
    const { replyText } = req.body;
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const business = await Business.findById(review.businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    // Verify ownership (or admin status)
    if (business.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Not authorized to reply to this review' });
    }

    review.replyText = replyText;
    review.replyDate = new Date();
    await review.save();

    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Moderate a review (Owner only)
// @route   PUT /api/reviews/:reviewId/moderate
// @access  Private
router.put('/:reviewId/moderate', protect, async (req, res) => {
  try {
    const { action } = req.body; // 'approved', 'hidden', 'flagged', 'spam', 'delete'
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Review not found' });
    }

    const business = await Business.findById(review.businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    // Verify ownership (or admin status)
    if (business.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Not authorized to moderate this review' });
    }

    if (action === 'delete') {
      await Review.deleteOne({ _id: req.params.reviewId });
      // Recalculate average rating
      const allReviews = await Review.find({ businessId: business._id });
      const localCount = allReviews.length;
      if (localCount === 0) {
        business.googleRating = business.googlePlaceId ? (business.googleRating || 5.0) : 5.0;
        business.googleReviewsCount = business.googlePlaceId ? (business.googleReviewsCount || 0) : 0;
      } else {
        const localSum = allReviews.reduce((sum, r) => sum + r.rating, 0);
        let newAvgRating = localSum / localCount;
        if (business.googlePlaceId && business.googleRating) {
          const totalCount = localCount + (business.googleReviewsCount || 0);
          const googleWeight = (business.googleRating * (business.googleReviewsCount || 0));
          newAvgRating = (localSum + googleWeight) / totalCount;
        }
        business.googleRating = Number(newAvgRating.toFixed(1));
        business.googleReviewsCount = localCount + (business.googleReviewsCount || 0);
      }
      await business.save();
      return res.json({ success: true, message: 'Review permanently deleted' });
    }

    review.status = action;
    await review.save();
    res.json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
