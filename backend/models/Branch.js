const mongoose = require('mongoose');

const BranchSchema = new mongoose.Schema({
  businessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
    trim: true,
  },
  phone: {
    type: String,
    required: true,
    trim: true,
  },
  googleMapsLocation: {
    type: String,
    trim: true,
  },
  googleBusinessLink: {
    type: String,
    trim: true,
  },
  workingHours: {
    type: String,
    trim: true,
    default: '9:00 AM - 8:00 PM',
  },
  branchManagerName: {
    type: String,
    trim: true,
  },
  latitude: {
    type: Number,
    required: true,
    default: 10.5891,
  },
  longitude: {
    type: Number,
    required: true,
    default: 77.2412,
  },
  coordinates: {
    lat: { type: Number, default: 10.5891 },
    lng: { type: Number, default: 77.2412 },
  },
  status: {
    type: String,
    enum: ['Pending Verification', 'Under Review', 'Approved', 'Rejected', 'Suspended'],
    default: 'Pending Verification',
  },
  isPrimary: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Branch', BranchSchema);
