const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Business = require('../models/Business');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// @desc    Get reviews for a specific business
// @route   GET /api/reviews/:businessId
// @access  Public (Optional Authentication to reveal emails for merchant/admin)
router.get('/:businessId', async (req, res) => {
  try {
    let isOwnerOrAdmin = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (user) {
          const business = await Business.findById(req.params.businessId);
          if (business && (business.ownerId.toString() === user._id.toString() || user.role === 'admin' || user.role === 'superadmin')) {
            isOwnerOrAdmin = true;
          }
        }
      } catch (err) {
        // Token verification failed or user not found - treat as guest
      }
    }

    const reviews = await Review.find({ businessId: req.params.businessId }).sort({ createdAt: -1 });

    const sanitizedReviews = reviews.map(r => {
      const doc = r.toObject();
      if (!isOwnerOrAdmin) {
        delete doc.authorEmail;
      }
      return doc;
    });

    res.json({ success: true, count: sanitizedReviews.length, data: sanitizedReviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Add a review for a business (Public - No Login Required!)
// @route   POST /api/reviews/:businessId
// @access  Public
router.post('/:businessId', async (req, res) => {
  try {
    const { authorName, authorEmail, rating, text } = req.body;
    const businessId = req.params.businessId;

    if (!authorName || !authorEmail || !rating || !text) {
      return res.status(400).json({ success: false, message: 'Author name, email, rating, and review text are required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(authorEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be a number between 1 and 5' });
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    // Create local review
    const review = await Review.create({
      businessId,
      authorName,
      authorEmail,
      rating: numericRating,
      text,
      source: 'local',
    });

    // Recalculate average rating for Google Business / overall reviews
    const allReviews = await Review.find({ businessId });
    const localCount = allReviews.length;
    const localSum = allReviews.reduce((sum, r) => sum + r.rating, 0);

    // Merge with raw Google Rating for total display rating
    const rawGoogleReviewsCount = business.rawGoogleReviewsCount || 0;
    const rawGoogleRating = business.rawGoogleRating || 0;

    const totalCount = localCount + rawGoogleReviewsCount;
    let newAvgRating = 0;
    if (totalCount > 0) {
      const googleWeight = rawGoogleRating * rawGoogleReviewsCount;
      newAvgRating = (localSum + googleWeight) / totalCount;
    }

    // Update business rating using raw Google baseline
    business.googleRating = Number(newAvgRating.toFixed(1));
    business.googleReviewsCount = totalCount;
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
      const localSum = allReviews.reduce((sum, r) => sum + r.rating, 0);

      const rawGoogleReviewsCount = business.rawGoogleReviewsCount || 0;
      const rawGoogleRating = business.rawGoogleRating || 0;

      const totalCount = localCount + rawGoogleReviewsCount;
      let newAvgRating = 0;
      if (totalCount > 0) {
        const googleWeight = rawGoogleRating * rawGoogleReviewsCount;
        newAvgRating = (localSum + googleWeight) / totalCount;
      } else {
        // Fallback to default if no reviews at all
        newAvgRating = business.googlePlaceId ? (rawGoogleRating || 5.0) : 5.0;
      }

      business.googleRating = Number(newAvgRating.toFixed(1));
      business.googleReviewsCount = totalCount;
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
