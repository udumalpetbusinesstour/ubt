const mongoose = require('mongoose');

const PlatformStatsSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    default: 'homepage'
  },
  views: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('PlatformStats', PlatformStatsSchema);
