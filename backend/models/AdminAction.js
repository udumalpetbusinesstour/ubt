const mongoose = require('mongoose');

const AdminActionSchema = new mongoose.Schema({
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  targetBusinessId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Business',
    required: false,
  },
  actionType: {
    type: String,
    enum: ['approve', 'reject', 'suspend', 'reactivate', 'feature_toggle'],
    required: true,
  },
  remarks: {
    type: String,
    required: true,
  }
}, {
  timestamps: {
    createdAt: true,
    updatedAt: false
  }
});

module.exports = mongoose.model('AdminAction', AdminActionSchema);
