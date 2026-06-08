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
  },
  category: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
  },
  yearEstablished: {
    type: Number,
  },
  employeeCount: {
    type: String,
  },
  gstNumber: {
    type: String,
    trim: true,
  },
  services: {
    type: [String],
    default: [],
  },
  brands: {
    type: [String],
    default: [],
  },
  whatsapp: {
    type: String,
    trim: true,
  },
  email: {
    type: String,
    trim: true,
  },
  website: {
    type: String,
    trim: true,
  },
  instagram: {
    type: String,
    trim: true,
  },
  facebook: {
    type: String,
    trim: true,
  },
  locality: {
    type: String,
  },
  pincode: {
    type: String,
  },
  logoUrl: {
    type: String,
    default: '',
  },
  coverImageUrl: {
    type: String,
    default: '',
  },
  galleryUrls: {
    type: [String],
    default: [],
  },
  timings: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      Monday: '9:00 AM - 8:00 PM',
      Tuesday: '9:00 AM - 8:00 PM',
      Wednesday: '9:00 AM - 8:00 PM',
      Thursday: '9:00 AM - 8:00 PM',
      Friday: '9:00 AM - 8:00 PM',
      Saturday: '9:00 AM - 8:00 PM',
      Sunday: '9:00 AM - 1:00 PM',
    },
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Branch', BranchSchema);

