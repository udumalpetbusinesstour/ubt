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

    // Notify SuperAdmin via Email about new support ticket
    try {
      const { sendEmail } = require('../utils/emailHelper');
      const merchantName = req.user.fullName || req.user.name || 'Merchant';
      await sendEmail({
        to: 'udumalpetbusinesstour@gmail.com', // Central SuperAdmin email
        subject: `New Support Ticket raised: [${priority || 'Medium'}] ${subject}`,
        text: `Hello Admin,\n\nA new support ticket has been opened by merchant "${merchantName}" (${req.user.email}).\n\nSubject: ${subject}\nPriority: ${priority || 'Medium'}\n\nDescription:\n"${description}"\n\nPlease log in to the admin panel to reply to this ticket.\n\nBest regards,\nUBT Platform Automation`
      });
    } catch (mailErr) {
      console.error('[SMTP] Failed to send new support ticket email to admin:', mailErr.message);
    }

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

    const ticket = await SupportTicket.findById(req.params.id).populate('userId', 'fullName name email');
    if (!ticket) {
      return sendError(res, 404, 'Support ticket not found');
    }

    ticket.replyText = replyText;
    ticket.repliedAt = new Date();
    ticket.status = status || 'Closed';
    await ticket.save();

    try {
      if (ticket.userId && ticket.userId.email) {
        const { sendEmail } = require('../utils/emailHelper');
        const merchantName = ticket.userId.fullName || ticket.userId.name || 'Merchant';
        await sendEmail({
          to: ticket.userId.email,
          subject: `Resolved: Support Ticket #${ticket._id} - ${ticket.subject}`,
          text: `Hello ${merchantName},\n\nYour support ticket "${ticket.subject}" has been reviewed and resolved by the administrator.\n\nTicket Details:\n"${ticket.description}"\n\nAdmin Response:\n${replyText}\n\nTicket Status: ${ticket.status}\n\nBest regards,\nUdumalpet Business Tour Support Team`,
          html: `
            <div style="font-family: sans-serif; padding: 25px; color: #333; max-width: 600px; border: 1px solid #e2e8f0; border-radius: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
              <h2 style="color: #027244; font-size: 20px; font-weight: 800; border-bottom: 2px solid #e6f7f0; padding-bottom: 10px; margin-top: 0;">UBT Support Desk</h2>
              <p style="font-size: 14px; line-height: 1.5;">Hello <strong>${merchantName}</strong>,</p>
              <p style="font-size: 14px; line-height: 1.5; color: #4a5568;">Your support ticket <strong>#${ticket._id}</strong> has been resolved by our moderation team.</p>
              
              <div style="background-color: #f7fafc; padding: 15px; border-left: 4px solid #718096; border-radius: 4px; margin: 15px 0;">
                <p style="margin: 0; font-size: 12px; font-weight: bold; color: #718096; text-transform: uppercase; tracking-wider;">Original Issue [${ticket.subject}]:</p>
                <p style="margin: 5px 0 0 0; font-size: 13px; color: #4a5568;">"${ticket.description || ticket.message}"</p>
              </div>
              
              <p style="font-size: 14px; line-height: 1.5; font-weight: bold; margin-top: 20px;">Resolution Response:</p>
              <div style="background-color: #e6f7f0; padding: 18px; border-radius: 12px; border: 1px solid #c3e6cb; margin: 15px 0; color: #155724;">
                <p style="margin: 0; font-size: 14px; line-height: 1.6;">${replyText}</p>
              </div>
              
              <div style="margin-top: 20px; font-size: 13px; color: #4a5568;">
                <strong>Ticket Status:</strong> <span style="background-color: #c3e6cb; color: #155724; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase;">${ticket.status}</span>
              </div>
              
              <p style="font-size: 13px; line-height: 1.5; color: #4a5568; margin-top: 25px;">If you require further assistance, you can log in to your dashboard to open a new support ticket.</p>
              
              <hr style="border: 0; border-top: 1px solid #edf2f7; margin: 25px 0;" />
              <p style="font-size: 10.5px; color: #a0aec0; text-align: center; margin: 0;">
                This is a system notification from Udumalpet Business Tour. Please do not reply directly to this email.
              </p>
            </div>
          `
        });
        console.log(`[SMTP] Support ticket resolution email successfully sent to: ${ticket.userId.email}`);
      }
    } catch (mailErr) {
      console.error('[SMTP] Failed to send support ticket reply email:', mailErr.message);
    }

    return sendSuccess(res, 200, 'Response recorded and ticket updated successfully', ticket);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
