const mongoose = require('mongoose');

const QuerySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Sender name is required'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Sender contact email is required'],
    lowercase: true,
    trim: true,
  },
  subject: {
    type: String,
    required: [true, 'Inquiry subject is required'],
    trim: true,
  },
  message: {
    type: String,
    required: [true, 'Message body is required'],
    trim: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'Replied'],
    default: 'Pending',
  },
  replyMessage: {
    type: String,
    trim: true,
  },
  repliedAt: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Query', QuerySchema);
