const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
  },
  subscriptionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subscription',
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
  },
  orderId: {
    type: String,
  },
  paymentId: {
    type: String,
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
  amount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String, // card, upi, netbanking, etc.
    default: 'UPI',
  },
  status: {
    type: String,
    enum: ['Paid', 'Failed', 'Refunded', 'captured', 'failed'],
    default: 'Paid',
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Failed', 'Refunded'],
    default: 'Paid',
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  paidAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

function syncPaymentCompatFields(doc) {
  if (!doc) return;

  if (doc.orderId && !doc.razorpayOrderId) doc.razorpayOrderId = doc.orderId;
  if (doc.razorpayOrderId && !doc.orderId) doc.orderId = doc.razorpayOrderId;
  
  if (doc.paymentId && !doc.razorpayPaymentId) doc.razorpayPaymentId = doc.paymentId;
  if (doc.razorpayPaymentId && !doc.paymentId) doc.paymentId = doc.razorpayPaymentId;
  
  if (doc.status) {
    if (doc.status === 'captured') doc.paymentStatus = 'Paid';
    else if (doc.status === 'failed') doc.paymentStatus = 'Failed';
    else doc.paymentStatus = doc.status;
  }
  if (doc.paymentStatus && !doc.status) {
    doc.status = doc.paymentStatus;
  }
  
  if (doc.paymentDate && !doc.paidAt) doc.paidAt = doc.paymentDate;
  if (doc.paidAt && !doc.paymentDate) doc.paymentDate = doc.paidAt;
}

// Keep compatibility mirrors populated before validation.
PaymentSchema.pre('validate', function() {
  syncPaymentCompatFields(this);
});

// Pre-save syncing for compatibility between razorpay specific fields and requested general fields
PaymentSchema.pre('save', async function() {
  syncPaymentCompatFields(this);
});

module.exports = mongoose.model('Payment', PaymentSchema);
