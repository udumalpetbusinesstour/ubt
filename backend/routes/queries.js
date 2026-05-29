const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Query = require('../models/Query');

// Custom authorization middleware for both Admin and Super Admin roles
const authorizeAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
    next();
  } else {
    return res.status(403).json({ success: false, message: 'Not authorized. Admin access required.' });
  }
};

// @desc    Submit a user query (public endpoint)
// @route   POST /api/queries
// @access  Public
router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'Please provide all required fields' });
    }

    const query = await Query.create({ name, email, subject, message });
    res.status(201).json({ success: true, message: 'Query submitted successfully', data: query });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get all queries (Admin / Super Admin only)
// @route   GET /api/queries
// @access  Private
router.get('/', protect, authorizeAdmin, async (req, res) => {
  try {
    const queries = await Query.find().sort({ createdAt: -1 });
    res.json({ success: true, count: queries.length, data: queries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Reply to a user query (Admin / Super Admin only)
// @route   POST /api/queries/:id/reply
// @access  Private
router.post('/:id/reply', protect, authorizeAdmin, async (req, res) => {
  try {
    const { replyMessage } = req.body;
    if (!replyMessage) {
      return res.status(400).json({ success: false, message: 'Reply message is required' });
    }

    const query = await Query.findById(req.params.id);
    if (!query) {
      return res.status(404).json({ success: false, message: 'Query not found' });
    }

    query.status = 'Replied';
    query.replyMessage = replyMessage;
    query.repliedAt = new Date();
    await query.save();

    console.log(`[SIMULATION] Email dispatched successfully to: ${query.email}`);
    console.log(`[SUBJECT] Re: ${query.subject}`);
    console.log(`[BODY] ${replyMessage}`);

    res.json({ success: true, message: 'Reply recorded and email dispatch simulated.', data: query });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
