const mongoose = require('mongoose');

const RedemptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  points: {
    type: Number,
    required: true,
    default: 1000,
  },
  status: {
    type: String,
    enum: ['Pending Approval', 'Refunded', 'Rejected'],
    default: 'Pending Approval',
  },
  remarks: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Redemption', RedemptionSchema);
