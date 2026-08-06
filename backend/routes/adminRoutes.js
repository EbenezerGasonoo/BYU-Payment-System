const express = require('express');
const router = express.Router();
const { Op, fn, col, literal } = require('sequelize');
const bcrypt = require('bcryptjs');
const { Student, CardRequest } = require('../models');
const { notifyStudentCardAssigned, sendWelcomeEmail } = require('../utils/emailService');

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

// Get all card requests with filters
router.get('/requests', async (req, res) => {
  try {
    const { status } = req.query;

    const where = status ? { status } : undefined;
    const requests = await CardRequest.findAll({
      where,
      include: [{ model: Student, as: 'student' }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: requests
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
    cardRequest.status = 'assigned';
    cardRequest.assignedAt = new Date();
    cardRequest.expiresAt = new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 hours from now

    await cardRequest.save();

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

// Auto-generate and assign mock card
router.post('/assign/mock', async (req, res) => {
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
    const totalRequests = await CardRequest.count();
    const pendingRequests = await CardRequest.count({ where: { status: 'pending' } });
    const assignedRequests = await CardRequest.count({ where: { status: 'assigned' } });
    const paidRequests = await CardRequest.count({ where: { status: 'paid' } });
    const expiredRequests = await CardRequest.count({ where: { status: 'expired' } });
    const totalStudents = await Student.count({ where: { status: { [Op.ne]: 'deleted' } } });

    // Calculate total revenue from paid requests
    const paidRequestsData = await CardRequest.findAll({ where: { status: 'paid' } });
    const totalRevenue = paidRequestsData.reduce((sum, request) => sum + (Number(request.amount) || 0), 0);

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
