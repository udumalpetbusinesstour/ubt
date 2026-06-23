const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Lead name is required'],
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Lead phone number is required'],
    trim: true,
  },
  message: {
    type: String,
    required: [true, 'Lead message is required'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Responded', 'Rectified'],
    default: 'Pending',
  },
  reply: {
    type: String,
    trim: true,
  },
  respondedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Lead', LeadSchema);
