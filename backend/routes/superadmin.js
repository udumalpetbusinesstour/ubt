const express = require('express');
const router = express.Router();
const { protect, superadmin } = require('../middleware/auth');
const {
  createAdmin,
  removeAdmin,
  deployPlan,
  getRevenueAnalytics,
  getSuperAdminStats,
  getBusinesses,
  updateBusinessStatus,
  toggleBusinessFeatured,
  deleteBusiness,
  extendSubscription,
  getUsers,
  updateUserStatus,
  deleteUser,
  getBlogs,
  updateBlog,
  deleteBlog,
  getEvents,
  updateEvent,
  deleteEvent,
  getReviews,
  updateReviewStatus,
  suspendReviewUser,
  deleteReview,
  getSubscriptions,
  updateSubscriptionStatus,
  refundSubscription,
  getSupportTickets,
  replySupportTicket,
  broadcastAnnouncement,
  sendMerchantNotice,
  getPlatformConfig,
  updatePlatformConfig,
  getPendingCategoryReviews,
  resolveCategoryReview,
  mergeCategories,
  getExpensesAnalytics
} = require('../controllers/superadminController');

// All superadmin routes require user authorization and superadmin role privileges
router.use(protect);
router.use(superadmin);

// Control Deck stats & logs
router.get('/dashboard-stats', getSuperAdminStats);

// Sub-admin creation and revocation
router.post('/admins', createAdmin);
router.delete('/admins/:id', removeAdmin);

// Core plans & custom offers
router.post('/plans', deployPlan);
router.get('/analytics', getRevenueAnalytics);

// Directories (Businesses)
router.get('/businesses', getBusinesses);
router.put('/businesses/:id/status', updateBusinessStatus);
router.put('/businesses/:id/featured', toggleBusinessFeatured);
router.delete('/businesses/:id', deleteBusiness);
router.post('/businesses/:id/extend-subscription', extendSubscription);

// Users / Merchants
router.get('/users', getUsers);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Blog Articles Moderation
router.get('/blogs', getBlogs);
router.put('/blogs/:id', updateBlog);
router.delete('/blogs/:id', deleteBlog);

// Event Listings Moderation
router.get('/events', getEvents);
router.put('/events/:id', updateEvent);
router.delete('/events/:id', deleteEvent);

// Reviews & Testimonials moderation
router.get('/reviews', getReviews);
router.put('/reviews/:id/status', updateReviewStatus);
router.post('/reviews/:id/suspend-user', suspendReviewUser);
router.delete('/reviews/:id', deleteReview);

// Billing & Manual Subscriptions override
router.get('/subscriptions', getSubscriptions);
router.put('/subscriptions/:id/status', updateSubscriptionStatus);
router.post('/subscriptions/:id/refund', refundSubscription);

// Support ticketing
router.get('/support-tickets', getSupportTickets);
router.post('/support-tickets/:id/reply', replySupportTicket);

// Global Announcement broadcasting and direct merchant alerts
router.post('/broadcast', broadcastAnnouncement);
router.post('/merchant-notice', sendMerchantNotice);

// Dynamic config settings
router.get('/config', getPlatformConfig);
router.put('/config', updatePlatformConfig);

// Category Moderation and Management
router.get('/category-review/pending', getPendingCategoryReviews);
router.post('/category-review/resolve', resolveCategoryReview);
router.post('/categories/merge', mergeCategories);

// Expense analytics
router.get('/expenses', getExpensesAnalytics);

module.exports = router;
