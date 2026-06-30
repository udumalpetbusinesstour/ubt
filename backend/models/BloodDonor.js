const mongoose = require('mongoose');

const BloodDonorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true,
  },
  bloodGroup: {
    type: String,
    required: [true, 'Blood group is required'],
    trim: true,
  },
  contactNum: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastAssignedAt: {
    type: Date,
    default: null,
  },
});

module.exports = mongoose.model('BloodDonor', BloodDonorSchema);
