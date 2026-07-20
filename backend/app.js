const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorMiddleware');

const app = express();

// Trust reverse proxy for rate limiter (Render, Heroku, etc.)
app.set('trust proxy', 1);

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: false
}));
app.use(cors({
  origin: '*', // Allows broad connection while in development, can be configured specifically in production
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting to prevent brute-force and spamming
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 200 : 10000, // Limit each IP (200 in prod, 10000 in dev)
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', apiLimiter);

// Logging HTTP Requests
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Request Parsers
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const path = require('path');

// Static uploads folder fallback
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

// API Performance Logging Middleware
const apiLogMiddleware = require('./middleware/apiLogMiddleware');
app.use('/api', apiLogMiddleware);

// Disable caching for all API responses to prevent stale status or profile state on client devices/mobile browsers
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Route Mappings
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/businesses', require('./routes/businesses'));
app.use('/api/branches', require('./routes/branches'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/reviews', require('./routes/reviews'));
app.use('/api/subscriptions', require('./routes/subscriptions'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/blogs', require('./routes/blogs'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/events', require('./routes/events'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/superadmin', require('./routes/superadmin'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/referrals', require('./routes/referrals'));
app.use('/api/support', require('./routes/support'));
app.use('/api/testimonials', require('./routes/testimonials'));
app.use('/api/queries', require('./routes/queries'));
app.use('/api/plans', require('./routes/plans'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/update-subscribers', require('./routes/updateSubscribers'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/blood-donors', require('./routes/bloodDonors'));
app.use('/api/blood-requests', require('./routes/bloodRequests'));

// Dynamic slug/ID lookup endpoint to resolve event/blog/business routing at the root URL
app.get('/api/slug-lookup/:slug', async (req, res) => {
  try {
    const slug = req.params.slug.toLowerCase();
    const mongoose = require('mongoose');
    const isValidId = mongoose.isValidObjectId(req.params.slug);

    // Check Event collection
    const Event = require('./models/Event');
    const eventMatch = isValidId 
      ? await Event.findById(req.params.slug)
      : await Event.findOne({ slug });
    if (eventMatch) {
      return res.json({ success: true, type: 'event', id: eventMatch._id });
    }

    // Check Blog collection
    const Blog = require('./models/Blog');
    const blogMatch = isValidId 
      ? await Blog.findById(req.params.slug)
      : await Blog.findOne({ slug });
    if (blogMatch) {
      return res.json({ success: true, type: 'blog', id: blogMatch._id });
    }

    // Check Business collection
    const Business = require('./models/Business');
    const businessMatch = isValidId
      ? await Business.findById(req.params.slug)
      : await Business.findOne({ slug });
    if (businessMatch) {
      return res.json({ success: true, type: 'business', id: businessMatch._id });
    }

    res.json({ success: false, type: 'unknown' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Root & Health Status Check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Udumalpet Business Tour (UBT) Platform APIs are fully operational.'
  });
});

// Centralized Exception & Validation Error Handler
app.use(errorHandler);

module.exports = app;
