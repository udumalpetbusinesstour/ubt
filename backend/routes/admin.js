const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const Business = require('../models/Business');
const Subscription = require('../models/Subscription');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { submitToGoogleIndexing } = require('../services/indexingService');

const {
  moderateBusiness,
  moderateBlog,
  moderateEvent,
  moderateReview,
  moderateUser
} = require('../controllers/adminController');
const {
  getPendingCategoryReviews,
  resolveCategoryReview,
  mergeCategories
} = require('../controllers/superadminController');

// Protect all admin routes
router.use(protect);
router.use(admin);

// @desc    Get dashboard statistics for Admin
// @route   GET /api/admin/stats
// @access  Private/Admin
router.get('/stats', async (req, res, next) => {
  try {
    const totalCount = await Business.countDocuments();
    const pendingCount = await Business.countDocuments({ status: 'Pending Verification' });
    const underReviewCount = await Business.countDocuments({ status: 'Under Review' });
    const approvedCount = await Business.countDocuments({ status: 'Approved' });
    const rejectedCount = await Business.countDocuments({ status: 'Rejected' });
    const suspendedCount = await Business.countDocuments({ status: 'Suspended' });

    // Subscriptions
    const activeSubs = await Business.countDocuments({ subscriptionStatus: 'active' });
    const expiredSubs = await Business.countDocuments({ subscriptionStatus: 'expired' });

    // Users counts
    const totalUsers = await User.countDocuments();
    const merchantsCount = await User.countDocuments({ role: 'merchant' });

    res.json({
      success: true,
      stats: {
        totalBusinesses: totalCount,
        pendingApprovals: pendingCount + underReviewCount,
        pendingVerification: pendingCount,
        underReview: underReviewCount,
        approvedBusinesses: approvedCount,
        rejectedBusinesses: rejectedCount,
        suspendedBusinesses: suspendedCount,
        deactivatedBusinesses: suspendedCount,
        activeSubscriptions: activeSubs,
        expiredSubscriptions: expiredSubs,
        totalUsers,
        totalMerchants: merchantsCount
      },
    });
  } catch (error) {
    next(error);
  }
});

router.get('/businesses', async (req, res, next) => {
  try {
    const businesses = await Business.find().populate('ownerId', 'fullName name email phone mobileNumber status role referralPoints').sort({ createdAt: -1 });
    const data = await Promise.all(businesses.map(async (b) => {
      const bObj = b.toObject();
      bObj.branchCount = await Business.countDocuments({ parentBusinessId: b._id });
      return bObj;
    }));
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    next(error);
  }
});

// @desc    Add a directory listing directly (Approved status, no subscription validation)
// @route   POST /api/admin/businesses/directory-add
// @access  Private/Admin
router.post('/businesses/directory-add', async (req, res, next) => {
  try {
    const {
      name,
      requestedParentCategory,
      category,
      customCategoryName,
      categoryStatus,
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

    if (!name || !requestedParentCategory || !category) {
      return res.status(400).json({ success: false, message: 'Name, Main Category, and Subcategory are required' });
    }

    const resolvedPincode = pincode || '642126';
    const lat = latitude || 10.5891;
    const lng = longitude || 77.2412;

    const business = await Business.create({
      ownerId: req.user._id,
      name,
      businessName: name,
      requestedParentCategory,
      category,
      type: category, // Keep type synced with category for backward compatibility
      customCategoryName: category === 'Others' ? customCategoryName : '',
      categoryStatus: categoryStatus || 'Normal',
      address: address || `${locality}, Udumalpet`,
      locality: locality || 'Udumalpet',
      phone: phone || '04252 223456',
      whatsapp: phone || '04252 223456',
      website: website || '',
      description: description || `${name} is listed in the Udumalpet Business Tour local directory.`,
      googleBusinessLink: googleMapsLocation || '',
      googleMapsLocation: googleMapsLocation || '',
      googlePlaceId: googlePlaceId || '',
      pincode: resolvedPincode,
      latitude: lat,
      longitude: lng,
      coordinates: { lat, lng },
      status: 'Approved',
      verificationStatus: 'approved',
      subscriptionStatus: 'active',
      isPremium: false,
      googleRating: googleRating || 0,
      googleReviewsCount: googleReviewsCount || 0,
      googleReviews: googleReviews || [],
      logoUrl: logoUrl || '',
      coverImageUrl: coverImageUrl || '',
      galleryUrls: galleryUrls || [],
      galleryImages: galleryUrls || []
    });

    res.status(201).json({ success: true, data: business });
  } catch (error) {
    next(error);
  }
});

// @desc    Moderate business listing (approve, reject, suspend)
// @route   POST /api/admin/businesses/moderate
// @access  Private/Admin
router.post('/businesses/moderate', moderateBusiness);

// @desc    Approve/Reject/Deactivate a business profile (backward compatibility)
// @route   PUT /api/admin/businesses/:id/status
// @access  Private/Admin
router.put('/businesses/:id/status', async (req, res, next) => {
  try {
    const { status, isFoundingMember } = req.body;
    const business = await Business.findById(req.params.id).populate('ownerId');
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    business.status = status;
    if (status === 'Approved') {
      business.isAddressVerified = true;
      business.verificationStatus = 'approved';
      business.subscriptionStatus = 'active';
    } else if (status === 'Rejected') {
      business.verificationStatus = 'rejected';
    } else if (status === 'Hidden') {
      business.verificationStatus = 'hidden';
    }

    if (typeof isFoundingMember === 'boolean') {
      business.isFoundingMember = isFoundingMember;
      if (business.ownerId) {
        const ownerUserId = business.ownerId._id || business.ownerId;
        await User.findByIdAndUpdate(ownerUserId, { isFoundingMember });
      }
    } else if (status === 'Suspended') {
      business.verificationStatus = 'suspended';
      business.subscriptionStatus = 'none';
      business.isPremium = false;
    }
    
    // Sync status of all branches of this business
    try {
      const branchStatus = status === 'Approved' ? 'Approved' : (status === 'Suspended' ? 'Suspended' : (status === 'Rejected' ? 'Rejected' : (status === 'Hidden' ? 'Hidden' : 'Pending Verification')));
      const statusMap = {
        'Pending Verification': 'pending',
        'Under Review': 'under_review',
        'Approved': 'approved',
        'Rejected': 'rejected',
        'Suspended': 'suspended',
        'Hidden': 'hidden'
      };
      await Business.updateMany(
        { parentBusinessId: business._id },
        { status: branchStatus, verificationStatus: statusMap[branchStatus] || 'pending' }
      );
      console.log(`[BRANCHES MODERATION] Marked branches for business ${business._id} as ${branchStatus}`);
    } catch (branchModErr) {
      console.error('Error updating branch statuses during business moderation:', branchModErr);
    }
    
    await business.save({ validateBeforeSave: false });

    // Google Indexing API submission if the listing becomes Approved or Deindexed
    if (business.status === 'Approved') {
      const targetUrl = `https://udumalpet.business/businesses/${business.slug || business._id}`;
      submitToGoogleIndexing(targetUrl, 'URL_UPDATED').catch(err => {
        console.error('[Google Indexing API Async Error] Approval submission failed:', err);
      });
    } else if (['Suspended', 'Rejected', 'Hidden'].includes(business.status)) {
      const targetUrl = `https://udumalpet.business/businesses/${business.slug || business._id}`;
      submitToGoogleIndexing(targetUrl, 'URL_DELETED').catch(err => {
        console.error('[Google Indexing API Async Error] Deletion submission failed:', err);
      });
    }

    if (status === 'Approved') {
      const { checkAndCompleteReferralByBusiness } = require('../utils/referralHelper');
      await checkAndCompleteReferralByBusiness(business._id);
    }

    await Notification.create({
      userId: business.ownerId ? (business.ownerId._id || business.ownerId) : null,
      businessId: business._id,
      title: 'Listing Moderation Update',
      message: `Your business "${business.name}" has been ${status.toLowerCase()} by the administrator.`,
      type: 'approval_status',
    });

    if (business.ownerId && business.ownerId.email) {
      const ownerName = business.ownerId.fullName || business.ownerId.name || 'Merchant';
      const { sendEmail } = require('../utils/emailHelper');
      try {
        await sendEmail({
          to: business.ownerId.email,
          subject: `Listing Moderation Update: "${business.name}"`,
          text: `Hello ${ownerName},\n\nYour business directory listing "${business.name}" has been updated by the administrator.\n\nStatus: ${status}\n\nPlease log in to your dashboard for details.\n\nBest regards,\nUBT Moderation Team`
        });
      } catch (err) {
        console.error('[SMTP] Failed to send business status email:', err.message);
      }
    }

    res.json({ success: true, message: `Business successfully ${status}`, data: business });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete a business listing permanently
// @route   DELETE /api/admin/businesses/:id
// @access  Private/Admin
router.delete('/businesses/:id', async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    const bizName = business.name;
    const bizId = business._id;
    const ownerId = business.ownerId;

    // Perform cascade delete of associated collections: reviews, events, blogs, subscriptions, payments
    const Review = require('../models/Review');
    const Event = require('../models/Event');
    const Blog = require('../models/Blog');
    const Subscription = require('../models/Subscription');
    const Payment = require('../models/Payment');

    await Review.deleteMany({ businessId: bizId });
    await Event.deleteMany({ businessId: bizId });
    await Blog.deleteMany({ businessId: bizId });
    await Subscription.deleteMany({ businessId: bizId });
    await Payment.deleteMany({ businessId: bizId });
    
    await Business.deleteOne({ _id: bizId });

    // Send notification
    const Notification = require('../models/Notification');
    await Notification.create({
      userId: ownerId,
      title: `Listing Deleted`,
      message: `Your listing directory "${bizName}" was permanently removed by admin control desk.`,
      type: 'approval_status'
    });

    res.json({ success: true, message: 'Listing and all cascaded collections removed successfully' });
  } catch (error) {
    next(error);
  }
});

// @desc    Toggle premium visibility override
// @route   PUT /api/admin/businesses/:id/premium
// @access  Private/Admin
router.put('/businesses/:id/premium', async (req, res, next) => {
  try {
    const { isPremium } = req.body;
    if (typeof isPremium !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isPremium must be a boolean' });
    }

    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    business.isPremium = isPremium;
    if (isPremium) {
      business.subscriptionStatus = 'active';
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 365);
      business.subscriptionExpiry = expiry;
    } else {
      business.subscriptionStatus = 'none';
      business.subscriptionExpiry = null;
    }

    await business.save();
    res.json({ success: true, message: `Premium visibility toggled to ${isPremium}`, data: business });
  } catch (error) {
    next(error);
  }
});

// @desc    Moderate blogs (approve, reject)
// @route   PUT /api/admin/blogs/moderate
// @access  Private/Admin
router.put('/blogs/moderate', moderateBlog);

// @desc    Moderate events (approve, reject)
// @route   PUT /api/admin/events/moderate
// @access  Private/Admin
router.put('/events/moderate', moderateEvent);

// @desc    Moderate reviews (approve, hide, spam, delete)
// @route   PUT /api/admin/reviews/moderate
// @access  Private/Admin
router.put('/reviews/moderate', moderateReview);

// @desc    Moderate users (suspend, block/unblock)
// @route   PUT /api/admin/users/moderate
// @access  Private/Admin
router.put('/users/moderate', moderateUser);

// @desc    Send custom platform notification
// @route   POST /api/admin/notifications/send
// @access  Private/Admin
router.post('/notifications/send', async (req, res, next) => {
  try {
    const { userId, title, message, type } = req.body;
    if (!userId || !message) {
      return res.status(400).json({ success: false, message: 'userId and message parameters are required' });
    }

    const notification = await Notification.create({
      userId,
      title: title || 'System Update',
      message,
      type: type || 'broadcast'
    });

    res.status(201).json({ success: true, message: 'Notification dispatched successfully', data: notification });
  } catch (error) {
    next(error);
  }
});

// @desc    Broadcast platform-wide notification
// @route   POST /api/admin/notifications/broadcast
// @access  Private/Admin
router.post('/notifications/broadcast', async (req, res, next) => {
  try {
    const { title, message } = req.body;
    if (!title || !message) {
      return res.status(400).json({ success: false, message: 'Title and message parameters are required' });
    }

    // Find all users who are merchants, owners, admins, or superadmins
    const users = await User.find({ role: { $in: ['merchant', 'owner', 'admin', 'superadmin'] } });
    
    // Create notification documents
    const notifications = users.map(u => ({
      userId: u._id,
      title,
      message,
      type: 'broadcast'
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json({ 
      success: true, 
      message: `System notification broadcast successfully to ${notifications.length} users.` 
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Approve/Reject/Deactivate a business branch
// @route   PUT /api/admin/branches/:id/status
// @access  Private/Admin
// @desc    Activate a business listing subscription for 30 days
// @route   PUT /api/admin/businesses/:id/activate-subscription
// @access  Private/SuperAdmin Only
router.put('/businesses/:id/activate-subscription', async (req, res, next) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Access denied: Only SuperAdmin can manually activate subscriptions' });
    }

    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    business.subscriptionStatus = 'active';
    business.subscriptionExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    business.isPremium = true;
    await business.save({ validateBeforeSave: false });

    // Cascade to branches
    try {
      await Business.updateMany(
        { parentBusinessId: business._id },
        { subscriptionStatus: 'active', isPremium: true, subscriptionExpiry: business.subscriptionExpiry }
      );
    } catch (branchErr) {
      console.error('Error cascading activation to branches:', branchErr);
    }

    // Send notification
    await Notification.create({
      userId: business.ownerId,
      businessId: business._id,
      title: 'Subscription Activated',
      message: `Your premium listing subscription for "${business.name}" has been manually activated for 30 days.`,
      type: 'payment_status'
    });

    res.json({ success: true, message: 'Subscription successfully activated for 30 days', data: business });
  } catch (error) {
    next(error);
  }
});

// @desc    Suspend a business listing subscription
// @route   PUT /api/admin/businesses/:id/suspend-subscription
// @access  Private/Admin
router.put('/businesses/:id/suspend-subscription', async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    // If already suspended, this acts as Reactivate (clearing suspension back to none or restoring)
    const isSuspended = business.subscriptionStatus === 'suspended';
    if (isSuspended) {
      business.subscriptionStatus = 'none';
      business.isPremium = false;
      await business.save({ validateBeforeSave: false });

      // Cascade to branches
      try {
        await Business.updateMany(
          { parentBusinessId: business._id },
          { subscriptionStatus: 'none', isPremium: false }
        );
      } catch (branchErr) {
        console.error('Error cascading reactivation to branches:', branchErr);
      }

      await Notification.create({
        userId: business.ownerId,
        businessId: business._id,
        title: 'Subscription Suspension Lifted',
        message: `Your business "${business.name}" subscription suspension has been lifted by the administrator.`,
        type: 'approval_status'
      });

      return res.json({ success: true, message: 'Subscription suspension successfully lifted', data: business });
    } else {
      business.subscriptionStatus = 'suspended';
      business.isPremium = false;
      await business.save({ validateBeforeSave: false });

      // Cascade to branches
      try {
        await Business.updateMany(
          { parentBusinessId: business._id },
          { subscriptionStatus: 'suspended', isPremium: false }
        );
      } catch (branchErr) {
        console.error('Error cascading suspension to branches:', branchErr);
      }

      await Notification.create({
        userId: business.ownerId,
        businessId: business._id,
        title: 'Subscription Suspended',
        message: `Your premium listing subscription for "${business.name}" has been temporarily suspended by the administrator.`,
        type: 'approval_status'
      });

      return res.json({ success: true, message: 'Subscription successfully suspended', data: business });
    }
  } catch (error) {
    next(error);
  }
});

// @desc    Send manual subscription reminder
// @route   POST /api/admin/businesses/:id/send-reminder
// @access  Private/Admin
router.post('/businesses/:id/send-reminder', async (req, res, next) => {
  try {
    const business = await Business.findById(req.params.id).populate('ownerId');
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    const customMessage = req.body.message;
    const reminderMessage = customMessage || `Friendly reminder: Please renew your subscription for "${business.name}" to maintain premium visibility and access.`;

    // Send in-app notification
    await Notification.create({
      userId: business.ownerId ? (business.ownerId._id || business.ownerId) : null,
      businessId: business._id,
      title: 'Subscription Renewal Reminder',
      message: reminderMessage,
      type: 'payment_status'
    });

    // Send email
    if (business.ownerId && business.ownerId.email) {
      const ownerName = business.ownerId.fullName || business.ownerId.name || 'Merchant';
      const { sendEmail } = require('../utils/emailHelper');
      
      const emailText = customMessage
        ? `Hello ${ownerName},\n\n${customMessage}\n\nBest regards,\nUBT Billing Audit Team`
        : `Hello ${ownerName},\n\nThis is a friendly reminder that your premium listing subscription for "${business.name}" is currently inactive, expired, or about to expire.\n\nPlease log in to your UBT merchant dashboard and renew your subscription to maintain priority search ranking, verified badge status, and premium lead access.\n\nBest regards,\nUBT Billing Audit Team`;

      try {
        await sendEmail({
          to: business.ownerId.email,
          subject: `Action Required: Subscription Reminder for "${business.name}"`,
          text: emailText
        });
      } catch (emailErr) {
        console.error('[SMTP] Failed to send manual subscription reminder email:', emailErr.message);
      }
    }

    res.json({ success: true, message: 'Subscription reminder successfully dispatched' });
  } catch (error) {
    next(error);
  }
});

// @desc    Approve/Reject/Deactivate a business branch
// @route   PUT /api/admin/branches/:id/status
// @access  Private/Admin
router.put('/branches/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    const branch = await Business.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    branch.status = status;
    const statusMap = {
      'Pending Verification': 'pending',
      'Under Review': 'under_review',
      'Approved': 'approved',
      'Rejected': 'rejected',
      'Suspended': 'suspended'
    };
    branch.verificationStatus = statusMap[status] || 'pending';
    await branch.save();

    res.json({ success: true, message: `Branch successfully marked as ${status}`, data: branch });
  } catch (error) {
    next(error);
  }
});

// Category requests vetting (accessible to Admin)
router.get('/category-review/pending', getPendingCategoryReviews);
router.post('/category-review/resolve', resolveCategoryReview);
router.post('/categories/merge', mergeCategories);


// @desc    Get all partners
// @route   GET /api/admin/partners
// @access  Private/Admin
router.get('/partners', async (req, res, next) => {
  try {
    const partners = await User.find({ $or: [{ role: 'partner' }, { isPartnerRegistered: true }] }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: partners.length,
      data: partners
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Approve or reject a partner
// @route   POST /api/admin/partners/approve
// @access  Private/Admin
router.post('/partners/approve', async (req, res, next) => {
  try {
    const { partnerId, action } = req.body; // action: 'approve' or 'reject'
    const partner = await User.findOne({ _id: partnerId, $or: [{ role: 'partner' }, { isPartnerRegistered: true }] });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }
    if (action === 'approve') {
      partner.isPartnerApproved = true;
      partner.partnerStatus = 'approved';
      partner.partnerApprovedAt = new Date();
      partner.role = 'partner';
    } else if (action === 'reject') {
      const { rejectionReason } = req.body;
      partner.isPartnerApproved = false;
      partner.partnerStatus = 'rejected';
      partner.partnerRejectedAt = new Date();
      partner.isPartnerRegistered = false; // Reset so they must register again
      partner.partnerRejectionReason = rejectionReason || '';
      partner.role = 'owner';
    } else {
      return res.status(400).json({ success: false, message: 'Invalid action. Must be "approve" or "reject".' });
    }
    await partner.save();
    res.json({ success: true, message: `Partner registration ${action}d successfully.`, data: partner });
  } catch (error) {
    next(error);
  }
});

// @desc    Toggle or set manual verification status for a partner
// @route   POST /api/admin/partners/:id/manual-verification
// @access  Private/Admin
router.post('/partners/:id/manual-verification', async (req, res, next) => {
  try {
    const { isDone } = req.body;
    const partner = await User.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }
    if (partner.isManualVerificationDone && !isDone) {
      return res.status(400).json({ success: false, message: 'Manual verification cannot be reverted once completed.' });
    }
    partner.isManualVerificationDone = true;
    await partner.save();
    res.json({ success: true, message: `Manual verification status updated successfully.`, data: partner });
  } catch (error) {
    next(error);
  }
});

// @desc    Toggle Gold Partner status for a partner
// @route   POST /api/admin/partners/:id/toggle-gold-status
// @access  Private/Admin
router.post('/partners/:id/toggle-gold-status', async (req, res, next) => {
  try {
    const partner = await User.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partner not found' });
    }
    partner.isGoldPartner = !partner.isGoldPartner;
    await partner.save();
    res.json({ success: true, message: `Gold Partner status toggled to ${partner.isGoldPartner ? 'Active' : 'Inactive'}`, data: partner });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all pending sponsored ads
// @route   GET /api/admin/sponsored-ads/pending
// @access  Private/Admin
router.get('/sponsored-ads/pending', async (req, res, next) => {
  try {
    const businesses = await Business.find({
      'promotions.sponsoredStatus': 'pending'
    });

    const pendingAds = [];
    businesses.forEach(b => {
      if (b.promotions && b.promotions.length) {
        b.promotions.forEach(p => {
          if (p.sponsoredStatus === 'pending') {
            pendingAds.push({
              businessId: b._id,
              businessName: b.name,
              businessSlug: b.slug,
              offer: {
                id: p.id,
                title: 'Sponsored Promotion Flyer',
                description: 'Flyer image promotion directly live on merchant profile.',
                banner: p.image,
                rate: '₹99 Promo',
                expiry: p.sponsoredExpiry ? new Date(p.sponsoredExpiry).toLocaleDateString() : '10 Days',
                active: p.active !== false
              }
            });
          }
        });
      }
    });

    res.json({ success: true, count: pendingAds.length, data: pendingAds });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all sponsored ads (active, pending, rejected, etc)
// @route   GET /api/admin/sponsored-ads/all
// @access  Private/Admin
router.get('/sponsored-ads/all', async (req, res, next) => {
  try {
    const businesses = await Business.find({
      'promotions.sponsoredStatus': { $ne: 'none' }
    });

    const allAds = [];
    businesses.forEach(b => {
      if (b.promotions && b.promotions.length) {
        b.promotions.forEach(p => {
          if (p.sponsoredStatus !== 'none') {
            allAds.push({
              businessId: b._id,
              businessName: b.name,
              businessSlug: b.slug,
              offer: {
                id: p.id,
                title: 'Sponsored Promotion Flyer',
                description: 'Flyer image promotion directly live on merchant profile.',
                banner: p.image,
                rate: '₹99 Promo',
                expiry: p.sponsoredExpiry ? new Date(p.sponsoredExpiry).toLocaleDateString() : '10 Days',
                sponsoredStatus: p.sponsoredStatus,
                active: p.active !== false
              }
            });
          }
        });
      }
    });

    res.json({ success: true, count: allAds.length, data: allAds });
  } catch (error) {
    next(error);
  }
});

// @desc    Approve sponsored ad
// @route   PUT /api/admin/sponsored-ads/:businessId/:promotionId/approve
// @access  Private/Admin
router.put('/sponsored-ads/:businessId/:promotionId/approve', async (req, res, next) => {
  try {
    const { businessId, promotionId } = req.params;
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    const promotion = business.promotions.find(p => p.id === promotionId || p.get('id') === promotionId || p._id.toString() === promotionId);
    if (!promotion) {
      return res.status(404).json({ success: false, message: 'Promotion not found' });
    }

    promotion.sponsoredStatus = 'approved';
    promotion.isSponsored = true;
    promotion.sponsoredExpiry = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000); // 10 days duration

    await business.save();
    res.json({ success: true, message: 'Sponsored promotion approved successfully!', data: promotion });
  } catch (error) {
    next(error);
  }
});

// @desc    Reject sponsored ad
// @route   PUT /api/admin/sponsored-ads/:businessId/:promotionId/reject
// @access  Private/Admin
router.put('/sponsored-ads/:businessId/:promotionId/reject', async (req, res, next) => {
  try {
    const { businessId, promotionId } = req.params;
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    const promotion = business.promotions.find(p => p.id === promotionId || p.get('id') === promotionId || p._id.toString() === promotionId);
    if (!promotion) {
      return res.status(404).json({ success: false, message: 'Promotion not found' });
    }

    promotion.sponsoredStatus = 'rejected';
    promotion.isSponsored = false;

    await business.save();
    res.json({ success: true, message: 'Sponsored promotion rejected successfully!', data: promotion });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete sponsored ad (remove promotion from business)
// @route   DELETE /api/admin/sponsored-ads/:businessId/:promotionId
// @access  Private/Admin
router.delete('/sponsored-ads/:businessId/:promotionId', async (req, res, next) => {
  try {
    const { businessId, promotionId } = req.params;
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    const promotion = business.promotions.find(p => 
      p.id === promotionId || 
      p.get('id') === promotionId || 
      p._id.toString() === promotionId
    );

    if (!promotion) {
      return res.status(404).json({ success: false, message: 'Promotion not found' });
    }

    // Remove sponsored status (hides from homepage ads and admin lists, preserves on merchant details profile)
    promotion.isSponsored = false;
    promotion.sponsoredStatus = 'none';
    promotion.sponsoredExpiry = null;
    promotion.sponsoredPrice = 0;

    await business.save();
    res.json({ success: true, message: 'Sponsored promotion hidden from homepage and admin dashboard successfully!' });
  } catch (error) {
    next(error);
  }
});

// @desc    Hide sponsored ad / offer
// @route   PUT /api/admin/sponsored-ads/:businessId/:promotionId/hide
// @access  Private/Admin
router.put('/sponsored-ads/:businessId/:promotionId/hide', async (req, res, next) => {
  try {
    const { businessId, promotionId } = req.params;
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    const promotion = business.promotions.find(p => 
      p.id === promotionId || 
      p.get('id') === promotionId || 
      p._id.toString() === promotionId
    );

    if (!promotion) {
      return res.status(404).json({ success: false, message: 'Promotion not found' });
    }

    promotion.active = false;
    await business.save();
    res.json({ success: true, message: 'Sponsored ad / offer hidden successfully!' });
  } catch (error) {
    next(error);
  }
});

// @desc    Activate sponsored ad / offer
// @route   PUT /api/admin/sponsored-ads/:businessId/:promotionId/activate
// @access  Private/Admin
router.put('/sponsored-ads/:businessId/:promotionId/activate', async (req, res, next) => {
  try {
    const { businessId, promotionId } = req.params;
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    const promotion = business.promotions.find(p => 
      p.id === promotionId || 
      p.get('id') === promotionId || 
      p._id.toString() === promotionId
    );

    if (!promotion) {
      return res.status(404).json({ success: false, message: 'Promotion not found' });
    }

    promotion.active = true;
    await business.save();
    res.json({ success: true, message: 'Sponsored ad / offer activated successfully!' });
  } catch (error) {
    next(error);
  }
});

// @desc    Directly post a sponsored ad without payment
// @route   POST /api/admin/sponsored-ads/direct-post
// @access  Private/Admin
router.post('/sponsored-ads/direct-post', async (req, res, next) => {
  try {
    const { businessId, imageUrl, expiryDays } = req.body;
    if (!businessId || !imageUrl) {
      return res.status(400).json({ success: false, message: 'Please provide businessId and imageUrl' });
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    const newPromotion = {
      id: 'promo_' + Math.random().toString(36).substring(2, 9),
      image: imageUrl,
      active: true,
      isSponsored: true,
      sponsoredStatus: 'approved',
      sponsoredExpiry: new Date(Date.now() + (Number(expiryDays) || 30) * 24 * 60 * 60 * 1000)
    };

    if (!business.promotions) {
      business.promotions = [];
    }
    business.promotions.push(newPromotion);
    await business.save();

    res.status(201).json({ 
      success: true, 
      message: 'Sponsored ad posted directly successfully!', 
      data: newPromotion 
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
