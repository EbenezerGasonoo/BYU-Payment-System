const mongoose = require('mongoose');

// ── Student (Mongoose / MongoDB) ──────────────────────────────────
const studentSchema = new mongoose.Schema({
  name:               { type: String, required: true },
  byuId:              { type: String, required: true, unique: true },
  email:              { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:              { type: String, required: true },
  countryCode:        { type: String, default: 'GH' },
  preferredCurrency:  { type: String, default: 'GHS' },
  preferredLanguage:  { type: String, default: 'en' },
  whatsappNumber:     { type: String, default: null },
  isVerified:         { type: Boolean, default: false },
  verificationToken:  { type: String, default: null },
  password:           { type: String, default: null },
  resetPasswordToken: { type: String, default: null },
  resetPasswordCode:  { type: String, default: null },
  resetPasswordExpires:{ type: Date, default: null },
  status:             { type: String, enum: ['active', 'deleted'], default: 'active' },
  deletedAt:          { type: Date, default: null },
}, { timestamps: true, collection: 'students' });

// ── CardRequest (Mongoose / MongoDB) ─────────────────────────────
const cardRequestSchema = new mongoose.Schema({
  studentId:          { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  amount:             { type: Number, required: true },
  totalPaidGHS:       { type: Number, default: 0 },
  exchangeRate:       { type: Number, default: 0 },
  feeGHS:             { type: Number, default: 0 },
  paymentMethod:      { type: String, default: 'mobile_money' },
  paymentStatus:      { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' },
  status:             { type: String, enum: ['pending', 'assigned', 'paid', 'expired', 'declined'], default: 'pending' },
  requestToken:       { type: String },
  virtualCardNumber:  { type: String, default: null },
  cardholderName:     { type: String, default: null },
  cardExpiryDate:     { type: String, default: null },
  cardCVV:            { type: String, default: null },
  assignedAt:         { type: Date, default: null },
  expiresAt:          { type: Date, default: null },
  paidAt:             { type: Date, default: null },
  hubtelReference:    { type: String, default: null },
  paymentReference:   { type: String, default: null },
}, { timestamps: true, collection: 'cardrequests' });

// Attach a virtual 'student' populate hook so existing code that does
// include: [{ model: Student, as: 'student' }] can be adapted
cardRequestSchema.virtual('student', {
  ref: 'Student',
  localField: 'studentId',
  foreignField: '_id',
  justOne: true
});
cardRequestSchema.set('toObject', { virtuals: true });
cardRequestSchema.set('toJSON',   { virtuals: true });

// ── ContactMessage (Mongoose / MongoDB) ──────────────────────────
const contactMessageSchema = new mongoose.Schema({
  name:    { type: String, required: true },
  email:   { type: String, required: true },
  subject: { type: String, default: '' },
  message: { type: String, required: true },
  status:  { type: String, enum: ['new', 'read', 'replied'], default: 'new' },
}, { timestamps: true, collection: 'contactmessages' });

// ── ChatMessage (Mongoose / MongoDB) ─────────────────────────────
const chatMessageSchema = new mongoose.Schema({
  sessionId: { type: String },
  sender:    { type: String, enum: ['student', 'admin'], default: 'student' },
  message:   { type: String, required: true },
  byuId:     { type: String, default: null },
}, { timestamps: true, collection: 'chatmessages' });

const MongoStudent        = mongoose.model('Student',        studentSchema);
const MongoCardRequest    = mongoose.model('CardRequest',    cardRequestSchema);
const MongoContactMessage = mongoose.model('ContactMessage', contactMessageSchema);
const MongoChatMessage    = mongoose.model('ChatMessage',    chatMessageSchema);

module.exports = { MongoStudent, MongoCardRequest, MongoContactMessage, MongoChatMessage };
