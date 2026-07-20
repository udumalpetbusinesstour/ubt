const Payment = require('../models/Payment');
const Business = require('../models/Business');
const User = require('../models/User');

let cachedAccessToken = null;
let tokenExpiresAt = 0;

/**
 * Fetch dynamic OAuth access token using Refresh Token from Zoho Accounts
 */
const getAccessToken = async () => {
  const clientId = (process.env.ZOHO_CLIENT_ID || '').trim();
  const clientSecret = (process.env.ZOHO_CLIENT_SECRET || '').trim();
  const refreshToken = (process.env.ZOHO_REFRESH_TOKEN || '').trim();
  const accountsDomain = (process.env.ZOHO_ACCOUNTS_DOMAIN || 'https://accounts.zoho.in').trim().replace(/\/$/, '');

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error('Zoho Books API credentials (ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN) are missing in .env');
  }

  // Return cached token if valid for at least another 60 seconds
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedAccessToken;
  }

  const tokenUrl = `${accountsDomain}/oauth/v2/token?refresh_token=${encodeURIComponent(refreshToken)}&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}&grant_type=refresh_token`;

  const response = await fetch(tokenUrl, { method: 'POST' });
  const data = await response.json();

  if (data.error) {
    throw new Error(`Zoho OAuth token generation failed: ${data.error}`);
  }

  cachedAccessToken = data.access_token;
  tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
  console.log('[ZOHO BOOKS] OAuth Access Token refreshed successfully.');
  return cachedAccessToken;
};

/**
 * Get configured API headers for Zoho Books API
 */
const getZohoHeaders = async () => {
  const token = await getAccessToken();
  return {
    Authorization: `Zoho-oauthtoken ${token}`,
    'Content-Type': 'application/json;charset=UTF-8',
  };
};

/**
 * Search or create a Contact in Zoho Books
 */
const findOrCreateContact = async (customerData) => {
  const orgId = (process.env.ZOHO_ORGANIZATION_ID || '').trim();
  const apiDomain = (process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.in').trim().replace(/\/$/, '');
  const headers = await getZohoHeaders();

  const { name, email, phone, companyName, gstin } = customerData;
  const searchEmail = (email || '').trim();
  const searchPhone = (phone || '').trim();

  // 1. Search existing contact by email or phone
  if (searchEmail || searchPhone) {
    let queryParam = searchEmail ? `email=${encodeURIComponent(searchEmail)}` : `phone=${encodeURIComponent(searchPhone)}`;
    const searchUrl = `${apiDomain}/books/v3/contacts?organization_id=${orgId}&${queryParam}`;
    
    try {
      const searchRes = await fetch(searchUrl, { headers });
      const searchData = await searchRes.json();
      if (searchData.code === 0 && searchData.contacts && searchData.contacts.length > 0) {
        console.log(`[ZOHO BOOKS] Existing contact found: ${searchData.contacts[0].contact_id}`);
        return searchData.contacts[0].contact_id;
      }
    } catch (err) {
      console.warn(`[ZOHO BOOKS] Contact search query failed: ${err.message}`);
    }
  }

  // 2. Create new contact
  const createUrl = `${apiDomain}/books/v3/contacts?organization_id=${orgId}`;
  const contactPayload = {
    contact_name: (companyName || name || 'UBT Customer').trim(),
    company_name: (companyName || name || 'UBT Merchant').trim(),
    contact_type: 'customer',
    customer_name: (name || companyName || 'UBT Merchant').trim(),
    email: searchEmail,
    phone: searchPhone,
    gst_no: (gstin || '').trim(),
    gst_treatment: gstin ? 'business_gst' : 'consumer',
    place_of_supply: 'TN' // Default to Tamil Nadu
  };

  const createRes = await fetch(createUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(contactPayload),
  });
  const createData = await createRes.json();

  if (createData.code !== 0 || !createData.contact) {
    throw new Error(`Failed to create Zoho Books contact: ${createData.message || JSON.stringify(createData)}`);
  }

  console.log(`[ZOHO BOOKS] New contact created: ${createData.contact.contact_id}`);
  return createData.contact.contact_id;
};

/**
 * Generate Invoice in Zoho Books
 */
const createInvoice = async (invoiceData) => {
  const orgId = (process.env.ZOHO_ORGANIZATION_ID || '').trim();
  const apiDomain = (process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.in').trim().replace(/\/$/, '');
  const headers = await getZohoHeaders();

  const { customerId, itemName, description, rate, dateStr } = invoiceData;

  const invoiceUrl = `${apiDomain}/books/v3/invoices?organization_id=${orgId}`;
  const invoicePayload = {
    customer_id: customerId,
    date: dateStr || new Date().toISOString().split('T')[0],
    line_items: [
      {
        name: itemName,
        description: description || 'UBT Platform Listing & Subscription Charge',
        rate: Number(rate),
        quantity: 1
      }
    ],
    notes: 'Thank you for listing your business on Udumalpet Business Tour (UBT). All prices include applicable taxes.'
  };

  const res = await fetch(invoiceUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(invoicePayload),
  });
  const data = await res.json();

  if (data.code !== 0 || !data.invoice) {
    throw new Error(`Failed to create Zoho Books invoice: ${data.message || JSON.stringify(data)}`);
  }

  console.log(`[ZOHO BOOKS] Invoice created successfully: ${data.invoice.invoice_number} (ID: ${data.invoice.invoice_id})`);
  return {
    invoiceId: data.invoice.invoice_id,
    invoiceNumber: data.invoice.invoice_number
  };
};

/**
 * Record Payment against Invoice in Zoho Books
 */
const recordPayment = async (paymentData) => {
  const orgId = (process.env.ZOHO_ORGANIZATION_ID || '').trim();
  const apiDomain = (process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.in').trim().replace(/\/$/, '');
  const headers = await getZohoHeaders();

  const { customerId, invoiceId, amount, paymentMethod, referenceNumber, dateStr } = paymentData;

  const paymentUrl = `${apiDomain}/books/v3/customerpayments?organization_id=${orgId}`;
  const paymentPayload = {
    customer_id: customerId,
    payment_mode: (paymentMethod || 'Razorpay / UPI').trim(),
    amount: Number(amount),
    date: dateStr || new Date().toISOString().split('T')[0],
    reference_number: (referenceNumber || '').trim(),
    invoices: [
      {
        invoice_id: invoiceId,
        amount_applied: Number(amount)
      }
    ],
    notes: `Payment recorded via UBT Payment Gateway (${referenceNumber})`
  };

  const res = await fetch(paymentUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(paymentPayload),
  });
  const data = await res.json();

  if (data.code !== 0) {
    console.warn(`[ZOHO BOOKS] Payment record notice: ${data.message}`);
  } else {
    console.log(`[ZOHO BOOKS] Payment recorded for invoice ${invoiceId}.`);
  }
};

/**
 * Master sync function to push payment & invoice to Zoho Books
 */
const syncPaymentToZoho = async (paymentId) => {
  try {
    const payment = await Payment.findById(paymentId).populate('userId businessId eventId');
    if (!payment) {
      console.warn(`[ZOHO BOOKS] Payment ${paymentId} not found for sync.`);
      return;
    }

    if (!process.env.ZOHO_CLIENT_ID || !process.env.ZOHO_CLIENT_SECRET || !process.env.ZOHO_REFRESH_TOKEN) {
      console.log(`[ZOHO BOOKS] Synchronization skipped (ZOHO credentials not set in .env).`);
      return;
    }

    console.log(`[ZOHO BOOKS] Starting invoice sync for Payment ID: ${payment._id}...`);

    const user = payment.userId || {};
    const business = payment.businessId || {};
    const event = payment.eventId || {};

    const customerName = user.fullName || business.businessName || 'UBT Customer';
    const email = user.email || business.ownerEmail || business.email || '';
    const phone = user.phone || user.mobileNumber || business.phone || business.whatsappPhone || '';
    const companyName = business.businessName || 'UBT Business Directory';
    const gstin = business.gstNumber || '';

    // 1. Find or Create Contact
    const contactId = await findOrCreateContact({
      name: customerName,
      email,
      phone,
      companyName,
      gstin
    });

    // 2. Determine Item Name & Description
    let itemName = 'UBT Business Subscription';
    let description = 'UBT Premium Business Listing Subscription Charge';
    if (payment.eventId) {
      itemName = 'UBT Event Listing Fee';
      description = `Event Listing Promotion Fee: ${event.title || 'Local Event'}`;
    } else if (payment.isSponsoredAd || payment.promotionId) {
      itemName = 'UBT Sponsored Ad Promotion';
      description = `Homepage Sponsored Banner Promotion`;
    }

    const dateStr = (payment.paidAt || payment.createdAt || new Date()).toISOString().split('T')[0];

    // 3. Create Invoice
    const invoiceRes = await createInvoice({
      customerId: contactId,
      itemName,
      description,
      rate: payment.amount,
      dateStr
    });

    // 4. Record Payment against Invoice
    await recordPayment({
      customerId: contactId,
      invoiceId: invoiceRes.invoiceId,
      amount: payment.amount,
      paymentMethod: payment.paymentMethod || 'Razorpay / UPI',
      referenceNumber: payment.razorpayPaymentId || payment.paymentId || payment.orderId,
      dateStr
    });

    // 5. Update Payment record with Zoho IDs
    payment.zohoContactId = contactId;
    payment.zohoInvoiceId = invoiceRes.invoiceId;
    payment.zohoInvoiceNumber = invoiceRes.invoiceNumber;
    payment.zohoSyncStatus = 'synced';
    payment.zohoSyncError = null;
    await payment.save();

    console.log(`[ZOHO BOOKS] Payment ${payment._id} synced successfully to Zoho Invoice ${invoiceRes.invoiceNumber}.`);
    return { success: true, invoiceNumber: invoiceRes.invoiceNumber, invoiceId: invoiceRes.invoiceId };
  } catch (error) {
    console.error(`[ZOHO BOOKS] Sync failed for payment ${paymentId}: ${error.message}`);
    try {
      await Payment.findByIdAndUpdate(paymentId, {
        zohoSyncStatus: 'failed',
        zohoSyncError: error.message
      });
    } catch (e) {}
    return { success: false, error: error.message };
  }
};

module.exports = {
  getAccessToken,
  findOrCreateContact,
  createInvoice,
  recordPayment,
  syncPaymentToZoho
};
