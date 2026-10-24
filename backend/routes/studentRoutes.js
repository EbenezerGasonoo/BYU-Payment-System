const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Student, CardRequest } = require('../models');
const {
  notifyAdminNewRequest,
  sendVerificationEmail,
  notifyStudentCardAssigned,
  sendPasswordResetEmail,
  sendPasswordChangeConfirmationEmail
} = require('../utils/emailService');
const { initiatePayment, checkPaymentStatus } = require('../utils/hubtelService');
const mtnMomoService = require('../utils/mtnMomoService');
const paymentGatewayService = require('../utils/paymentGatewayService');
const cardProviderService = require('../utils/cardProviderService');
const africasTalkingService = require('../utils/africasTalkingService');
const crypto = require('crypto');
const {
  hashPassword,
  verifyPassword,
  validatePasswordStrength,
  issueToken,
  requireStudent,
  canAccessStudent,
  isLoginLocked,
  recordFailedLogin,
  clearLoginAttempts
} = require('../utils/studentAuth');

const MAX_CARD_AMOUNT_USD = 5000;

// Shared 404 for card requests that don't exist or belong to another student
const notFoundOrForbidden = (res) =>
  res.status(404).json({ success: false, message: 'Card request not found' });

// Register new student
router.post('/register', async (req, res) => {
  try {
    const { name, byuId, email, phone, password } = req.body;

    // Validate required fields
    if (!name || !byuId || !email || !phone || !password) {
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

    const passwordError = validatePasswordStrength(password);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    // Validate Pathway email
    if (!email.toLowerCase().endsWith('@byupathway.edu')) {
      return res.status(400).json({
        success: false,
        message: 'Please use your Pathway email address (@byupathway.edu)'
      });
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({
      where: { [Op.or]: [{ byuId }, { email: email.toLowerCase() }] }
    });
    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student with this BYU ID or email already exists'
      });
    }

    // Create new student
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const student = await Student.create({
      name,
      byuId,
      email,
      phone,
      password: await hashPassword(password),
      verificationToken,
      isVerified: false
    });

    // Send verification email asynchronously (non-blocking)
    sendVerificationEmail(student, verificationToken).catch(err => {
      console.error('Error sending verification email (non-blocking):', err);
    });

    res.status(201).json({
      success: true,
      message: 'Student registered successfully. Please check your email to verify your account.',
      data: student,
      student,
      token: issueToken(student)
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

// Sign in with BYU ID + password -> session token
router.post('/login', async (req, res) => {
  try {
    const byuId = String(req.body.byuId || '').trim();
    const { password } = req.body;

    if (!byuId || !password) {
      return res.status(400).json({ success: false, message: 'BYU Student ID and password are required' });
    }

    if (isLoginLocked(byuId)) {
      return res.status(429).json({
        success: false,
        message: 'Too many sign-in attempts. Please wait 15 minutes or reset your password.'
      });
    }

    const student = await Student.findOne({ where: { byuId } });
    if (!student || student.status === 'deleted') {
      recordFailedLogin(byuId);
      return res.status(401).json({ success: false, message: 'Incorrect BYU Student ID or password' });
    }

    // Accounts created before passwords existed must set one via the emailed reset code
    if (!student.password) {
      return res.status(403).json({
        success: false,
        code: 'PASSWORD_NOT_SET',
        message: 'Your account does not have a password yet. Use "Forgot Password" to set one. We will email a code to your Pathway address.'
      });
    }

    const { valid, needsRehash } = await verifyPassword(password, student.password);
    if (!valid) {
      recordFailedLogin(byuId);
      return res.status(401).json({ success: false, message: 'Incorrect BYU Student ID or password' });
    }

    clearLoginAttempts(byuId);
    if (needsRehash) {
      student.password = await hashPassword(password);
      await student.save();
    }

    res.json({
      success: true,
      message: 'Signed in successfully',
      token: issueToken(student),
      student
    });
  } catch (error) {
    console.error('Error signing in:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Return the signed-in student (used to validate a stored session)
router.get('/me', requireStudent, (req, res) => {
  if (!req.student) {
    return res.status(400).json({ success: false, message: 'No student session' });
  }
  res.json({ success: true, student: req.student });
});

// Verify email endpoint
router.get('/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const student = await Student.findOne({ where: { verificationToken: token } });
    if (!student) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    student.isVerified = true;
    student.verificationToken = null;
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

// 1. Forgot password - Request reset link & OTP
router.post('/forgot-password', async (req, res) => {
  try {
    const { emailOrByuId } = req.body;

    if (!emailOrByuId || !emailOrByuId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Please provide your Pathway email or BYU Student ID'
      });
    }

    const searchKey = emailOrByuId.trim();

    // Find student by email or BYU ID
    const student = await Student.findOne({
      where: {
        [Op.or]: [
          { email: searchKey.toLowerCase() },
          { byuId: searchKey }
        ],
        status: { [Op.ne]: 'deleted' }
      }
    });

    if (!student) {
      // Return success to avoid account enumeration, but indicate if needed
      return res.status(200).json({
        success: true,
        message: 'If an account exists with that email or BYU ID, a reset code has been sent to your email address.'
      });
    }

    // Generate secure token & 6-digit OTP code
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const resetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    student.resetPasswordToken = resetToken;
    student.resetPasswordCode = resetCode;
    student.resetPasswordExpires = resetExpires;
    await student.save();

    // Send reset email asynchronously
    sendPasswordResetEmail(student, resetToken, resetCode).catch(err => {
      console.error('Error sending reset email (non-blocking):', err);
    });

    res.status(200).json({
      success: true,
      message: `Password reset link and OTP code sent to your registered email (${student.email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + '*'.repeat(gp3.length))}).`,
      email: student.email,
      byuId: student.byuId
    });
  } catch (error) {
    console.error('Error in forgot-password:', error);
    res.status(500).json({
      success: false,
      message: 'Server error processing password reset request',
      error: error.message
    });
  }
});

// 2. Verify reset code/OTP
router.post('/verify-reset-code', async (req, res) => {
  try {
    const { emailOrByuId, resetCode, token } = req.body;

    let whereClause = {
      resetPasswordExpires: { [Op.gt]: new Date() },
      status: { [Op.ne]: 'deleted' }
    };

    if (token) {
      whereClause.resetPasswordToken = token;
    } else if (resetCode) {
      whereClause.resetPasswordCode = String(resetCode).trim();
      if (emailOrByuId) {
        whereClause[Op.or] = [
          { email: emailOrByuId.trim().toLowerCase() },
          { byuId: emailOrByuId.trim() }
        ];
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide either a reset token or 6-digit code'
      });
    }

    const student = await Student.findOne({ where: whereClause });

    if (!student) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset code/link. Please request a new one.'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Reset code verified successfully',
      token: student.resetPasswordToken,
      email: student.email
    });
  } catch (error) {
    console.error('Error verifying reset code:', error);
    res.status(500).json({
      success: false,
      message: 'Server error verifying reset code',
      error: error.message
    });
  }
});

// 3. Reset password with token/code
router.post('/reset-password', async (req, res) => {
  try {
    const { token, resetCode, emailOrByuId, newPassword } = req.body;

    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
      return res.status(400).json({ success: false, message: passwordError });
    }

    let whereClause = {
      resetPasswordExpires: { [Op.gt]: new Date() },
      status: { [Op.ne]: 'deleted' }
    };

    if (token) {
      whereClause.resetPasswordToken = token;
    } else if (resetCode) {
      whereClause.resetPasswordCode = String(resetCode).trim();
      if (emailOrByuId) {
        whereClause[Op.or] = [
          { email: emailOrByuId.trim().toLowerCase() },
          { byuId: emailOrByuId.trim() }
        ];
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Reset token or code is required'
      });
    }

    const student = await Student.findOne({ where: whereClause });

    if (!student) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset link/code. Please request a new one.'
      });
    }

    // Hash and update password, clear reset fields
    student.password = await hashPassword(newPassword);
    student.resetPasswordToken = null;
    student.resetPasswordCode = null;
    student.resetPasswordExpires = null;
    await student.save();

    // Send confirmation email
    sendPasswordChangeConfirmationEmail(student).catch(err => {
      console.error('Error sending password change confirmation:', err);
    });

    res.status(200).json({
      success: true,
      message: 'Your password has been reset successfully! You can now sign in.'
    });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({
      success: false,
      message: 'Server error resetting password',
      error: error.message
    });
  }
});

// Request virtual card (with payment)
router.post('/request-card', requireStudent, async (req, res) => {
  try {
    const { paymentMethod } = req.body;
    // Students can only request for themselves; admins (impersonating) name the student
    const byuId = req.student ? req.student.byuId : String(req.body.byuId || '');
    const amount = Number(req.body.amount);

    // Validate required fields (paymentMethod is optional at this stage)
    if (!byuId || !Number.isFinite(amount) || amount <= 0 || amount > MAX_CARD_AMOUNT_USD) {
      return res.status(400).json({
        success: false,
        message: `Please enter an amount between $1 and $${MAX_CARD_AMOUNT_USD}`
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
    const student = await Student.findOne({ where: { byuId } });
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
      where: {
        studentId: student.id,
        status: { [Op.in]: ['pending', 'assigned'] },
        paymentStatus: { [Op.in]: ['unpaid', 'pending'] }
      }
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

    // Price is computed on the server - never trust client-supplied totals
    const pricing = await paymentGatewayService.calculateLocalAmount(amount, 'GHS');
    const amountInGHS = pricing.subtotalLocal;
    const exchangeRate = pricing.exchangeRate;
    const totalPaidGHS = pricing.totalLocal;

    // Create card request with payment pending
    const cardRequest = await CardRequest.create({
      studentId: student.id,
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

    res.status(201).json({
      success: true,
      message: 'Payment initiated. Please complete payment to submit card request.',
      data: {
        requestToken,
        paymentReference,
        amount,
        amountInGHS,
        exchangeRate,
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

// Ask Hubtel directly whether a card request's checkout was paid.
// Client-supplied or callback-supplied "paid" claims are not trusted on their own.
const isConfirmedByHubtel = async (cardRequest) => {
  if (!cardRequest.hubtelCheckoutId) return false;
  const hubtelResult = await checkPaymentStatus(cardRequest.hubtelCheckoutId);
  return hubtelResult.success && hubtelResult.data.status === 'paid';
};

// Verify payment and complete card request
router.post('/verify-payment', requireStudent, async (req, res) => {
  try {
    const { paymentReference, hubtelReference } = req.body;

    if (!paymentReference) {
      return res.status(400).json({
        success: false,
        message: 'Payment reference is required'
      });
    }

    // Find the card request
    const cardRequest = await CardRequest.findOne({
      where: { paymentReference },
      include: [{ model: Student, as: 'student' }]
    });
    if (!cardRequest || !canAccessStudent(req, cardRequest.studentId)) {
      return notFoundOrForbidden(res);
    }

    // Never trust the client: only mark paid once Hubtel confirms the transaction
    if (cardRequest.paymentStatus !== 'paid') {
      const confirmed = await isConfirmedByHubtel(cardRequest);
      if (!confirmed) {
        return res.status(402).json({
          success: false,
          message: 'Payment has not been confirmed by Hubtel yet. Please wait a moment and try again.'
        });
      }

      cardRequest.paymentStatus = 'paid';
      cardRequest.paymentVerifiedAt = new Date();
      if (hubtelReference) {
        cardRequest.hubtelReference = hubtelReference;
      }
      await cardRequest.save();

      // Send notification to admin about paid request
      await notifyAdminNewRequest(cardRequest.student, cardRequest);
    }

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
router.get('/check-payment-status/:paymentReference', requireStudent, async (req, res) => {
  try {
    const { paymentReference } = req.params;

    // Find the card request
    const cardRequest = await CardRequest.findOne({
      where: { paymentReference },
      include: [{ model: Student, as: 'student' }]
    });
    if (!cardRequest || !canAccessStudent(req, cardRequest.studentId)) {
      return notFoundOrForbidden(res);
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
router.post('/payment-failed', requireStudent, async (req, res) => {
  try {
    const { paymentReference, reason } = req.body;

    const cardRequest = await CardRequest.findOne({ where: { paymentReference } });
    if (cardRequest && canAccessStudent(req, cardRequest.studentId) && cardRequest.paymentStatus !== 'paid') {
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
router.post('/initiate-hubtel-payment', requireStudent, async (req, res) => {
  try {
    const { phoneNumber, paymentReference, studentName, studentEmail } = req.body;

    const cardRequest = await CardRequest.findOne({ where: { paymentReference } });
    if (!cardRequest || !canAccessStudent(req, cardRequest.studentId)) {
      return notFoundOrForbidden(res);
    }
    // Charge the amount stored at request time, not whatever the client sends
    const amount = cardRequest.totalPaidGHS;

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
      cardRequest.hubtelCheckoutId = result.data.checkoutId;
      cardRequest.paymentMethod = 'momo-hubtel';
      await cardRequest.save();

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

    // Hubtel Online Checkout callback - handle both response formats (ResponseCode/Data or responseCode/data)
    const { ResponseCode, Data, responseCode, data } = req.body;
    const code = ResponseCode || responseCode;
    const callbackData = Data || data;

    // ResponseCode "0000" or "00" means success
    if ((code === '0000' || code === '00') && callbackData) {
      const clientReference = callbackData.ClientReference || callbackData.clientReference || callbackData.reference;

      if (clientReference) {
        const cardRequest = await CardRequest.findOne({
          where: { paymentReference: clientReference },
          include: [{ model: Student, as: 'student' }]
        });

        if (cardRequest && cardRequest.paymentStatus === 'paid') {
          console.log('ℹ️ Payment already recorded for:', clientReference);
        } else if (cardRequest) {
          // The callback is unauthenticated, so confirm with Hubtel before trusting it
          if (!(await isConfirmedByHubtel(cardRequest))) {
            console.warn('⚠️ Callback claimed success but Hubtel did not confirm:', clientReference);
            return res.status(200).send('OK');
          }

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
          where: { paymentReference: clientReference }
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
router.post('/initiate-mtn-payment', requireStudent, async (req, res) => {
  try {
    const { phoneNumber, paymentReference, description } = req.body;

    const cardRequest = await CardRequest.findOne({ where: { paymentReference } });
    if (!cardRequest || !canAccessStudent(req, cardRequest.studentId)) {
      return notFoundOrForbidden(res);
    }
    // Charge the amount stored at request time, not whatever the client sends
    const amount = cardRequest.totalPaidGHS;

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
      cardRequest.mtnReferenceId = result.data.referenceId;
      await cardRequest.save();

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
router.post('/check-mtn-payment', requireStudent, async (req, res) => {
  try {
    const { paymentReference } = req.body;

    const cardRequest = await CardRequest.findOne({
      where: { paymentReference },
      include: [{ model: Student, as: 'student' }]
    });
    if (!cardRequest || !canAccessStudent(req, cardRequest.studentId) || !cardRequest.mtnReferenceId) {
      return notFoundOrForbidden(res);
    }

    // Only check the MTN transaction created for this request; a client-supplied
    // referenceId could point at someone else's (or a smaller) successful payment
    const referenceId = cardRequest.mtnReferenceId;
    console.log('🔍 Checking MTN MoMo payment status:', referenceId);

    const result = await mtnMomoService.checkPaymentStatus(referenceId);

    if (result.success) {
      // If payment is successful, update card request
      if (result.data.status === 'SUCCESSFUL') {
        if (cardRequest.paymentStatus !== 'paid') {
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
router.get('/dashboard/:byuId', requireStudent, async (req, res) => {
  try {
    const { byuId } = req.params;

    // Find student
    const student = await Student.findOne({ where: { byuId } });
    if (!student || !canAccessStudent(req, student.id)) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Get all card requests for this student
    const cardRequests = await CardRequest.findAll({
      where: { studentId: student.id },
      order: [['createdAt', 'DESC']]
    });

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
router.get('/request/:requestToken', requireStudent, async (req, res) => {
  try {
    const { requestToken } = req.params;

    const cardRequest = await CardRequest.findOne({
      where: { requestToken },
      include: [{ model: Student, as: 'student' }]
    });
    if (!cardRequest || !canAccessStudent(req, cardRequest.studentId)) {
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

// GET /api/students/rates - West Africa exchange rates & country configs
router.get('/rates', async (req, res) => {
  try {
    const rates = await paymentGatewayService.getExchangeRates();
    res.json({
      success: true,
      rates,
      countries: paymentGatewayService.COUNTRY_CONFIGS
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/students/cards/:id/freeze - Toggle virtual card freeze status
router.post('/cards/:id/freeze', requireStudent, async (req, res) => {
  try {
    const { id } = req.params;
    const cardRequest = await CardRequest.findByPk(id, { include: [{ model: Student, as: 'student' }] });
    
    if (!cardRequest || !cardRequest.virtualCardNumber || !canAccessStudent(req, cardRequest.studentId)) {
      return res.status(404).json({ success: false, message: 'Active card not found' });
    }

    const currentStatus = cardRequest.cardStatus || 'active';
    const newStatus = currentStatus === 'frozen' ? 'active' : 'frozen';
    
    cardRequest.cardStatus = newStatus;
    await cardRequest.save();

    res.json({
      success: true,
      message: `Virtual card is now ${newStatus}`,
      cardStatus: newStatus
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/students/paystack/initialize - Initialize Paystack Payment
router.post('/paystack/initialize', requireStudent, async (req, res) => {
  try {
    const { requestToken, currency = 'GHS', callbackUrl } = req.body;
    const cardRequest = await CardRequest.findOne({
      where: { requestToken },
      include: [{ model: Student, as: 'student' }]
    });

    if (!cardRequest || !canAccessStudent(req, cardRequest.studentId)) {
      return notFoundOrForbidden(res);
    }

    const calc = await paymentGatewayService.calculateLocalAmount(cardRequest.amount, currency);
    cardRequest.currency = currency;
    cardRequest.amountLocal = calc.totalLocal;
    cardRequest.exchangeRate = calc.exchangeRate;
    cardRequest.paymentGateway = 'paystack';
    await cardRequest.save();

    const paystackResult = await paymentGatewayService.initializePaystackPayment({
      email: cardRequest.student.email,
      amountLocal: calc.totalLocal,
      currency,
      reference: cardRequest.requestToken,
      callbackUrl
    });

    if (!paystackResult.success) {
      return res.status(400).json(paystackResult);
    }

    res.json({
      success: true,
      authorizationUrl: paystackResult.authorizationUrl,
      reference: cardRequest.requestToken,
      simulated: paystackResult.simulated,
      calculation: calc
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/students/paystack/verify/:reference - Verify Paystack Payment & Auto-Issue Virtual Card
router.get('/paystack/verify/:reference', requireStudent, async (req, res) => {
  try {
    const { reference } = req.params;
    const cardRequest = await CardRequest.findOne({
      where: { requestToken: reference },
      include: [{ model: Student, as: 'student' }]
    });

    if (!cardRequest || !canAccessStudent(req, cardRequest.studentId)) {
      return notFoundOrForbidden(res);
    }

    const verifyResult = await paymentGatewayService.verifyPaystackPayment(reference);

    if (verifyResult.verified) {
      const now = new Date();
      cardRequest.paymentStatus = 'paid';
      cardRequest.paidAt = now;
      cardRequest.paymentVerifiedAt = now;

      let cardIssued = Boolean(cardRequest.virtualCardNumber);
      if (cardIssued) {
        cardRequest.status = 'paid';
      }

      // Auto-issue virtual card if not already assigned
      if (!cardIssued) {
        const issuedCard = await cardProviderService.issueVirtualCard({
          studentName: cardRequest.student.name,
          amountUsd: cardRequest.amount,
          cardRequestId: cardRequest.id
        });

        if (issuedCard.success) {
          cardRequest.virtualCardNumber = issuedCard.cardNumber;
          cardRequest.cardholderName = issuedCard.cardholderName;
          cardRequest.cardExpiryDate = issuedCard.cardExpiryDate;
          cardRequest.cardCVV = issuedCard.cvv;
          cardRequest.status = 'assigned';
          cardRequest.cardStatus = 'active';
          cardRequest.assignedAt = now;
          cardIssued = true;

          // Dispatch transactional notifications
          sendCardAssignedEmail(cardRequest.student, cardRequest).catch(() => {});
          africasTalkingService.sendSmsNotification({
            toPhone: cardRequest.student.phone,
            message: `BYU Pathway: Your USD Virtual Card (${issuedCard.cardNumber.slice(-4)}) is active!`
          }).catch(() => {});
        }
      }

      await cardRequest.save();

      if (!cardIssued) {
        // No provider issued a card: keep the request pending so an admin assigns a real one
        notifyAdminNewRequest(cardRequest.student, cardRequest).catch(() => {});
        return res.json({
          success: true,
          message: 'Payment verified. Your card will be assigned shortly.',
          data: cardRequest
        });
      }

      return res.json({
        success: true,
        message: 'Payment verified and Virtual Card issued successfully!',
        data: cardRequest
      });
    }

    res.status(400).json({ success: false, message: 'Payment verification failed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

