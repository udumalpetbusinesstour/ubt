const mongoose = require('mongoose');

const BloodRequestSchema = new mongoose.Schema({
  hospitalName: {
    type: String,
    required: [true, 'Hospital name is required'],
    trim: true
  },
  patientName: {
    type: String,
    required: [true, 'Patient name is required'],
    trim: true
  },
  bloodGroup: {
    type: String,
    required: [true, 'Blood group is required'],
    trim: true,
    uppercase: true
  },
  patientAddress: {
    type: String,
    required: [true, 'Patient address is required'],
    trim: true
  },
  mobileNum: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true
  },
  altMobileNum: {
    type: String,
    trim: true
  },
  cause: {
    type: String,
    required: [true, 'Cause/Reason is required'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  approvedDonors: [
    {
      name: String,
      contactNum: String,
      location: String
    }
  ],
  approvedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BloodRequest', BloodRequestSchema);
