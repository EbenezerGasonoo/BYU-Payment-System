const express = require('express');
const router = express.Router();
const { Op, fn, col, literal } = require('sequelize');
const bcrypt = require('bcryptjs');
const { Student, CardRequest } = require('../models');
const { notifyStudentCardAssigned, sendWelcomeEmail } = require('../utils/emailService');
const { CARD_SIMULATION_ENABLED } = require('../utils/cardProviderService');
const cardIssuers = require('../utils/cardIssuers');
const cardFloatService = require('../utils/cardFloatService');
const { closeExpiredCard } = require('../utils/cronJobs');
const { STUDENT_COUNTRIES, CARD_FEE_PERCENT } = require('../utils/paymentGatewayService');

// West Africa country reference
const WEST_AFRICA_COUNTRIES = {
  GH: { name: 'Ghana',        flag: '🇬🇭', currency: 'GHS' },
  NG: { name: 'Nigeria',      flag: '🇳🇬', currency: 'NGN' },
  SN: { name: 'Senegal',      flag: '🇸🇳', currency: 'XOF' },
  CI: { name: 'Ivory Coast',  flag: '🇨🇮', currency: 'XOF' },
  CM: { name: 'Cameroon',     flag: '🇨🇲', currency: 'XAF' },
  TG: { name: 'Togo',         flag: '🇹🇬', currency: 'XOF' },
  BJ: { name: 'Benin',        flag: '🇧🇯', currency: 'XOF' },
  SL: { name: 'Sierra Leone', flag: '🇸🇱', currency: 'SLL' },
  LR: { name: 'Liberia',      flag: '🇱🇷', currency: 'LRD' },
  GM: { name: 'Gambia',       flag: '🇬🇲', currency: 'GMD' },
};

// Requests made before per-country support carry no country; they came from the student's country (Ghana by default)
const requestCountry = (r) => String(r.country || r.student?.countryCode || 'GH').toUpperCase();

// ?country=GH|NG narrows admin lists and stats to one pilot country; anything else means all
const countryFilterFrom = (req) => {
  const code = String(req.query.country || '').toUpperCase();
  return STUDENT_COUNTRIES.includes(code) ? code : null;
};

const isPaid = (r) => r.paymentStatus === 'paid' || r.status === 'paid';
const localTotal = (r) => Number(r.amountLocal ?? r.totalPaidGHS ?? 0);
const round2 = (n) => Math.round(n * 100) / 100;

/** Per-country operations report built from the country's requests and float */
function buildCountryReport(country, requests, float) {
  const paid = requests.filter(isPaid);
  const localCollected = paid.reduce((s, r) => s + localTotal(r), 0);
  const usdVolume = paid.reduce((s, r) => s + (Number(r.amount) || 0), 0);
  const issuer = cardIssuers.resolveCountryIssuer(country);
  return {
    countryCode: country,
    ...(WEST_AFRICA_COUNTRIES[country] || { name: country, flag: '🌍', currency: 'USD' }),
    issuer: issuer.issuer,
    issuerSource: issuer.source,
    issuerIsApi: issuer.candidates.length > 0,
    requests: requests.length,
    pending: requests.filter((r) => r.status === 'pending').length,
    paid: paid.length,
    cardsIssued: requests.filter((r) => r.virtualCardNumber).length,
    usdVolume: round2(usdVolume),
    localCollected: round2(localCollected),
    feesEarnedUsd: round2(usdVolume * CARD_FEE_PERCENT / 100),
    // The fee is CARD_FEE_PERCENT on top of the USD amount, so it is that share of the local total
    feesEarnedLocal: round2(localCollected * CARD_FEE_PERCENT / (100 + CARD_FEE_PERCENT)),
    floatBalance: float ? float.balance : 0,
    floatLowBalance: float ? float.lowBalance : false,
    floatLowBalanceThreshold: float ? float.lowBalanceThreshold : null,
    needsManualClose: requests.filter((r) => r.needsManualClose).length
  };
}

// Middleware to verify admin key
const verifyAdminKey = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];

  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized: Invalid admin key'
    });
  }

  next();
};

// Apply admin middleware to all routes
router.use(verifyAdminKey);

// ── Verify admin key (used by AdminLogin page to validate key) ──
router.get('/verify', (req, res) => {
  res.json({ success: true, message: 'Admin key is valid', cardSimulation: CARD_SIMULATION_ENABLED });
});

// ── Get a single student by byuId (used for impersonation) ──
router.get('/users/by-byu/:byuId', async (req, res) => {
  try {
    const { byuId } = req.params;
    const student = await Student.findOne({ where: { byuId } });
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }
    res.json({ success: true, data: student });
  } catch (error) {
    console.error('Error fetching student for impersonation:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});


router.get('/requests', async (req, res) => {
  try {
    const { status } = req.query;
    const country = countryFilterFrom(req);

    const where = status ? { status } : undefined;
    const requests = await CardRequest.findAll({
      where,
      include: [{ model: Student, as: 'student' }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: country ? requests.filter((r) => requestCountry(r) === country) : requests
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Manually assign card to request
router.post('/assign', async (req, res) => {
  try {
    const { requestId, cardNumber, cardholderName, expiryDate, cvv } = req.body;

    if (!requestId || !cardNumber || !cardholderName || !expiryDate || !cvv) {
      return res.status(400).json({
        success: false,
        message: 'All card details are required (Card Number, Cardholder Name, Expiry Date, CVV)'
      });
    }

    const cardRequest = await CardRequest.findByPk(requestId, {
      include: [{ model: Student, as: 'student' }]
    });
    if (!cardRequest) {
      return res.status(404).json({
        success: false,
        message: 'Card request not found'
      });
    }

    if (cardRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Card request is not pending'
      });
    }

    // Update card request with manual card details
    cardRequest.virtualCardNumber = cardNumber;
    cardRequest.cardholderName = cardholderName;
    cardRequest.cardExpiryDate = expiryDate;
    cardRequest.cardCVV = cvv;
    cardRequest.country = requestCountry(cardRequest);
    cardRequest.issuer = 'manual';
    cardRequest.providerCardId = null;
    cardRequest.status = 'assigned';
    cardRequest.assignedAt = new Date();
    cardRequest.expiresAt = new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 hours from now

    await cardRequest.save();
    await cardFloatService.safeDebitForCard(cardRequest);

    // Notify student
    await notifyStudentCardAssigned(cardRequest.student, cardRequest);

    res.json({
      success: true,
      message: 'Card assigned successfully',
      data: cardRequest
    });
  } catch (error) {
    console.error('Error assigning card:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Auto-generate and assign mock card (test environments only)
router.post('/assign/mock', async (req, res) => {
  if (!CARD_SIMULATION_ENABLED) {
    return res.status(403).json({
      success: false,
      message: 'Mock cards are disabled. Assign a real card instead.'
    });
  }

  try {
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required'
      });
    }

    const cardRequest = await CardRequest.findByPk(requestId, {
      include: [{ model: Student, as: 'student' }]
    });
    if (!cardRequest) {
      return res.status(404).json({
        success: false,
        message: 'Card request not found'
      });
    }

    if (cardRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Card request is not pending'
      });
    }

    // Generate mock card details
    const cardNumber = '4' + Math.floor(Math.random() * 1e15).toString().padStart(15, '0');
    const expiryMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const expiryYear = String(new Date().getFullYear() + 2).slice(-2);
    const expiryDate = `${expiryMonth}/${expiryYear}`;
    const cvv = Math.floor(Math.random() * 900 + 100).toString();

    // Update card request
    cardRequest.virtualCardNumber = cardNumber;
    cardRequest.cardExpiryDate = expiryDate;
    cardRequest.cardCVV = cvv;
    cardRequest.country = requestCountry(cardRequest);
    cardRequest.issuer = 'simulation';
    cardRequest.status = 'assigned';
    cardRequest.assignedAt = new Date();
    cardRequest.expiresAt = new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 hours from now

    await cardRequest.save();

    // Notify student
    await notifyStudentCardAssigned(cardRequest.student, cardRequest);

    res.json({
      success: true,
      message: 'Mock card generated and assigned successfully',
      data: cardRequest
    });
  } catch (error) {
    console.error('Error assigning mock card:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Update cardholder name for an existing assigned card
router.post('/update-cardholder', async (req, res) => {
  try {
    const { requestId, cardholderName } = req.body;

    if (!requestId || !cardholderName) {
      return res.status(400).json({
        success: false,
        message: 'Request ID and cardholder name are required'
      });
    }

    const cardRequest = await CardRequest.findByPk(requestId);
    if (!cardRequest) {
      return res.status(404).json({
        success: false,
        message: 'Card request not found'
      });
    }

    if (cardRequest.status !== 'assigned') {
      return res.status(400).json({
        success: false,
        message: 'Card must be in assigned status'
      });
    }

    cardRequest.cardholderName = cardholderName;
    await cardRequest.save();

    res.json({
      success: true,
      message: 'Cardholder name updated successfully',
      data: cardRequest
    });
  } catch (error) {
    console.error('Error updating cardholder name:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Mark card request as paid, expired, or declined
router.post('/action', async (req, res) => {
  try {
    const { requestId, action } = req.body;

    if (!requestId || !action) {
      return res.status(400).json({
        success: false,
        message: 'Request ID and action are required'
      });
    }

    if (!['paid', 'expired', 'declined'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be: paid, expired, or declined'
      });
    }

    const cardRequest = await CardRequest.findByPk(requestId);
    if (!cardRequest) {
      return res.status(404).json({
        success: false,
        message: 'Card request not found'
      });
    }

    // Expiring a card by hand closes it the same way the 5-hour expiry job does
    if (action === 'expired' && cardRequest.virtualCardNumber && cardRequest.status !== 'expired') {
      await closeExpiredCard(cardRequest);
    }
    cardRequest.status = action;
    if (action === 'paid') {
      cardRequest.paidAt = new Date();
      cardRequest.paymentStatus = 'paid'; // Update payment status too
    }

    await cardRequest.save();

    res.json({
      success: true,
      message: `Card request marked as ${action}`,
      data: cardRequest
    });
  } catch (error) {
    console.error('Error updating card status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get admin dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const country = countryFilterFrom(req);
    const allRequests = await CardRequest.findAll({ include: [{ model: Student, as: 'student' }] });
    const scoped = country ? allRequests.filter((r) => requestCountry(r) === country) : allRequests;
    const countStatus = (status) => scoped.filter((r) => r.status === status).length;

    const totalRequests = scoped.length;
    const pendingRequests = countStatus('pending');
    const assignedRequests = countStatus('assigned');
    const paidRequests = countStatus('paid');
    const expiredRequests = countStatus('expired');
    const students = await Student.findAll({ where: { status: { [Op.ne]: 'deleted' } } });
    const totalStudents = country
      ? students.filter((s) => String(s.countryCode || 'GH').toUpperCase() === country).length
      : students.length;

    // Calculate total revenue from paid requests
    const totalRevenue = scoped
      .filter((r) => r.status === 'paid')
      .reduce((sum, request) => sum + (Number(request.amount) || 0), 0);

    // Separate report for each pilot country (issuer, money in, cards out, float)
    const floats = await cardFloatService.getFloatSummary(null, { recent: 0 });
    const byCountry = STUDENT_COUNTRIES
      .filter((code) => !country || code === country)
      .map((code) => buildCountryReport(
        code,
        allRequests.filter((r) => requestCountry(r) === code),
        floats.find((f) => f.country === code)
      ));

    // Students grouped by countryCode
    const studentsByCountryRaw = await Student.findAll({
      where: { status: { [Op.ne]: 'deleted' } },
      attributes: ['countryCode', [fn('COUNT', col('id')), 'count']],
      group: ['countryCode'],
      raw: true
    });
    const studentsByCountry = studentsByCountryRaw.map(row => ({
      countryCode: row.countryCode || 'GH',
      count: Number(row.count),
      ...(WEST_AFRICA_COUNTRIES[row.countryCode] || { name: row.countryCode, flag: '🌍', currency: 'USD' })
    })).sort((a, b) => b.count - a.count);

    // Requests grouped by student countryCode
    const requestsByCountryRaw = await CardRequest.findAll({
      attributes: [[fn('COUNT', col('CardRequest.id')), 'count']],
      include: [{ model: Student, as: 'student', attributes: ['countryCode'], required: true }],
      group: ['student.countryCode'],
      raw: true
    });
    const requestsByCountry = requestsByCountryRaw.map(row => ({
      countryCode: row['student.countryCode'] || 'GH',
      count: Number(row.count),
      ...(WEST_AFRICA_COUNTRIES[row['student.countryCode']] || { name: row['student.countryCode'], flag: '🌍', currency: 'USD' })
    })).sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      data: {
        totalRequests,
        pendingRequests,
        assignedRequests,
        paidRequests,
        expiredRequests,
        totalStudents,
        totalRevenue,
        country: country || 'all',
        needsManualClose: scoped.filter((r) => r.needsManualClose).length,
        byCountry,
        studentsByCountry,
        requestsByCountry
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Mark an expired card from a manual issuer as closed by hand
router.post('/requests/:id/manual-close', async (req, res) => {
  try {
    const cardRequest = await CardRequest.findByPk(req.params.id);
    if (!cardRequest) {
      return res.status(404).json({ success: false, message: 'Card request not found' });
    }
    if (!cardRequest.needsManualClose) {
      return res.status(400).json({ success: false, message: 'This card is not waiting to be closed' });
    }
    cardRequest.needsManualClose = false;
    cardRequest.manualClosedAt = new Date();
    cardRequest.cardStatus = 'terminated';
    await cardRequest.save();
    res.json({ success: true, message: 'Card marked as closed', data: cardRequest });
  } catch (error) {
    console.error('Error marking card closed:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// USD card float per country: balance, low-balance warning and recent ledger entries
router.get('/float', async (req, res) => {
  try {
    const data = await cardFloatService.getFloatSummary(countryFilterFrom(req));
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching card float:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Record USD loaded onto a country's card float
router.post('/float/topup', async (req, res) => {
  try {
    const country = String(req.body.country || '').toUpperCase();
    const amountUsd = Number(req.body.amountUsd);
    const { date, note } = req.body;

    if (!STUDENT_COUNTRIES.includes(country)) {
      return res.status(400).json({ success: false, message: `Country must be one of ${STUDENT_COUNTRIES.join(', ')}` });
    }
    if (!Number.isFinite(amountUsd) || amountUsd <= 0 || amountUsd > 1000000) {
      return res.status(400).json({ success: false, message: 'Amount must be a positive USD amount' });
    }
    if (date && Number.isNaN(new Date(date).getTime())) {
      return res.status(400).json({ success: false, message: 'Date is not valid' });
    }

    const entry = await cardFloatService.recordTopUp({ country, amountUsd, entryDate: date, note });
    const [summary] = await cardFloatService.getFloatSummary(country);
    res.status(201).json({ success: true, message: 'Top-up recorded', data: { entry, float: summary } });
  } catch (error) {
    console.error('Error recording float top-up:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Country leaderboard — top countries by request volume
router.get('/country-requests', async (req, res) => {
  try {
    const rows = await CardRequest.findAll({
      attributes: [[fn('COUNT', col('CardRequest.id')), 'count']],
      include: [{ model: Student, as: 'student', attributes: ['countryCode'], required: true }],
      group: ['student.countryCode'],
      raw: true
    });

    const totalAll = rows.reduce((s, r) => s + Number(r.count), 0);
    const leaderboard = rows.map(row => {
      const code = row['student.countryCode'] || 'GH';
      const count = Number(row.count);
      const info = WEST_AFRICA_COUNTRIES[code] || { name: code, flag: '🌍', currency: 'USD' };
      return { countryCode: code, count, pct: totalAll > 0 ? Math.round((count / totalAll) * 100) : 0, ...info };
    }).sort((a, b) => b.count - a.count);

    res.json({ success: true, data: leaderboard, total: totalAll });
  } catch (error) {
    console.error('Error fetching country leaderboard:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Admin creates a student manually
router.post('/create-student', async (req, res) => {
  try {
    const { name, byuId, email, phone, countryCode, whatsappNumber } = req.body;

    if (!name || !byuId || !email || !phone) {
      return res.status(400).json({ success: false, message: 'Name, BYU ID, email, and phone are required.' });
    }

    const countryInfo = WEST_AFRICA_COUNTRIES[countryCode] || WEST_AFRICA_COUNTRIES['GH'];

    // Check for existing student
    const existing = await Student.findOne({ where: { [Op.or]: [{ byuId }, { email: email.toLowerCase().trim() }] } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'A student with this BYU ID or email already exists.' });
    }

    // Generate a temporary password
    const tempPassword = `BYU${Math.floor(100000 + Math.random() * 900000)}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const student = await Student.create({
      name: name.trim(),
      byuId: byuId.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      countryCode: countryCode || 'GH',
      preferredCurrency: countryInfo.currency,
      whatsappNumber: whatsappNumber?.trim() || null,
      password: hashedPassword,
      isVerified: true,
      status: 'active'
    });

    // Try to send a welcome email (non-blocking)
    try {
      if (typeof sendWelcomeEmail === 'function') {
        await sendWelcomeEmail(student, tempPassword);
      }
    } catch (emailErr) {
      console.warn('Welcome email failed (non-fatal):', emailErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: { ...student.toJSON(), tempPassword }
    });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

// Get all students (with optional status filter)
router.get('/users', async (req, res) => {
  try {
    const { status } = req.query;
    let where;
    if (status === 'all') {
      where = undefined;
    } else if (status) {
      where = { status };
    } else {
      where = { status: { [Op.ne]: 'deleted' } }; // Default: active only
    }

    const students = await Student.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: students
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Soft delete a student
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    student.status = 'deleted';
    student.deletedAt = new Date();
    await student.save();

    res.json({
      success: true,
      message: 'Student soft-deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Restore a deleted student
router.patch('/users/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    student.status = 'active';
    student.deletedAt = null;
    await student.save();

    res.json({
      success: true,
      message: 'Student restored successfully'
    });
  } catch (error) {
    console.error('Error restoring student:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;
