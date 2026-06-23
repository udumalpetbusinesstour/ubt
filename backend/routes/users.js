const express = require('express');
const router = express.Router();
const { protect, admin, superadmin } = require('../middleware/auth');
const User = require('../models/User');
const Business = require('../models/Business');
const { sendSuccess, sendError } = require('../utils/responseHelper');

const Blog = require('../models/Blog');
const Event = require('../models/Event');
const mongoose = require('mongoose');

// GET /api/users/public/:id - Get public profile data (user, businesses, blogs, events)
router.get('/public/:id', async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Support offline mock fallbacks
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const mockUsers = {
        'author_fallback_1': { fullName: 'Ananth Sundar', role: 'writer', createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), website: 'www.ananthsundar.com', instagram: '@ananthsundar', facebook: 'ananthsundar.fb' },
        'author_fallback_2': { fullName: 'Senthil Kumar', role: 'writer', createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), website: 'www.senthilkumar.me', instagram: '@senthil_writer', facebook: 'senthil.kumar.fb' },
        'author_fallback_3': { fullName: 'Priya Ramesh', role: 'writer', createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), website: 'www.priyaramesh.in', instagram: '@priya_photos', facebook: 'priyaramesh.fb' }
      };
      
      const matchedUser = mockUsers[userId] || { fullName: 'Udumalpet Guide', role: 'visitor', createdAt: new Date(), website: '', instagram: '', facebook: '' };
      
      return sendSuccess(res, 200, 'Public profile details retrieved (Mock Fallback)', {
        user: {
          _id: userId,
          fullName: matchedUser.fullName,
          role: matchedUser.role,
          createdAt: matchedUser.createdAt,
          status: 'Active',
          website: matchedUser.website,
          instagram: matchedUser.instagram,
          facebook: matchedUser.facebook,
        },
        blogs: [],
        businesses: [],
        events: []
      });
    }

    const user = await User.findById(userId).select('fullName name email mobileNumber phone role profileImage createdAt status website instagram facebook');
    if (!user) {
      return sendError(res, 404, 'User account not found');
    }

    if (user.status === 'Suspended') {
      return sendError(res, 403, 'This user account is suspended');
    }

    // Fetch approved businesses, blogs, and events owned/authored by this user
    const blogs = await Blog.find({ 
      $or: [{ author: user._id }, { authorId: user._id }],
      status: 'Approved' 
    }).sort({ createdAt: -1 });

    const businesses = await Business.find({ 
      ownerId: user._id, 
      status: 'Approved' 
    }).sort({ createdAt: -1 });

    const events = await Event.find({ 
      $or: [{ ownerId: user._id }, { authorId: user._id }],
      status: 'Approved' 
    }).sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Public profile details retrieved successfully', {
      user,
      blogs,
      businesses,
      events
    });
  } catch (err) {
    next(err);
  }
});

// Protect all user management routes
router.use(protect);

// GET /api/users - Get all users (Admin or Superadmin)
router.get('/', admin, async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Users retrieved successfully', users);
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id - Get user details
router.get('/:id', admin, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return sendError(res, 404, 'User account not found');
    }
    const business = await Business.findOne({ ownerId: user._id });
    return sendSuccess(res, 200, 'User details retrieved', { user, business });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id/status - Block/Unblock or Suspend/Reactivate user
router.put('/:id/status', admin, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['Active', 'Suspended'].includes(status)) {
      return sendError(res, 400, 'Invalid status parameter. Must be "Active" or "Suspended"');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 404, 'User account not found');
    }

    user.status = status;
    await user.save();

    // Cascade suspension of business listings if user is suspended
    if (status === 'Suspended') {
      await Business.updateMany(
        { ownerId: user._id },
        { status: 'Suspended', verificationStatus: 'suspended', isPremium: false, subscriptionStatus: 'none' }
      );
    } else {
      // Auto reactivate business to Approved if they are reactivated
      await Business.updateMany(
        { ownerId: user._id },
        { status: 'Approved', verificationStatus: 'approved' }
      );
    }

    return sendSuccess(res, 200, `User account marked as ${status} successfully`, user);
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id/role - Super Admin only: manage roles
router.put('/:id/role', superadmin, async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['visitor', 'merchant', 'owner', 'admin', 'superadmin'].includes(role)) {
      return sendError(res, 400, 'Invalid role specification');
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 404, 'User account not found');
    }

    user.role = role;
    await user.save();

    return sendSuccess(res, 200, `Role updated to ${role} successfully`, user);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:id - Admin or Super Admin: permanently delete user and cascades
router.delete('/:id', admin, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    const userId = user._id;

    // Find all businesses owned by this user
    const userBusinesses = await Business.find({ ownerId: userId }).select('_id');
    const businessIds = userBusinesses.map(b => b._id);

    // Dynamic requires for cascade collections
    const Review = require('../models/Review');
    const Subscription = require('../models/Subscription');
    const Payment = require('../models/Payment');

    // Cascade deletes associated with the user's businesses
    if (businessIds.length > 0) {
      await Review.deleteMany({ businessId: { $in: businessIds } });
      await Event.deleteMany({ businessId: { $in: businessIds } });
      await Blog.deleteMany({ businessId: { $in: businessIds } });
      await Subscription.deleteMany({ businessId: { $in: businessIds } });
      await Payment.deleteMany({ businessId: { $in: businessIds } });
      await Business.deleteMany({ _id: { $in: businessIds } });
    }

    // Cascade deletes of user's directly owned blogs and events (where businessId might be empty)
    await Blog.deleteMany({ $or: [{ author: userId }, { authorId: userId }] });
    await Event.deleteMany({ $or: [{ ownerId: userId }, { authorId: userId }] });

    // Cascade deletes of reviews and subscriptions directly linked to this user
    await Review.deleteMany({ userId: userId });
    await Subscription.deleteMany({ ownerId: userId });

    // Delete user's own business listings (just to be safe)
    await Business.deleteMany({ ownerId: userId });

    // Finally delete the user account itself
    await User.deleteOne({ _id: userId });

    return sendSuccess(res, 200, 'User account and all owned assets permanently purged from database.');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
