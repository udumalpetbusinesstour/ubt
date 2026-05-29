const express = require('express');
const router = express.Router();
const Testimonial = require('../models/Testimonial');
const { protect, admin } = require('../middleware/auth');

// @desc    Get all approved testimonials (Public)
// @route   GET /api/testimonials
// @access  Public
router.get('/', async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ status: 'Approved' }).sort({ createdAt: -1 });
    res.json({ success: true, count: testimonials.length, data: testimonials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Submit a new testimonial (Public)
// @route   POST /api/testimonials
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { authorName, role, text, rating } = req.body;

    if (!authorName || !role || !text) {
      return res.status(400).json({ success: false, message: 'Please provide name, role, and thoughts.' });
    }

    const testimonial = await Testimonial.create({
      authorName,
      role,
      text,
      rating: Number(rating) || 5,
      status: 'Pending',
    });

    res.status(201).json({ success: true, data: testimonial });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all testimonials (Admin Moderation)
// @route   GET /api/testimonials/admin
// @access  Private/Admin
router.get('/admin', protect, admin, async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.json({ success: true, count: testimonials.length, data: testimonials });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update testimonial status (Admin Moderation)
// @route   PUT /api/testimonials/:id/status
// @access  Private/Admin
router.put('/:id/status', protect, admin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['Approved', 'Rejected', 'Pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status provided.' });
    }

    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found.' });
    }

    testimonial.status = status;
    await testimonial.save();

    res.json({ success: true, message: `Testimonial successfully ${status.toLowerCase()}`, data: testimonial });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a testimonial (Private/Admin)
// @route   DELETE /api/testimonials/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ success: false, message: 'Testimonial not found.' });
    }

    await testimonial.deleteOne();
    res.json({ success: true, message: 'Testimonial deleted successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
