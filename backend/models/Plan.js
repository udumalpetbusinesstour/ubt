const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true,
  },
  type: {
    type: String,
    enum: ['Monthly', 'Yearly', 'Custom'],
    required: true,
  },
  price: {
    type: Number,
    required: [true, 'Plan price is required'],
    min: [0, 'Price cannot be negative'],
  },
  durationDays: {
    type: Number,
    required: [true, 'Duration in days is required'],
    min: [1, 'Duration must be at least 1 day'],
  },
  description: {
    type: String,
    trim: true,
  },
  isOffer: {
    type: Boolean,
    default: false,
  },
  offerText: {
    type: String,
    trim: true,
  },
  features: {
    type: [String],
    default: [],
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Plan', PlanSchema);
