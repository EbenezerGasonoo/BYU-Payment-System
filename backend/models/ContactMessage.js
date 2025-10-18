const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  byuId: {
    type: String,
    trim: true
  },
  subject: {
    type: String,
    required: true,
    enum: ['general', 'card-request', 'registration', 'payment', 'technical', 'other'],
    default: 'general'
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['new', 'read', 'responded', 'resolved'],
    default: 'new'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  respondedAt: {
    type: Date,
    default: null
  }
});

module.exports = mongoose.model('ContactMessage', contactMessageSchema);



