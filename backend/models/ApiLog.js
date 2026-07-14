const mongoose = require('mongoose');

const ApiLogSchema = new mongoose.Schema({
  method: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  statusCode: {
    type: Number,
    required: true,
  },
  responseTime: {
    type: Number,
    required: true, // in milliseconds
  },
  ip: {
    type: String,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  userEmail: {
    type: String,
    default: null,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  }
}, {
  // Capped collection of 10MB or 10,000 documents max
  capped: { size: 10 * 1024 * 1024, max: 10000 }
});

module.exports = mongoose.model('ApiLog', ApiLogSchema);
