const express = require('express');
const router = express.Router();
const Student = require('../models/Student');
const CardRequest = require('../models/CardRequest');
const { notifyAdminNewRequest, sendVerificationEmail } = require('../utils/emailService');
const { initiatePayment, checkPaymentStatus } = require('../utils/hubtelService');
const mtnMomoService = require('../utils/mtnMomoService');
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

    // Validate BYU Student ID format (7-8 digits)
    if (!/^\d{7,8}$/.test(byuId)) {
      return res.status(400).json({
        success: false,
        message: 'BYU Student ID must be 7-8 digits'
      });
    }

    // Validate Pathway email
    if (!email.toLowerCase().endsWith('@byupathway.edu')) {
      return res.status(400).json({
        success: false,
        message: 'Please use your Pathway email address (@byupathway.edu)'
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
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const student = new Student({
      name,
      byuId,
      email,
      phone,
      verificationToken,
      isVerified: false
    });
    await student.save();

    // Send verification email asynchronously (non-blocking)
    sendVerificationEmail(student, verificationToken).catch(err => {
      console.error('Error sending verification email (non-blocking):', err);
    });

    res.status(201).json({
      success: true,
      message: 'Student registered successfully. Please check your email to verify your account.',
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

// Verify email endpoint
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const student = await Student.findOne({ verificationToken: token });
    if (!student) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    student.isVerified = true;
    student.verificationToken = undefined;
    await student.save();

    res.json({
      success: true,
      message: 'Email verified successfully'
    });
  } catch (error) {
    console.error('Error verifying email:', error);
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

    // Validate required fields (paymentMethod is optional at this stage)
    if (!byuId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'BYU ID and amount are required'
      });
    }

    // Validate BYU Student ID format (7-8 digits)
    if (!/^\d{7,8}$/.test(byuId)) {
      return res.status(400).json({
        success: false,
        message: 'BYU Student ID must be 7-8 digits'
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

    // Check if student is verified
    if (!student.isVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email address before requesting a card. Check your email for the verification link.'
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

// Check Payment Status (Polling Endpoint)
router.get('/check-payment-status/:paymentReference', async (req, res) => {
  try {
    const { paymentReference } = req.params;

    // Find the card request
    const cardRequest = await CardRequest.findOne({ paymentReference }).populate('student');
    if (!cardRequest) {
      return res.status(404).json({
        success: false,
        message: 'Payment reference not found'
      });
    }

    // If already paid, return success immediately
    if (cardRequest.paymentStatus === 'paid') {
      return res.json({
        success: true,
        status: 'paid',
        data: cardRequest
      });
    }

    // If we have a Hubtel Checkout ID, check with Hubtel
    if (cardRequest.hubtelCheckoutId) {
      const hubtelResult = await checkPaymentStatus(cardRequest.hubtelCheckoutId);

      if (hubtelResult.success && hubtelResult.data.status === 'paid') {
        // Update status to paid
        cardRequest.paymentStatus = 'paid';
        cardRequest.paymentVerifiedAt = new Date();
        await cardRequest.save();

        // Notify admin
        await notifyAdminNewRequest(cardRequest.student, cardRequest);

        return res.json({
          success: true,
          status: 'paid',
          data: cardRequest
        });
      }
    }

    // Still pending
    res.json({
      success: true,
      status: cardRequest.paymentStatus,
      message: 'Payment is still pending'
    });

  } catch (error) {
    console.error('Error checking payment status:', error);
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

// Initiate Hubtel Payment (Online Checkout)
router.post('/initiate-hubtel-payment', async (req, res) => {
  try {
    const { phoneNumber, amount, paymentReference, studentName, studentEmail } = req.body;

    console.log('🎯 Initiating Hubtel Online Checkout:', {
      phoneNumber,
      amount,
      paymentReference,
      studentName,
      studentEmail
    });

    // Initiate Hubtel Online Checkout
    const result = await initiatePayment(
      amount,
      paymentReference,
      `BYU Virtual Card Payment - ${studentName || 'Student'}`,
      studentName || 'Student',
      studentEmail || '',
      phoneNumber || ''
    );

    if (result.success) {
      // Update card request with Hubtel checkout ID
      const cardRequest = await CardRequest.findOne({ paymentReference });
      if (cardRequest) {
        cardRequest.hubtelCheckoutId = result.data.checkoutId;
        cardRequest.paymentMethod = 'momo-hubtel';
        await cardRequest.save();
      }

      res.json({
        success: true,
        message: result.data.message || 'Checkout created successfully',
        data: {
          checkoutUrl: result.data.checkoutUrl,
          checkoutId: result.data.checkoutId,
          transactionId: result.data.transactionId,
          status: 'pending'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.error || 'Failed to create checkout',
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

// Hubtel Payment Callback (webhook) - Online Checkout
router.post('/hubtel-callback', async (req, res) => {
  try {
    console.log('📥 Hubtel callback received (POST):', JSON.stringify(req.body, null, 2));

    // Hubtel Online Checkout callback format
    const { ResponseCode, Data, responseCode, data } = req.body;
    
    // Handle both response formats (ResponseCode/Data or responseCode/data)
    const code = ResponseCode || responseCode;
    const callbackData = Data || data;

    // Hubtel Online Checkout callback - handle both response formats
    const { ResponseCode, Data, responseCode, data } = req.body;
    const code = ResponseCode || responseCode;
    const callbackData = Data || data;

    // ResponseCode "0000" or "00" means success
    if ((code === '0000' || code === '00') && callbackData) {
      const clientReference = callbackData.ClientReference || callbackData.clientReference || callbackData.reference;

      if (clientReference) {
        const cardRequest = await CardRequest.findOne({
          paymentReference: clientReference
        }).populate('student');

        if (cardRequest) {
          cardRequest.paymentStatus = 'paid';
          cardRequest.paymentVerifiedAt = new Date();
          await cardRequest.save();

          console.log('✅ Payment verified for:', clientReference);

          // Notify admin of paid request
          if (cardRequest.student) {
            await notifyAdminNewRequest(cardRequest.student, cardRequest);
          }
        } else {
          console.log('⚠️ Card request not found for reference:', clientReference);
        }
      }
    } else {
      // Payment failed or pending
      const clientReference = callbackData?.ClientReference || callbackData?.clientReference || callbackData?.reference;
      
      if (clientReference) {
        const cardRequest = await CardRequest.findOne({
          paymentReference: clientReference
        });

        if (cardRequest) {
          // Only mark as failed if explicitly failed
          if (code === '0001' || code === '01' || (callbackData?.status && callbackData.status.toLowerCase() === 'failed')) {
            cardRequest.paymentStatus = 'failed';
            cardRequest.status = 'declined';
            await cardRequest.save();
            console.log('❌ Payment failed for:', clientReference);
          } else {
            console.log('⏳ Payment still pending for:', clientReference, 'Code:', code);
          }
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('Hubtel callback error:', error);
    res.status(500).send('Error');
  }
});

// Handle GET requests for webhook verification (Hubtel may ping with GET)
router.get('/hubtel-callback', (req, res) => {
  console.log('📥 Hubtel callback received (GET - verification):', req.query);
  res.status(200).send('OK');
});

// Initiate MTN MoMo Payment (Request to Pay)
router.post('/initiate-mtn-payment', async (req, res) => {
  try {
    const { phoneNumber, amount, paymentReference, description } = req.body;

    console.log('🎯 Initiating MTN MoMo Request to Pay:', {
      phoneNumber,
      amount,
      paymentReference
    });

    // Call MTN MoMo API to send payment prompt
    const result = await mtnMomoService.requestToPay(
      phoneNumber,
      amount,
      paymentReference,
      description || 'BYU Virtual Card Payment'
    );

    if (result.success) {
      // Update card request with MTN reference ID
      const cardRequest = await CardRequest.findOne({ paymentReference });
      if (cardRequest) {
        cardRequest.mtnReferenceId = result.data.referenceId;
        await cardRequest.save();
      }

      res.json({
        success: true,
        message: 'Payment prompt sent to customer phone',
        data: {
          referenceId: result.data.referenceId,
          status: result.data.status,
          message: result.data.message
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to initiate MTN MoMo payment',
        error: result.error,
        details: result.details
      });
    }
  } catch (error) {
    console.error('Error initiating MTN MoMo payment:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Check MTN MoMo Payment Status
router.post('/check-mtn-payment', async (req, res) => {
  try {
    const { referenceId, paymentReference } = req.body;

    console.log('🔍 Checking MTN MoMo payment status:', referenceId);

    const result = await mtnMomoService.checkPaymentStatus(referenceId);

    if (result.success) {
      // If payment is successful, update card request
      if (result.data.status === 'SUCCESSFUL') {
        const cardRequest = await CardRequest.findOne({ paymentReference }).populate('student');

        if (cardRequest) {
          cardRequest.paymentStatus = 'paid';
          cardRequest.paymentVerifiedAt = new Date();
          cardRequest.mtnTransactionId = result.data.financialTransactionId;
          await cardRequest.save();

          console.log('✅ MTN Payment verified for:', paymentReference);

          // Notify admin
          await notifyAdminNewRequest(cardRequest.student, cardRequest);
        }
      }

      res.json({
        success: true,
        data: result.data
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Failed to check payment status',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error checking MTN payment status:', error);
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

