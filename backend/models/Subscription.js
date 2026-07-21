const mongoose = require('mongoose');

const SubscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  plan: {
    type: String,
    required: true,
  },
  planName: {
    type: String,
    required: true,
  },
  planType: {
    type: String,
  },
  amount: {
    type: Number,
    required: true,
  },
  amountPaid: {
    type: Number,
    required: true,
  },
  referralDiscount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'pending', 'refunded', 'queued'],
    default: 'pending',
  },
  razorpayOrderId: {
    type: String,
  },
  razorpaySubscriptionId: {
    type: String,
  },
  razorpayPaymentId: {
    type: String,
  },
  startDate: {
    type: Date,
  },
  endDate: {
    type: Date,
  },
  expiryDate: {
    type: Date,
  },
  autoRenew: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true
});

function syncSubscriptionCompatFields(doc) {
  if (!doc) return;

  if (doc.userId && !doc.ownerId) doc.ownerId = doc.userId;
  if (doc.ownerId && !doc.userId) doc.userId = doc.ownerId;

  if (doc.plan && !doc.planName) doc.planName = doc.plan;
  if (doc.planName && !doc.plan) doc.plan = doc.planName;
  
  if (doc.plan && !doc.planType) doc.planType = doc.plan.toLowerCase();
  if (doc.planType && !doc.plan) {
    doc.plan = doc.planType.charAt(0).toUpperCase() + doc.planType.slice(1);
  }
  
  if (doc.amount !== undefined && doc.amountPaid === undefined) doc.amountPaid = doc.amount;
  if (doc.amountPaid !== undefined && doc.amount === undefined) doc.amount = doc.amountPaid;
  
  if (doc.endDate && !doc.expiryDate) doc.expiryDate = doc.endDate;
  if (doc.expiryDate && !doc.endDate) doc.endDate = doc.expiryDate;
}

// Keep compatibility mirrors populated before validation checks required fields.
SubscriptionSchema.pre('validate', function() {
  syncSubscriptionCompatFields(this);
});

// Pre-save syncing for plan/planType and endDate/expiryDate and general compatibilities
SubscriptionSchema.pre('save', async function() {
  syncSubscriptionCompatFields(this);
});

// High performance database indexing for scalable subscription lookups
SubscriptionSchema.index({ businessId: 1, status: 1 });
SubscriptionSchema.index({ razorpaySubscriptionId: 1 });
SubscriptionSchema.index({ razorpayOrderId: 1 });

module.exports = mongoose.model('Subscription', SubscriptionSchema);
