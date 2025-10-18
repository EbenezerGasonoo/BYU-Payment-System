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
  amountInGHS: {
    type: Number,
    required: true
  },
  exchangeRate: {
    type: Number,
    required: true
  },
  chargebackFee: {
    type: Number,
    default: 5 // 5% fee
  },
  totalPaidGHS: {
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
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'pending', 'paid', 'failed'],
    default: 'unpaid'
  },
  paymentReference: {
    type: String,
    default: null
  },
  hubtelCheckoutId: {
    type: String,
    default: null
  },
  mtnReferenceId: {
    type: String,
    default: null
  },
  mtnTransactionId: {
    type: String,
    default: null
  },
  paymentMethod: {
    type: String,
    enum: ['momo-hubtel', 'momo-direct', null],
    default: null
  },
  paymentVerifiedAt: {
    type: Date,
    default: null
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

