const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const Business = require('../models/Business');
const { protect } = require('../middleware/auth');

// @desc    Submit a new lead/enquiry for a business
// @route   POST /api/leads
// @access  Public
router.post('/', async (req, res) => {
  const { businessId, name, phone, message } = req.body;

  if (!businessId || !name || !phone || !message) {
    return res.status(400).json({ success: false, message: 'Please provide all required fields' });
  }

  try {
    const business = await Business.findById(businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    const lead = await Lead.create({
      businessId,
      name,
      phone,
      message,
    });

    res.status(201).json({ success: true, data: lead });
  } catch (error) {
    console.error('Error submitting lead:', error);
    res.status(500).json({ success: false, message: 'Server error submitting enquiry' });
  }
});

// @desc    Get all leads for a specific business
// @route   GET /api/leads/business/:businessId
// @access  Private (Owner or Admin)
router.get('/business/:businessId', protect, async (req, res) => {
  try {
    const business = await Business.findById(req.params.businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found' });
    }

    // Verify ownership
    if (business.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view these inquiries' });
    }

    const leads = await Lead.find({ businessId: req.params.businessId }).sort({ createdAt: -1 });
    res.json({ success: true, data: leads });
  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ success: false, message: 'Server error retrieving inquiries' });
  }
});

// @desc    Reply to a lead/enquiry
// @route   PUT /api/leads/:id/reply
// @access  Private (Owner or Admin)
router.put('/:id/reply', protect, async (req, res) => {
  const { reply } = req.body;

  if (!reply || !reply.trim()) {
    return res.status(400).json({ success: false, message: 'Reply message is required' });
  }

  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const business = await Business.findById(lead.businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found for this lead' });
    }

    // Verify ownership
    if (business.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Not authorized to reply to this inquiry' });
    }

    lead.reply = reply;
    lead.status = 'Responded';
    lead.respondedAt = Date.now();
    await lead.save();

    res.json({ success: true, data: lead });
  } catch (error) {
    console.error('Error replying to lead:', error);
    res.status(500).json({ success: false, message: 'Server error submitting reply' });
  }
});

// @desc    Update a lead status
// @route   PUT /api/leads/:id/status
// @access  Private (Owner or Admin)
router.put('/:id/status', protect, async (req, res) => {
  const { status } = req.body;

  if (!status || !['Pending', 'Responded', 'Rectified'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Please provide a valid status (Pending, Responded, Rectified)' });
  }

  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const business = await Business.findById(lead.businessId);
    if (!business) {
      return res.status(404).json({ success: false, message: 'Business not found for this lead' });
    }

    // Verify ownership
    if (business.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Not authorized to update this lead' });
    }

    lead.status = status;
    if (status === 'Responded' || status === 'Rectified') {
      lead.respondedAt = Date.now();
    }
    await lead.save();

    res.json({ success: true, data: lead });
  } catch (error) {
    console.error('Error updating lead status:', error);
    res.status(500).json({ success: false, message: 'Server error updating lead status' });
  }
});

module.exports = router;
