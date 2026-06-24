const express = require('express');
const router = express.Router();
const Business = require('../models/Business');
const { protect } = require('../middleware/auth');

// @desc    Get all branches for a business
// @route   GET /api/branches/business/:businessId
// @access  Public (Only approved branches unless owner/admin calls with ?all=true)
router.get('/business/:businessId', async (req, res) => {
  try {
    const { businessId } = req.params;
    const showAll = req.query.all === 'true';

    // If requesting all (including pending/suspended), we must verify authentication and ownership/admin status
    if (showAll) {
      // Manual check of auth header
      let token;
      if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
      }

      if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, token required to view all branches' });
      }

      const jwt = require('jsonwebtoken');
      const User = require('../models/User');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      const business = await Business.findById(businessId);
      if (!business) {
        return res.status(404).json({ success: false, message: 'Business not found' });
      }

      const isOwner = business.ownerId.toString() === user._id.toString();
      const isAdmin = user.role === 'admin' || user.role === 'superadmin';

      if (!isOwner && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Access denied: You are not authorized to view all branches' });
      }

      const branches = await Business.find({ parentBusinessId: businessId }).sort({ createdAt: -1 });
      return res.json({ success: true, count: branches.length, data: branches });
    }

    // Public request: Return only approved branches
    const branches = await Business.find({ parentBusinessId: businessId, status: 'Approved' }).sort({ createdAt: -1 });
    res.json({ success: true, count: branches.length, data: branches });
  } catch (error) {
    console.error('Error fetching branches:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Create a new branch for a business
// @route   POST /api/branches
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const {
      businessId,
      name,
      address,
      phone,
      googleMapsLocation,
      googleBusinessLink,
      workingHours,
      branchManagerName,
      latitude,
      longitude,
      isPrimary,
      logoUrl,
      coverImageUrl,
      galleryUrls
    } = req.body;

    if (!businessId || !name || !address || !phone) {
      return res.status(400).json({ success: false, message: 'businessId, name, address, and phone are required' });
    }

    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    // Authorize: Owner of business or admin
    const isOwner = business.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to add branches to this business' });
    }

    // Admins create approved branches directly; merchants create pending branches
    const defaultStatus = isAdmin ? 'Approved' : 'Pending Verification';

    const branch = await Business.create({
      parentBusinessId: businessId,
      businessId: businessId, // compatibility
      ownerId: business.ownerId,
      category: business.category,
      categoryId: business.categoryId,
      type: business.type || business.category,
      city: business.city || 'Udumalpet',
      state: business.state || 'Tamil Nadu',
      subscriptionStatus: business.subscriptionStatus,
      subscriptionExpiry: business.subscriptionExpiry,
      isPremium: business.isPremium,
      name,
      businessName: name,
      address,
      phone,
      googleMapsLocation,
      googleBusinessLink,
      workingHours: workingHours || '9:00 AM - 8:00 PM',
      branchManagerName,
      logoUrl: logoUrl || '',
      coverImageUrl: coverImageUrl || '',
      galleryUrls: galleryUrls || [],
      latitude: latitude || 10.5891,
      longitude: longitude || 77.2412,
      coordinates: {
        lat: latitude || 10.5891,
        lng: longitude || 77.2412
      },
      status: defaultStatus,
      verificationStatus: defaultStatus === 'Approved' ? 'approved' : 'pending'
    });

    res.status(201).json({ success: true, data: branch });
  } catch (error) {
    console.error('Error creating branch:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update a branch
// @route   PUT /api/branches/:id
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    let branch = await Business.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    const business = await Business.findById(branch.parentBusinessId || branch.businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Parent business not found' });
    }

    // Authorize: Owner or admin
    const isOwner = business.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to update this branch' });
    }

    // If a merchant updates, reset status to Pending Verification for moderation. If admin, retain status unless modified.
    if (!isAdmin) {
      req.body.status = 'Pending Verification';
      req.body.verificationStatus = 'pending';
    } else if (req.body.status) {
      const statusMap = {
        'Pending Verification': 'pending',
        'Under Review': 'under_review',
        'Approved': 'approved',
        'Rejected': 'rejected',
        'Suspended': 'suspended'
      };
      req.body.verificationStatus = statusMap[req.body.status] || 'pending';
    }

    // Sync coordinates subdocument if lat/lng changes
    if (req.body.latitude || req.body.longitude) {
      req.body.coordinates = {
        lat: req.body.latitude || branch.latitude,
        lng: req.body.longitude || branch.longitude
      };
    }

    // Auto-fill businessName/name if changed
    if (req.body.name) {
      req.body.businessName = req.body.name;
    }

    branch = await Business.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.json({ success: true, data: branch });
  } catch (error) {
    console.error('Error updating branch:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a branch
// @route   DELETE /api/branches/:id
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const branch = await Business.findById(req.params.id);
    if (!branch) {
      return res.status(404).json({ success: false, message: 'Branch not found' });
    }

    const business = await Business.findById(branch.parentBusinessId || branch.businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Parent business not found' });
    }

    // Authorize: Owner or admin
    const isOwner = business.ownerId.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin' || req.user.role === 'superadmin';
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this branch' });
    }

    await Business.deleteOne({ _id: req.params.id });
    res.json({ success: true, message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Error deleting branch:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
