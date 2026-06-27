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

// @desc    Get logged-in user's queries
// @route   GET /api/queries/my-queries
// @access  Private
router.get('/my-queries', protect, async (req, res) => {
  try {
    const queries = await Query.find({ userId: req.user._id }).sort({ createdAt: 1 });
    res.json({ success: true, count: queries.length, data: queries });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Submit a user query from merchant dashboard (authenticated)
// @route   POST /api/queries/merchant-query
// @access  Private
router.post('/merchant-query', protect, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, message: 'Message body is required' });
    }

    const query = await Query.create({
      userId: req.user._id,
      name: req.user.fullName || 'Merchant Support Request',
      email: req.user.email,
      subject: 'Dashboard Support Query',
      message
    });

    // Notify SuperAdmin via Email about new query
    try {
      const { sendEmail } = require('../utils/emailHelper');
      await sendEmail({
        to: process.env.SMTP_USER || 'info@udumalpet.business', // Central SuperAdmin email
        subject: `New Merchant Inquiry from ${req.user.fullName || 'Merchant'}`,
        text: `Hello Admin,\n\nA new merchant support message has been submitted from the dashboard.\n\nFrom: ${req.user.fullName || 'Merchant'} (${req.user.email})\n\nMessage:\n"${message}"\n\nPlease log in to the admin panel to reply.\n\nBest regards,\nUBT Platform Automation`
      });
      console.log(`[SMTP] New merchant support query email notification dispatched to SuperAdmin.`);
    } catch (mailErr) {
      console.error('[SMTP] Failed to send query email to admin:', mailErr.message);
    }

    res.status(201).json({ success: true, message: 'Support query submitted successfully', data: query });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

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

    // Notify SuperAdmin via Email about new query
    try {
      const { sendEmail } = require('../utils/emailHelper');
      await sendEmail({
        to: process.env.SMTP_USER || 'info@udumalpet.business', // Central SuperAdmin email
        subject: `New Inquiry received: "${subject}" from ${name}`,
        text: `Hello Admin,\n\nA new user inquiry has been submitted on Udumalpet Business Tour.\n\nFrom: ${name} (${email})\nSubject: ${subject}\n\nMessage:\n"${message}"\n\nPlease log in to the admin panel to reply.\n\nBest regards,\nUBT Platform Automation`
      });
      console.log(`[SMTP] New user query email notification dispatched to SuperAdmin.`);
    } catch (mailErr) {
      console.error('[SMTP] Failed to send query email to admin:', mailErr.message);
    }

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

    try {
      const { sendEmail } = require('../utils/emailHelper');
      await sendEmail({
        to: query.email,
        subject: `Re: ${query.subject} - Udumalpet Business Tour`,
        text: `Hello ${query.name},\n\nWe have reviewed your query: "${query.message}"\n\nAdmin Response:\n${replyMessage}\n\nBest regards,\nUdumalpet Business Tour Team`,
        html: `
          <div style="font-family: sans-serif; padding: 25px; color: #333; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
            <h2 style="color: #027244; font-size: 20px; font-weight: 800; border-bottom: 2px solid #e6f7f0; padding-bottom: 10px; margin-top: 0;">Udumalpet Business Tour</h2>
            <p style="font-size: 14px; line-height: 1.5;">Hello <strong>${query.name}</strong>,</p>
            <p style="font-size: 14px; line-height: 1.5; color: #4a5568;">Thank you for getting in touch. The administration panel has reviewed your query:</p>
            
            <div style="background-color: #f7fafc; padding: 15px; border-left: 4px solid #718096; border-radius: 4px; margin: 15px 0;">
              <p style="margin: 0; font-size: 13px; font-style: italic; color: #4a5568;">"${query.message}"</p>
            </div>
            
            <p style="font-size: 14px; line-height: 1.5; font-weight: bold; margin-top: 20px;">Admin Response:</p>
            <div style="background-color: #e6f7f0; padding: 18px; border-radius: 12px; border: 1px solid #c3e6cb; margin: 15px 0; color: #155724;">
              <p style="margin: 0; font-size: 14px; line-height: 1.6;">${replyMessage}</p>
            </div>
            
            <p style="font-size: 13px; line-height: 1.5; color: #4a5568; margin-top: 25px;">If you have any further questions, please feel free to raise another inquiry.</p>
            
            <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 25px 0;" />
            <p style="font-size: 10.5px; color: #a0aec0; text-align: center; margin: 0;">
              This is a system notification from Udumalpet Business Tour. Please do not reply directly to this email.
            </p>
          </div>
        `
      });
      console.log(`[SMTP] Email successfully dispatched to query email: ${query.email}`);
    } catch (mailErr) {
      console.error('[SMTP] Failed to send query reply email:', mailErr.message);
    }

    res.json({ success: true, message: 'Reply recorded and email dispatch completed.', data: query });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
