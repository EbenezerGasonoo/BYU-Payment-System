const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const CardRequest = require('../models/CardRequest');
const { notifyAdminNewRequest } = require('../utils/emailService');
const crypto = require('crypto');

// Register new student
router.post('/register', async (req, res) => {
  try {
    const { name, byuId, email, phone } = req.body;

    // Validate required fields
    if (!name || !byuId || !email || !phone) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Validate BYU Student ID format (9 digits)
    if (!/^\d{9}$/.test(byuId)) {
      return res.status(400).json({
        success: false,
        message: 'BYU Student ID must be exactly 9 digits'
      });
    }

    // Validate BYU Pathway email
    if (!email.toLowerCase().endsWith('@byupathway.edu')) {
      return res.status(400).json({
        success: false,
        message: 'Please use your BYU Pathway email address (@byupathway.edu)'
      });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ $or: [{ byuId }, { email }] });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student with this BYU ID or email already exists'
      });
    }

    // Create new student
    const student = new Student({ name, byuId, email, phone });
    await student.save();

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: student
    });
  } catch (error) {
    console.error('Error registering student:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Request virtual card
router.post('/request-card', async (req, res) => {
  try {
    const { byuId, amount } = req.body;

    // Validate required fields
    if (!byuId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'BYU Student ID and amount are required'
      });
    }

    // Validate BYU Student ID format (9 digits)
    if (!/^\d{9}$/.test(byuId)) {
      return res.status(400).json({
        success: false,
        message: 'BYU Student ID must be exactly 9 digits'
      });
    }

    // Find student
    const student = await Student.findOne({ byuId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found. Please register first.'
      });
    }

    // Check if student has a pending or assigned request
    const existingRequest = await CardRequest.findOne({
      student: student._id,
      status: { $in: ['pending', 'assigned'] }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending or active card request',
        data: existingRequest
      });
    }

    // Generate unique request token
    const requestToken = crypto.randomBytes(8).toString('hex').toUpperCase();

    // Create card request
    const cardRequest = new CardRequest({
      student: student._id,
      amount,
      requestToken
    });
    await cardRequest.save();

    // Send notification to admin
    await notifyAdminNewRequest(student, cardRequest);

    res.status(201).json({
      success: true,
      message: 'Card request submitted successfully. Admin will be notified.',
      data: {
        requestToken,
        amount,
        status: cardRequest.status,
        createdAt: cardRequest.createdAt
      }
    });
  } catch (error) {
    console.error('Error requesting card:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get student dashboard info
router.get('/dashboard/:byuId', async (req, res) => {
  try {
    const { byuId } = req.params;

    // Find student
    const student = await Student.findOne({ byuId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get all card requests for this student
    const cardRequests = await CardRequest.find({ student: student._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        student,
        cardRequests
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get specific card request details
router.get('/request/:requestToken', async (req, res) => {
  try {
    const { requestToken } = req.params;

    const cardRequest = await CardRequest.findOne({ requestToken }).populate('student');
    if (!cardRequest) {
      return res.status(404).json({
        success: false,
        message: 'Card request not found'
      });
    }

    res.json({
      success: true,
      data: cardRequest
    });
  } catch (error) {
    console.error('Error fetching request:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;

