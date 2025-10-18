const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const CardRequest = require('../models/CardRequest');
const { notifyAdminNewRequest } = require('../utils/emailService');
const { initiatePayment, checkPaymentStatus } = require('../utils/hubtelService');
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

// Request virtual card (with payment)
router.post('/request-card', async (req, res) => {
  try {
    const { byuId, amount, amountInGHS, exchangeRate, totalPaidGHS, paymentMethod } = req.body;

    // Validate required fields
    if (!byuId || !amount || !amountInGHS || !exchangeRate || !totalPaidGHS || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: 'All payment details are required'
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

    // Check if student has a pending or assigned request with unpaid/pending payment
    const existingRequest = await CardRequest.findOne({
      student: student._id,
      status: { $in: ['pending', 'assigned'] },
      paymentStatus: { $in: ['unpaid', 'pending'] }
    });

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending payment or active card request',
        data: existingRequest
      });
    }

    // Generate unique request token and payment reference
    const requestToken = crypto.randomBytes(8).toString('hex').toUpperCase();
    const paymentReference = `BYU-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Create card request with payment pending
    const cardRequest = new CardRequest({
      student: student._id,
      amount,
      amountInGHS,
      exchangeRate,
      totalPaidGHS,
      requestToken,
      paymentReference,
      paymentMethod,
      paymentStatus: 'pending',
      status: 'pending'
    });
    await cardRequest.save();

    res.status(201).json({
      success: true,
      message: 'Payment initiated. Please complete payment to submit card request.',
      data: {
        requestToken,
        paymentReference,
        amount,
        amountInGHS,
        totalPaidGHS,
        paymentMethod,
        status: cardRequest.status,
        paymentStatus: cardRequest.paymentStatus,
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

// Verify payment and complete card request
router.post('/verify-payment', async (req, res) => {
  try {
    const { paymentReference, hubtelReference } = req.body;

    if (!paymentReference) {
      return res.status(400).json({
        success: false,
        message: 'Payment reference is required'
      });
    }

    // Find the card request
    const cardRequest = await CardRequest.findOne({ paymentReference }).populate('student');
    if (!cardRequest) {
      return res.status(404).json({
        success: false,
        message: 'Payment reference not found'
      });
    }

    // Update payment status to paid
    cardRequest.paymentStatus = 'paid';
    cardRequest.paymentVerifiedAt = new Date();
    if (hubtelReference) {
      cardRequest.paymentReference = hubtelReference; // Store Hubtel's reference
    }
    await cardRequest.save();

    // Send notification to admin about paid request
    await notifyAdminNewRequest(cardRequest.student, cardRequest);

    res.json({
      success: true,
      message: 'Payment verified successfully! Your card request has been submitted to admin.',
      data: {
        requestToken: cardRequest.requestToken,
        paymentStatus: cardRequest.paymentStatus,
        status: cardRequest.status,
        amount: cardRequest.amount,
        totalPaidGHS: cardRequest.totalPaidGHS
      }
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Mark payment as failed
router.post('/payment-failed', async (req, res) => {
  try {
    const { paymentReference, reason } = req.body;

    const cardRequest = await CardRequest.findOne({ paymentReference });
    if (cardRequest) {
      cardRequest.paymentStatus = 'failed';
      cardRequest.status = 'declined';
      await cardRequest.save();
    }

    res.json({
      success: true,
      message: 'Payment status updated'
    });
  } catch (error) {
    console.error('Error updating payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Initiate Hubtel Payment
router.post('/initiate-hubtel-payment', async (req, res) => {
  try {
    const { phoneNumber, amount, paymentReference, studentName } = req.body;

    console.log('🎯 Initiating Hubtel payment request:', {
      phoneNumber,
      amount,
      paymentReference,
      studentName
    });

    // Initiate Hubtel payment
    const result = await initiatePayment(
      phoneNumber,
      amount,
      paymentReference,
      `BYU Payment - ${studentName || 'Student'}`
    );

    if (result.success) {
      // Update card request with Hubtel checkout ID
      const cardRequest = await CardRequest.findOne({ paymentReference });
      if (cardRequest) {
        cardRequest.hubtelCheckoutId = result.data.checkoutId;
        await cardRequest.save();
      }

      res.json({
        success: true,
        message: 'Payment initiated successfully',
        data: {
          checkoutId: result.data.checkoutId,
          checkoutUrl: result.data.checkoutUrl,
          checkoutDirectUrl: result.data.checkoutDirectUrl,
          status: result.data.status
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to initiate payment',
        error: result.error,
        details: result.details
      });
    }
  } catch (error) {
    console.error('Error initiating Hubtel payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Hubtel Payment Callback (webhook)
router.post('/hubtel-callback', async (req, res) => {
  try {
    console.log('📥 Hubtel callback received:', req.body);

    const { ResponseCode, Data } = req.body;

    // ResponseCode "0000" means success
    if (ResponseCode === '0000' && Data) {
      const { ClientReference } = Data;

      // Find and update card request
      const cardRequest = await CardRequest.findOne({ 
        paymentReference: ClientReference 
      }).populate('student');

      if (cardRequest) {
        cardRequest.paymentStatus = 'paid';
        cardRequest.paymentVerifiedAt = new Date();
        await cardRequest.save();

        console.log('✅ Payment verified for:', ClientReference);

        // Notify admin of paid request
        await notifyAdminNewRequest(cardRequest.student, cardRequest);
      }
    } else {
      // Payment failed
      const { ClientReference } = req.body.Data || {};
      if (ClientReference) {
        const cardRequest = await CardRequest.findOne({ 
          paymentReference: ClientReference 
        });

        if (cardRequest) {
          cardRequest.paymentStatus = 'failed';
          cardRequest.status = 'declined';
          await cardRequest.save();
          console.log('❌ Payment failed for:', ClientReference);
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Hubtel callback error:', error);
    res.status(500).send('Error');
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

