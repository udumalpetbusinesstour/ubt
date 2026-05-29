const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const SupportTicket = require('../models/SupportTicket');
const { sendSuccess, sendError } = require('../utils/responseHelper');

// Protect all support endpoints
router.use(protect);

// @desc    Submit support ticket
// @route   POST /api/support
// @access  Private
router.post('/', async (req, res, next) => {
  try {
    const { subject, description, priority } = req.body;
    if (!subject || !description) {
      return sendError(res, 400, 'Subject and description parameters are required');
    }

    const ticket = await SupportTicket.create({
      userId: req.user._id,
      subject,
      description,
      priority: priority || 'Medium',
      status: 'Open'
    });

    return sendSuccess(res, 201, 'Support ticket created successfully', ticket);
  } catch (err) {
    next(err);
  }
});

// @desc    Get merchant's own support tickets
// @route   GET /api/support/my-tickets
// @access  Private
router.get('/my-tickets', async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'Your support tickets retrieved', tickets);
  } catch (err) {
    next(err);
  }
});

// @desc    Get all support tickets (Admin restricted)
// @route   GET /api/support
// @access  Private/Admin
router.get('/', admin, async (req, res, next) => {
  try {
    const tickets = await SupportTicket.find()
      .populate('userId', 'name email phone role')
      .sort({ createdAt: -1 });
    return sendSuccess(res, 200, 'All support tickets retrieved successfully', tickets);
  } catch (err) {
    next(err);
  }
});

// @desc    Submit reply and moderate support ticket (Admin restricted)
// @route   PUT /api/support/:id/reply
// @access  Private/Admin
router.put('/:id/reply', admin, async (req, res, next) => {
  try {
    const { replyText, status } = req.body;
    if (!replyText) {
      return sendError(res, 400, 'Reply text is required');
    }

    const ticket = await SupportTicket.findById(req.params.id);
    if (!ticket) {
      return sendError(res, 404, 'Support ticket not found');
    }

    ticket.replyText = replyText;
    ticket.repliedAt = new Date();
    ticket.status = status || 'Closed';
    await ticket.save();

    return sendSuccess(res, 200, 'Response recorded and ticket updated successfully', ticket);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
