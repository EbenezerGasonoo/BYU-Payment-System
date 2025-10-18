const mongoose = require('mongoose');

const cardRequestSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  purpose: {
    type: String,
    default: 'School Fees Payment'
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'paid', 'expired', 'declined'],
    default: 'pending'
  },
  requestToken: {
    type: String,
    required: true,
    unique: true
  },
  virtualCardNumber: {
    type: String,
    default: null
  },
  cardExpiryDate: {
    type: String,
    default: null
  },
  cardCVV: {
    type: String,
    default: null
  },
  assignedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('CardRequest', cardRequestSchema);

