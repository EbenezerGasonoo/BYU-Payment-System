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
const cardIssuers = require('../utils/cardIssuers');
const cardFloatService = require('../utils/cardFloatService');
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
// Issued cards stay usable for 5 hours, the same window as manually assigned ones
const CARD_LIFETIME_MS = 5 * 60 * 60 * 1000;

// Shared 404 for card requests that don't exist or belong to another student
const notFoundOrForbidden = (res) =>
  res.status(404).json({ success: false, message: 'Card request not found' });

// Requests made before multi-currency support have no currency and were priced in cedis
const isCediRequest = (cardRequest) => (cardRequest.currency || 'GHS') === 'GHS';

// Register new student
router.post('/register', async (req, res) => {
  try {
    const { name, byuId, email, phone, password } = req.body;
    const countryCode = String(req.body.countryCode || 'GH').toUpperCase();

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

    if (!paymentGatewayService.STUDENT_COUNTRIES.includes(countryCode)) {
      return res.status(400).json({
        success: false,
        message: 'ConnectPay is available to students in Ghana and Nigeria for now'
      });
    }
    const country = paymentGatewayService.getStudentCountry(countryCode);

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
      countryCode: country.code,
      preferredCurrency: country.currency,
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

// Change the signed-in student's country (Ghana or Nigeria); admins name the student by byuId.
// Blocked while a request is waiting for payment, since that request is already priced.
router.patch('/me/country', requireStudent, async (req, res) => {
  try {
    const countryCode = String(req.body.countryCode || '').toUpperCase();
    if (!paymentGatewayService.STUDENT_COUNTRIES.includes(countryCode)) {
      return res.status(400).json({
        success: false,
        message: 'ConnectPay is available to students in Ghana and Nigeria for now'
      });
    }

    const student = req.student || await Student.findOne({ where: { byuId: String(req.body.byuId || '') } });
    if (!student || !canAccessStudent(req, student.id)) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const openRequest = await CardRequest.findOne({
      where: {
        studentId: student.id,
        status: { [Op.in]: ['pending', 'assigned'] },
        paymentStatus: { [Op.in]: ['unpaid', 'pending'] }
      }
    });
    if (openRequest) {
      return res.status(409).json({
        success: false,
        message: 'Finish or cancel your unpaid card request before changing country.'
      });
    }

    const country = paymentGatewayService.getStudentCountry(countryCode);
    student.countryCode = country.code;
    student.preferredCurrency = country.currency;
    await student.save();

    res.json({ success: true, message: `Country updated to ${country.name}`, student });
  } catch (error) {
    console.error('Error updating country:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
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

    // Price is computed on the server in the student's currency - never trust client-supplied totals
    const country = paymentGatewayService.getStudentCountry(student.countryCode);
    const pricing = await paymentGatewayService.calculateLocalAmount(amount, country.currency);
    const { currency, exchangeRate, subtotalLocal, totalLocal } = pricing;
    // The *GHS columns predate other currencies; they are only filled for cedi requests
    const amountInGHS = currency === 'GHS' ? subtotalLocal : null;
    const totalPaidGHS = currency === 'GHS' ? totalLocal : null;

    // Create card request with payment pending
    const cardRequest = await CardRequest.create({
      studentId: student.id,
      amount,
      amountInGHS,
      exchangeRate,
      totalPaidGHS,
      country: country.code,
      currency,
      amountLocal: totalLocal,
      paymentGateway: country.defaultGateway,
      // The issuer this country is set up to use; replaced by whoever actually provides the card
      issuer: cardIssuers.resolveCountryIssuer(country.code).issuer,
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
        country: country.code,
        currency,
        subtotalLocal,
        amountLocal: totalLocal,
        paymentGateway: country.defaultGateway,
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
    if (!isCediRequest(cardRequest)) {
      return res.status(400).json({ success: false, message: 'Mobile Money through Hubtel is only for payments in Ghana cedis' });
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
    if (!isCediRequest(cardRequest)) {
      return res.status(400).json({ success: false, message: 'MTN MoMo is only for payments in Ghana cedis' });
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
    if (currentStatus === 'terminated') {
      return res.status(400).json({ success: false, message: 'This card has been closed' });
    }
    const newStatus = currentStatus === 'frozen' ? 'active' : 'frozen';

    // Cards from an API issuer are frozen at the provider first; manual cards are database-only
    if (cardIssuers.isApiIssuer(cardRequest.issuer)) {
      const result = await cardIssuers.setCardFrozen(cardRequest, newStatus === 'frozen');
      if (!result.success && !result.manual) {
        return res.status(502).json({ success: false, message: 'Could not reach the card provider. Please try again.' });
      }
    }

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

// POST /api/students/paystack/initialize - Start a Paystack checkout for a priced card request
router.post('/paystack/initialize', requireStudent, async (req, res) => {
  try {
    const { requestToken } = req.body;
    const cardRequest = await CardRequest.findOne({
      where: { requestToken },
      include: [{ model: Student, as: 'student' }]
    });

    if (!cardRequest || !canAccessStudent(req, cardRequest.studentId)) {
      return notFoundOrForbidden(res);
    }
    if (cardRequest.paymentStatus === 'paid') {
      return res.status(400).json({ success: false, message: 'This request is already paid' });
    }
    if (cardRequest.status !== 'pending' || cardRequest.paymentStatus === 'failed') {
      return res.status(400).json({ success: false, message: 'This request was cancelled. Please start a new one.' });
    }

    // Charge the currency and amount fixed when the request was priced, not a fresh quote
    const currency = cardRequest.currency || 'GHS';
    const amountLocal = cardRequest.amountLocal ?? cardRequest.totalPaidGHS;
    if (!amountLocal) {
      return res.status(400).json({ success: false, message: 'This request has no price. Please start a new one.' });
    }

    // Paystack rejects a reused reference, so each checkout attempt gets its own
    const gatewayReference = `${cardRequest.requestToken}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const frontendUrl = process.env.FRONTEND_URL || req.get('origin') || 'https://byupay.vercel.app';
    const callbackUrl = `${frontendUrl.replace(/\/$/, '')}/request?gateway=paystack`;

    const paystackResult = await paymentGatewayService.initializePaystackPayment({
      email: cardRequest.student.email,
      amountLocal,
      currency,
      reference: gatewayReference,
      callbackUrl
    });

    if (!paystackResult.success) {
      return res.status(400).json({
        success: false,
        message: paystackResult.message || paystackResult.error || 'Could not start the Paystack checkout'
      });
    }

    cardRequest.paymentGateway = 'paystack';
    cardRequest.paymentMethod = 'paystack';
    cardRequest.gatewayReference = gatewayReference;
    await cardRequest.save();

    res.json({
      success: true,
      authorizationUrl: paystackResult.authorizationUrl,
      reference: gatewayReference,
      simulated: paystackResult.simulated,
      currency,
      amountLocal
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// References currently being settled, so the redirect and the webhook can't settle one twice at once
const settlingReferences = new Set();

/**
 * Confirm a Paystack reference with Paystack and settle the card request it belongs to.
 * Shared by the student's redirect (verify route) and Paystack's webhook.
 * Returns { ok, status, message }.
 */
async function settlePaystackPayment(cardRequest, reference) {
  if (cardRequest.paymentStatus === 'paid') {
    return { ok: true, status: 200, message: 'Payment already verified.' };
  }

  // Only the reference this request's own checkout created may settle it
  if (cardRequest.gatewayReference !== reference) {
    return { ok: false, status: 400, message: 'Payment verification failed' };
  }

  if (settlingReferences.has(reference)) {
    return { ok: false, status: 409, message: 'Your payment is being confirmed. Please check again in a moment.' };
  }
  settlingReferences.add(reference);

  try {
    const verifyResult = await paymentGatewayService.verifyPaystackPayment(reference);
    if (!verifyResult.verified) {
      return { ok: false, status: 400, message: 'Payment verification failed' };
    }

    // A real Paystack payment must cover the amount and currency fixed for this request
    if (!verifyResult.simulated) {
      const expected = Number(cardRequest.amountLocal ?? cardRequest.totalPaidGHS);
      const currency = cardRequest.currency || 'GHS';
      if (verifyResult.currency !== currency || !(verifyResult.amountPaid >= expected - 0.01)) {
        console.warn('⚠️ Paystack amount mismatch:', { reference, expected, currency, paid: verifyResult.amountPaid, paidCurrency: verifyResult.currency });
        return {
          ok: false,
          status: 400,
          message: 'The amount paid does not match this request. Please contact support with your reference.'
        };
      }
    }

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
        cardRequestId: cardRequest.id,
        country: cardRequest.country || cardRequest.student.countryCode
      });
      cardRequest.country = issuedCard.country;
      cardRequest.issuer = issuedCard.issuer;

      if (issuedCard.success) {
        cardRequest.virtualCardNumber = issuedCard.cardNumber;
        cardRequest.cardholderName = issuedCard.cardholderName;
        cardRequest.cardExpiryDate = issuedCard.expiryDate;
        cardRequest.cardCVV = issuedCard.cvv;
        cardRequest.providerCardId = issuedCard.cardId ? String(issuedCard.cardId) : null;
        cardRequest.status = 'assigned';
        cardRequest.cardStatus = 'active';
        cardRequest.assignedAt = now;
        cardRequest.expiresAt = new Date(now.getTime() + CARD_LIFETIME_MS);
        cardIssued = true;

        // Dispatch transactional notifications
        notifyStudentCardAssigned(cardRequest.student, cardRequest).catch(() => {});
        africasTalkingService.sendSmsNotification({
          toPhone: cardRequest.student.phone,
          message: `BYU Pathway: Your USD Virtual Card (${issuedCard.cardNumber.slice(-4)}) is active!`
        }).catch(() => {});
      }
    }

    await cardRequest.save();
    if (cardIssued && cardRequest.status === 'assigned') {
      await cardFloatService.safeDebitForCard(cardRequest);
    }

    if (!cardIssued) {
      // No provider issued a card: keep the request pending so an admin assigns a real one
      notifyAdminNewRequest(cardRequest.student, cardRequest).catch(() => {});
      return { ok: true, status: 200, message: 'Payment verified. Your card will be assigned shortly.' };
    }
    return { ok: true, status: 200, message: 'Payment verified and Virtual Card issued successfully!' };
  } finally {
    settlingReferences.delete(reference);
  }
}

// GET /api/students/paystack/verify/:reference - Verify a Paystack payment and mark the request paid
router.get('/paystack/verify/:reference', requireStudent, async (req, res) => {
  try {
    const { reference } = req.params;
    const cardRequest = await CardRequest.findOne({
      where: { [Op.or]: [{ gatewayReference: reference }, { requestToken: reference }] },
      include: [{ model: Student, as: 'student' }]
    });

    if (!cardRequest || !canAccessStudent(req, cardRequest.studentId)) {
      return notFoundOrForbidden(res);
    }

    const result = await settlePaystackPayment(cardRequest, reference);
    if (!result.ok) {
      return res.status(result.status).json({ success: false, message: result.message });
    }
    res.json({ success: true, message: result.message, data: cardRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Paystack signs each webhook with HMAC-SHA512 of the raw body using the secret key
const isValidPaystackSignature = (req) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const signature = req.get('x-paystack-signature');
  if (!secret || secret.includes('YOUR_') || !signature || !req.rawBody) return false;
  const expected = crypto.createHmac('sha512', secret).update(req.rawBody).digest('hex');
  const given = Buffer.from(String(signature));
  const wanted = Buffer.from(expected);
  return given.length === wanted.length && crypto.timingSafeEqual(given, wanted);
};

// POST /api/student/paystack/webhook - Paystack server-to-server notice, so a payment settles
// even when the student closes the tab before being redirected back
router.post('/paystack/webhook', async (req, res) => {
  if (!isValidPaystackSignature(req)) {
    return res.status(401).send('Invalid signature');
  }

  try {
    const { event, data } = req.body || {};
    if (event !== 'charge.success' || !data?.reference) {
      return res.status(200).send('OK');
    }

    const cardRequest = await CardRequest.findOne({
      where: { gatewayReference: data.reference },
      include: [{ model: Student, as: 'student' }]
    });
    if (!cardRequest) {
      console.warn('⚠️ Paystack webhook for unknown reference:', data.reference);
      return res.status(200).send('OK');
    }

    // The event is signed, but settle through Paystack's verify API like every other path
    const result = await settlePaystackPayment(cardRequest, data.reference);
    console.log(`📥 Paystack webhook ${data.reference}: ${result.message}`);
    // 409 means the redirect is settling it right now; anything else is final for this event
    res.status(result.status === 409 ? 503 : 200).send('OK');
  } catch (error) {
    console.error('Paystack webhook error:', error);
    // A 5xx makes Paystack retry later
    res.status(500).send('Error');
  }
});

module.exports = router;

