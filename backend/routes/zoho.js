const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const zohoBooksService = require('../services/zohoBooksService');
const Payment = require('../models/Payment');

// @desc    Get Zoho Books configuration status
// @route   GET /api/zoho/status
// @access  Private/Admin
router.get('/status', protect, admin, async (req, res) => {
  const isConfigured = !!(
    process.env.ZOHO_CLIENT_ID &&
    process.env.ZOHO_CLIENT_SECRET &&
    process.env.ZOHO_REFRESH_TOKEN &&
    process.env.ZOHO_ORGANIZATION_ID
  );

  res.json({
    success: true,
    isConfigured,
    organizationId: process.env.ZOHO_ORGANIZATION_ID || null,
    accountsDomain: process.env.ZOHO_ACCOUNTS_DOMAIN || 'https://accounts.zoho.in',
    apiDomain: process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.in'
  });
});

// @desc    Test OAuth connection & Organization lookup
// @route   POST /api/zoho/test-connection
// @access  Private/Admin
router.post('/test-connection', protect, admin, async (req, res) => {
  try {
    const token = await zohoBooksService.getAccessToken();
    const orgId = (process.env.ZOHO_ORGANIZATION_ID || '').trim();
    const apiDomain = (process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.in').trim().replace(/\/$/, '');

    const orgRes = await fetch(`${apiDomain}/books/v3/organizations?organization_id=${orgId}`, {
      headers: {
        Authorization: `Zoho-oauthtoken ${token}`
      }
    });
    const orgData = await orgRes.json();

    if (orgData.code !== 0) {
      return res.status(400).json({
        success: false,
        message: `Zoho API Error: ${orgData.message}`,
        details: orgData
      });
    }

    res.json({
      success: true,
      message: 'Zoho Books OAuth connection verified successfully!',
      organizationsCount: orgData.organizations ? orgData.organizations.length : 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// @desc    Manually retry invoice sync for a payment
// @route   POST /api/zoho/retry-sync/:paymentId
// @access  Private/Admin
router.post('/retry-sync/:paymentId', protect, admin, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found' });
    }

    const result = await zohoBooksService.syncPaymentToZoho(paymentId);
    if (result && result.success) {
      return res.json({
        success: true,
        message: `Payment ${paymentId} successfully synced to Zoho Books (Invoice: ${result.invoiceNumber})`,
        invoiceNumber: result.invoiceNumber,
        invoiceId: result.invoiceId
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result ? result.error : 'Synchronization failed'
      });
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;
