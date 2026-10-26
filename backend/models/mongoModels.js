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

// Never serialize credentials or one-time tokens to API clients
const SENSITIVE_STUDENT_FIELDS = ['password', 'verificationToken', 'resetPasswordToken', 'resetPasswordCode', 'resetPasswordExpires'];
studentSchema.set('toJSON', {
  transform: (doc, ret) => {
    SENSITIVE_STUDENT_FIELDS.forEach((field) => delete ret[field]);
    return ret;
  }
});

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
  // Mirrors the SQL CardRequest model — Mongoose strict mode silently drops unknown fields
  amountInGHS:        { type: Number, default: null },
  amountLocal:        { type: Number, default: null },
  chargebackFee:      { type: Number, default: 5 },
  purpose:            { type: String, default: 'School Fees Payment' },
  country:            { type: String, default: 'GH' },
  currency:           { type: String, default: 'GHS' },
  paymentGateway:     { type: String, default: 'hubtel' },
  gatewayReference:   { type: String, default: null },
  hubtelCheckoutId:   { type: String, default: null },
  mtnReferenceId:     { type: String, default: null },
  mtnTransactionId:   { type: String, default: null },
  cardStatus:         { type: String, enum: ['active', 'frozen', 'terminated', 'pending'], default: 'pending' },
  paymentVerifiedAt:  { type: Date, default: null },
  // Issuer that issued the card ('manual', 'sudo', 'maplerad', 'simulation') and its card id there
  issuer:             { type: String, default: null },
  providerCardId:     { type: String, default: null },
  // Set when a card expired but its issuer has no API, so someone must close it by hand
  needsManualClose:   { type: Boolean, default: false },
  manualClosedAt:     { type: Date, default: null },
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

// ── FloatEntry (Mongoose / MongoDB) ──────────────────────────────
// One line of a country's USD card float: positive top-ups, negative card debits
const floatEntrySchema = new mongoose.Schema({
  country:       { type: String, required: true },
  type:          { type: String, enum: ['topup', 'debit'], required: true },
  amountUsd:     { type: Number, required: true },
  entryDate:     { type: Date, default: Date.now },
  note:          { type: String, default: '' },
  cardRequestId: { type: String, default: null },
}, { timestamps: true, collection: 'floatentries' });

const MongoStudent        = mongoose.model('Student',        studentSchema);
const MongoCardRequest    = mongoose.model('CardRequest',    cardRequestSchema);
const MongoContactMessage = mongoose.model('ContactMessage', contactMessageSchema);
const MongoChatMessage    = mongoose.model('ChatMessage',    chatMessageSchema);
const MongoFloatEntry     = mongoose.model('FloatEntry',     floatEntrySchema);

module.exports = { MongoStudent, MongoCardRequest, MongoContactMessage, MongoChatMessage, MongoFloatEntry };
