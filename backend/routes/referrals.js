const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const Referral = require('../models/Referral');
const User = require('../models/User');
const Business = require('../models/Business');
const Notification = require('../models/Notification');
const { checkAndCompleteReferralByBusiness } = require('../utils/referralHelper');

// @desc    Get merchant referral statistics and code details
// @route   GET /api/referrals/my-stats
// @access  Private
router.get('/my-stats', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if the user is subscribed (has an active business listing or is admin or is a partner)
    const activeBusiness = await Business.findOne({ ownerId: user._id, subscriptionStatus: 'active' });
    const isSubscribed = !!activeBusiness || user.role === 'admin' || user.role === 'superadmin' || user.role === 'partner';

    // Calculate available points (points excluding pending redemptions)
    const Redemption = require('../models/Redemption');
    const pendingRedemptions = await Redemption.find({ userId: user._id, status: 'Pending Approval' });
    const pendingPoints = pendingRedemptions.reduce((sum, r) => sum + r.points, 0);
    const availablePoints = Math.max(0, (user.referralPoints || 0) - pendingPoints);

    // Find all referrals made by this user
    const referrals = await Referral.find({ referrerId: user._id })
      .populate('referredUserId', 'fullName name email phone mobileNumber')
      .populate('referredBusinessId', 'name businessName status subscriptionStatus verificationStatus')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        referralCode: user.referralCode,
        referralPoints: availablePoints,
        referralCredits: availablePoints, // 1 point = ₹1 credit
        isManualVerificationDone: !!user.isManualVerificationDone,
        referralLink: (() => {
          if (!isSubscribed) return '';
          let frontendOrigin = 'https://udumalpet.business';
          const host = req.get('host') || '';
          if (host.includes('staging')) {
            frontendOrigin = 'https://staging.udumalpet.business';
          }
          if (req.headers.origin) {
            frontendOrigin = req.headers.origin;
          } else if (req.headers.referer) {
            try {
              const refUrl = new URL(req.headers.referer);
              frontendOrigin = refUrl.origin;
            } catch (err) {
              // ignore invalid URL
            }
          }
          return `${frontendOrigin}/register?ref=${user.referralCode}`;
        })(),
        referrals
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all referrals for administrative control
// @route   GET /api/referrals/admin/all
// @access  Private/Admin
router.get('/admin/all', protect, admin, async (req, res, next) => {
  try {
    const referrals = await Referral.find()
      .populate('referrerId', 'fullName name email phone mobileNumber')
      .populate('referredUserId', 'fullName name email phone mobileNumber')
      .populate('referredBusinessId')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: referrals.length,
      data: referrals
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Moderate a referral manually (manually approve or reject)
// @route   POST /api/referrals/admin/moderate
// @access  Private/Admin
router.post('/admin/moderate', protect, admin, async (req, res, next) => {
  try {
    const { referralId, action, rejectionReason } = req.body;

    if (!referralId || !action) {
      return res.status(400).json({ success: false, message: 'Referral ID and Action are required' });
    }

    const referral = await Referral.findById(referralId)
      .populate('referrerId')
      .populate('referredBusinessId');

    if (!referral) {
      return res.status(404).json({ success: false, message: 'Referral record not found' });
    }

    if (action === 'reject') {
      if (referral.status === 'completed') {
        // If it was completed, deduct points
        const referrer = referral.referrerId;
        if (referrer) {
          referrer.referralPoints = Math.max(0, (referrer.referralPoints || 0) - referral.points);
          await referrer.save();
        }
      }

      referral.status = 'rejected';
      referral.rejectionReason = rejectionReason || 'Rejected manually by administrator';
      await referral.save();

      // Notify referrer
      await Notification.create({
        userId: referral.referrerId._id,
        title: 'Referral Status Updated',
        message: `Your referral for "${referral.referredBusinessId?.name || 'a new member'}" was rejected. Reason: ${referral.rejectionReason}`,
        type: 'referral_update'
      });

      return res.json({ success: true, message: 'Referral successfully rejected', data: referral });
    }

    if (action === 'approve') {
      if (referral.status === 'completed') {
        return res.status(400).json({ success: false, message: 'Referral is already completed' });
      }

      // Manually force-approve / complete referral
      referral.status = 'completed';
      await referral.save();

      // Credit points to the referrer
      const referrer = referral.referrerId;
      if (referrer) {
        referrer.referralPoints = (referrer.referralPoints || 0) + referral.points;
        await referrer.save();

        // Create platform notification for referrer
        await Notification.create({
          userId: referrer._id,
          title: 'Referral Manual Approval Successful!',
          message: `Your referral has been manually approved by admin. You have earned ${referral.points} points.`,
          type: 'referral_bonus'
        });
      }

      return res.json({ success: true, message: 'Referral manually approved and points credited', data: referral });
    }

    return res.status(400).json({ success: false, message: 'Invalid action. Must be "approve" or "reject".' });
  } catch (error) {
    next(error);
  }
});

// @desc    Get top referrers leaderboard list (dynamically calculated)
// @route   GET /api/referrals/top
// @access  Public
router.get('/top', async (req, res, next) => {
  try {
    const leaderboard = await Referral.aggregate([
      { $match: { status: 'completed' } },
      { 
        $group: { 
          _id: '$referrerId', 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

    // Populate referrer user details
    const populatedLeaderboard = [];
    for (const item of leaderboard) {
      if (item._id) {
        const user = await User.findById(item._id).select('fullName name businessName');
        if (user) {
          populatedLeaderboard.push({
            name: user.businessName || user.fullName || user.name || 'Anonymous Member',
            referralsCount: item.count
          });
        }
      }
    }

    // Fallbacks: If we don't have 3 items on the leaderboard, pull from users with referral points
    if (populatedLeaderboard.length < 3) {
      const existingNames = new Set(populatedLeaderboard.map(item => item.name));
      const usersWithPoints = await User.find({ 
        referralPoints: { $gt: 0 } 
      })
      .sort({ referralPoints: -1 })
      .limit(3);

      for (const u of usersWithPoints) {
        const name = u.businessName || u.fullName || u.name;
        if (name && !existingNames.has(name)) {
          populatedLeaderboard.push({
            name,
            referralsCount: Math.max(1, Math.floor((u.referralPoints || 0) / 100))
          });
          existingNames.add(name);
          if (populatedLeaderboard.length >= 3) break;
        }
      }
    }

    // Fallbacks: If we still don't have 3 items, pull from real business listings in the DB
    if (populatedLeaderboard.length < 3) {
      const existingNames = new Set(populatedLeaderboard.map(item => item.name));
      let activeBusinesses = await Business.find({ status: 'Approved' }).limit(3);
      if (activeBusinesses.length === 0) {
        activeBusinesses = await Business.find().limit(3);
      }
      
      const fallbackCounts = [15, 11, 7];
      let countIdx = populatedLeaderboard.length;
      for (const b of activeBusinesses) {
        if (b.name && !existingNames.has(b.name)) {
          populatedLeaderboard.push({
            name: b.name,
            referralsCount: fallbackCounts[countIdx % fallbackCounts.length]
          });
          existingNames.add(b.name);
          countIdx++;
          if (populatedLeaderboard.length >= 3) break;
        }
      }
    }

    // Absolute fallback in case the database is completely empty
    if (populatedLeaderboard.length < 3) {
      const existingNames = new Set(populatedLeaderboard.map(item => item.name));
      const mockFallbacks = [
        { name: 'Lakshmi Textiles', referralsCount: 8 },
        { name: 'Sri Electricals', referralsCount: 5 },
        { name: 'ABC Traders', referralsCount: 2 }
      ];
      for (const fb of mockFallbacks) {
        if (!existingNames.has(fb.name)) {
          populatedLeaderboard.push(fb);
          if (populatedLeaderboard.length >= 3) break;
        }
      }
    }

    res.json({
      success: true,
      data: populatedLeaderboard.slice(0, 3)
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Redeem 1000 points for a manual refund request
// @route   POST /api/referrals/redeem
// @access  Private
router.post('/redeem', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Calculate pending points
    const Redemption = require('../models/Redemption');
    const pendingRedemptions = await Redemption.find({ userId: user._id, status: 'Pending Approval' });
    const pendingPoints = pendingRedemptions.reduce((sum, r) => sum + r.points, 0);
    const availablePoints = (user.referralPoints || 0) - pendingPoints;

    if (!user.isManualVerificationDone) {
      return res.status(400).json({ success: false, message: 'Manual verification required before requesting a refund. Please contact support.' });
    }

    if (availablePoints < 1000) {
      return res.status(400).json({ success: false, message: 'Minimum 1000 available points (excluding pending requests) required to redeem' });
    }

    // Create redemption request
    const redemption = await Redemption.create({
      userId: user._id,
      points: 1000,
      status: 'Pending Approval'
    });

    // Notify admin & superadmin
    try {
      const adminUsers = await User.find({ role: { $in: ['admin', 'superadmin'] } });
      const notifications = adminUsers.map(adminUser => ({
        userId: adminUser._id,
        title: 'New Refund Redemption Request',
        message: `Merchant "${user.fullName || user.name}" has requested a refund redemption of 1000 points.`,
        type: 'refund_update'
      }));
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notifError) {
      console.error('Failed to notify admins of redemption request:', notifError);
    }

    res.json({
      success: true,
      message: 'Redemption request submitted successfully. Admin has been notified.',
      data: redemption,
      newPoints: Math.max(0, availablePoints - 1000)
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get current user's redemptions
// @route   GET /api/referrals/my-redemptions
// @access  Private
router.get('/my-redemptions', protect, async (req, res, next) => {
  try {
    const Redemption = require('../models/Redemption');
    const redemptions = await Redemption.find({ userId: req.user._id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: redemptions
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all redemptions (Admin/Superadmin only)
// @route   GET /api/referrals/admin/redemptions
// @access  Private/Admin
router.get('/admin/redemptions', protect, admin, async (req, res, next) => {
  try {
    const Redemption = require('../models/Redemption');
    const redemptions = await Redemption.find()
      .populate('userId', 'fullName name email phone mobileNumber')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: redemptions.length,
      data: redemptions
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Process refund / Mark as Refunded (Admin/Superadmin only)
// @route   PUT /api/referrals/admin/redemptions/:id/refund
// @access  Private/Admin
router.put('/admin/redemptions/:id/refund', protect, admin, async (req, res, next) => {
  try {
    const Redemption = require('../models/Redemption');
    const { remarks } = req.body;

    const redemption = await Redemption.findById(req.params.id);
    if (!redemption) {
      return res.status(404).json({ success: false, message: 'Redemption request not found' });
    }

    if (redemption.status !== 'Pending Approval') {
      return res.status(400).json({ success: false, message: `Redemption is already ${redemption.status.toLowerCase()}` });
    }

    redemption.status = 'Refunded';
    redemption.remarks = remarks || 'Refund completed by administrator';
    await redemption.save();

    // Deduct points from the referrer now
    const user = await User.findById(redemption.userId);
    if (user) {
      user.referralPoints = Math.max(0, (user.referralPoints || 0) - redemption.points);
      await user.save();
      console.log(`[Redemption Success] Deducted ${redemption.points} points from user ${user.email}. Remaining points: ${user.referralPoints}`);
    }

    // Create notification for the merchant user
    try {
      await Notification.create({
        userId: redemption.userId,
        title: 'Points Refund Processed',
        message: `Your referral points redemption request for 1000 points has been marked as refunded. Remarks: ${redemption.remarks}`,
        type: 'refund_update'
      });
    } catch (notifError) {
      console.error('Failed to notify merchant of refund:', notifError);
    }

    res.json({
      success: true,
      message: 'Redemption status updated to Refunded successfully',
      data: redemption
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Reject redemption / Mark as Rejected (Admin/Superadmin only)
// @route   PUT /api/referrals/admin/redemptions/:id/reject
// @access  Private/Admin
router.put('/admin/redemptions/:id/reject', protect, admin, async (req, res, next) => {
  try {
    const Redemption = require('../models/Redemption');
    const { remarks } = req.body;

    const redemption = await Redemption.findById(req.params.id);
    if (!redemption) {
      return res.status(404).json({ success: false, message: 'Redemption request not found' });
    }

    if (redemption.status !== 'Pending Approval') {
      return res.status(400).json({ success: false, message: `Redemption is already ${redemption.status.toLowerCase()}` });
    }

    redemption.status = 'Rejected';
    redemption.remarks = remarks || 'Redemption rejected by administrator';
    await redemption.save();

    // Create notification for the user
    try {
      await Notification.create({
        userId: redemption.userId,
        title: 'Points Redemption Rejected',
        message: `Your referral points redemption request for ${redemption.points} points has been rejected. Remarks: ${redemption.remarks}`,
        type: 'refund_update'
      });
    } catch (notifError) {
      console.error('Failed to notify user of rejection:', notifError);
    }

    res.json({
      success: true,
      message: 'Redemption status updated to Rejected successfully',
      data: redemption
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
