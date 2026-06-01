const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
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
  razorpayOrderId: {
    type: String,
    required: true,
  },
  razorpayPaymentId: {
    type: String,
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  paymentMethod: {
    type: String, // card, upi, netbanking, etc.
    default: 'UPI',
  },
  paymentStatus: {
    type: String,
    enum: ['Paid', 'Failed', 'Refunded'],
    default: 'Paid',
  },
  paidAt: {
    type: Date,
    default: Date.now,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Payment', PaymentSchema);
