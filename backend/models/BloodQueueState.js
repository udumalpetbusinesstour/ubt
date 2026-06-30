const mongoose = require('mongoose');

const BloodQueueStateSchema = new mongoose.Schema({
  bloodGroup: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  lastIndex: {
    type: Number,
    required: true,
    default: -1
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('BloodQueueState', BloodQueueStateSchema);
