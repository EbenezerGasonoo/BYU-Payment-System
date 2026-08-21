const nodemailer = require('nodemailer');

// Check if email is configured
const isEmailConfigured = () => {
  return !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD);
};

// Create reusable transporter
let transporter = null;

if (isEmailConfigured()) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'mail.entechnologygh.com',
    port: parseInt(process.env.EMAIL_PORT || '465', 10),
    secure: (process.env.EMAIL_PORT || '465') === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  // Verify transporter connection on startup
  transporter.verify((error, success) => {
    if (error) {
      console.error('❌ Email transporter verification failed:', error.message);
    } else {
      console.log('✅ Email transporter is ready');
    }
  });
} else {
  console.warn('⚠️  Email not configured: EMAIL_USER and/or EMAIL_PASSWORD not set. Emails will not be sent.');
}

// Send email to admin when student requests card
const notifyAdminNewRequest = async (student, cardRequest) => {
  if (!isEmailConfigured()) {
    console.warn('⚠️  Email not configured. Skipping admin notification.');
    return;
  }

  if (!process.env.ADMIN_EMAIL) {
    console.warn('⚠️  ADMIN_EMAIL not set. Skipping admin notification.');
    return;
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: '🔔 New Virtual Card Request - Pathway',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #002E5D;">New Virtual Card Request</h2>
          <p>A student has requested a virtual card for payment.</p>
          
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Student Name:</strong> ${student.name}</p>
            <p><strong>BYU ID:</strong> ${student.byuId}</p>
            <p><strong>Email:</strong> ${student.email}</p>
            <p><strong>Phone:</strong> ${student.phone}</p>
            <p><strong>Amount:</strong> GHS ${cardRequest.amount}</p>
            <p><strong>Request Token:</strong> ${cardRequest.requestToken}</p>
            <p><strong>Request Date:</strong> ${new Date(cardRequest.createdAt).toLocaleString()}</p>
          </div>
          
          <p>Please log in to the admin dashboard to assign a virtual card.</p>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Pathway Virtual Card System<br>
            This is an automated notification.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Admin notification sent to', process.env.ADMIN_EMAIL, 'Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Error sending admin notification:', error.message);
    console.error('Full error:', error);
  }
};

// Send email to student when card is assigned
const notifyStudentCardAssigned = async (student, cardRequest) => {
  if (!isEmailConfigured()) {
    console.warn('⚠️  Email not configured. Skipping card assignment notification.');
    return;
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: student.email,
      subject: '✅ Virtual Card Assigned - Pathway',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #002E5D;">Your Virtual Card is Ready!</h2>
          <p>Hello ${student.name},</p>
          <p>Your virtual card has been assigned and is ready for use.</p>
          
          <div style="background-color: #e8f4f8; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #002E5D;">Card Details</h3>
            <p><strong>Card Number:</strong> ${cardRequest.virtualCardNumber}</p>
            <p><strong>Expiry Date:</strong> ${cardRequest.cardExpiryDate}</p>
            <p><strong>CVV:</strong> ${cardRequest.cardCVV}</p>
            <p><strong>Amount:</strong> GHS ${cardRequest.amount}</p>
            <p style="color: #d9534f; margin-top: 15px;">
              <strong>⚠️ Important:</strong> This card expires in 4-6 hours at ${new Date(cardRequest.expiresAt).toLocaleString()}
            </p>
          </div>
          
          <p><strong>Next Steps:</strong></p>
          <ol>
            <li>Use these card details to pay your school fees immediately</li>
            <li>Complete the payment before the expiry time</li>
            <li>Keep these details secure and do not share with anyone</li>
          </ol>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Pathway Virtual Card System<br>
            This is an automated notification.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Student notification sent (card assigned) to', student.email, 'Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Error sending student notification:', error.message);
    console.error('Full error:', error);
  }
};

// Send email to student when card expires
const notifyStudentCardExpired = async (student, cardRequest) => {
  if (!isEmailConfigured()) {
    console.warn('⚠️  Email not configured. Skipping card expiry notification.');
    return;
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: student.email,
      subject: '⏰ Virtual Card Expired - Pathway',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #d9534f;">Virtual Card Expired</h2>
          <p>Hello ${student.name},</p>
          <p>Your virtual card (Request Token: ${cardRequest.requestToken}) has expired.</p>
          
          <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p><strong>Card Number:</strong> ${cardRequest.virtualCardNumber}</p>
            <p><strong>Amount:</strong> GHS ${cardRequest.amount}</p>
            <p><strong>Expired At:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <p>If you still need to make a payment, please submit a new card request through the student portal.</p>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Pathway Virtual Card System<br>
            This is an automated notification.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Student notification sent (card expired) to', student.email, 'Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Error sending expiry notification:', error.message);
    console.error('Full error:', error);
  }
};

// Send verification email to student
const sendVerificationEmail = async (student, token) => {
  if (!isEmailConfigured()) {
    console.warn('⚠️  Email not configured. Skipping verification email.');
    console.warn('⚠️  Student registered but cannot receive verification email. Email:', student.email);
    return;
  }

  try {
    const verificationLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verify-email?token=${token}`;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: student.email,
      subject: '📧 Verify Your Email - Pathway',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #002E5D;">Verify Your Email Address</h2>
          <p>Hello ${student.name},</p>
          <p>Thank you for registering with the Pathway Virtual Card System. Please verify your email address to activate your account and request cards.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationLink}" style="background-color: #002E5D; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
          </div>
          
          <p>If the button above doesn't work, copy and paste this link into your browser:</p>
          <p style="background-color: #f5f5f5; padding: 10px; word-break: break-all; font-size: 12px;">${verificationLink}</p>
          
          <p style="color: #666; font-size: 12px; margin-top: 30px;">
            Pathway Virtual Card System<br>
            This is an automated notification.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent to', student.email, 'Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Error sending verification email:', error.message);
    console.error('Full error:', error);
    if (error.response) {
      console.error('SMTP Response:', error.response);
    }
  }
};

// Send password reset email with OTP and direct reset link
const sendPasswordResetEmail = async (student, resetToken, resetCode) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(student.email)}`;

  if (!isEmailConfigured()) {
    console.warn('⚠️  Email not configured. Simulation Mode: Password Reset link generated:');
    console.warn(`🔗  Reset Link: ${resetLink}`);
    console.warn(`🔑  OTP Code: ${resetCode}`);
    return;
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: student.email,
      subject: '🔑 Password Reset Request - ConnectPay',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <div style="background: linear-gradient(135deg, #002E5D 0%, #004B87 100%); color: #ffffff; padding: 24px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px; font-weight: 700;">ConnectPay</h1>
            <p style="margin: 6px 0 0 0; opacity: 0.9; font-size: 14px;">Password Reset Request</p>
          </div>
          
          <div style="padding: 28px; color: #2d3748; line-height: 1.6;">
            <p>Hello <strong>${student.name}</strong>,</p>
            <p>We received a request to reset the password for your ConnectPay account associated with <strong>${student.email}</strong>.</p>
            
            <div style="background-color: #f7fafc; border: 2px dashed #cbd5e0; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0;">
              <p style="margin: 0 0 8px 0; font-size: 13px; text-transform: uppercase; letter-spacing: 1px; color: #718096; font-weight: 600;">Your 6-Digit Reset Code (OTP)</p>
              <div style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #002E5D; margin: 8px 0;">${resetCode}</div>
              <p style="margin: 8px 0 0 0; font-size: 12px; color: #a0aec0;">Valid for 15 minutes</p>
            </div>
            
            <div style="text-align: center; margin: 28px 0;">
              <a href="${resetLink}" style="background-color: #002E5D; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(0, 46, 93, 0.25);">Reset Password Online →</a>
            </div>

            <p style="font-size: 13px; color: #4a5568;">If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="background-color: #edf2f7; padding: 10px; border-radius: 6px; word-break: break-all; font-size: 11px; font-family: monospace; color: #4a5568;">${resetLink}</p>

            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 12px; color: #718096; margin: 0;">If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          </div>
          
          <div style="background-color: #f7fafc; padding: 16px; text-align: center; border-top: 1px solid #edf2f7; font-size: 12px; color: #a0aec0;">
            ConnectPay • West Africa Virtual Card Platform
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Password reset email sent to', student.email, 'Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Error sending password reset email:', error.message);
  }
};

// Send confirmation email after password reset success
const sendPasswordChangeConfirmationEmail = async (student) => {
  if (!isEmailConfigured()) {
    console.warn(`⚠️  Email not configured. Simulation: Password change confirmation for ${student.email}`);
    return;
  }

  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: student.email,
      subject: '🔒 Security Alert: Your ConnectPay Password Was Reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background-color: #2b6cb0; color: #ffffff; padding: 20px; text-align: center;">
            <h2 style="margin: 0;">ConnectPay Security Notice</h2>
          </div>
          <div style="padding: 24px; color: #2d3748; line-height: 1.6;">
            <p>Hello <strong>${student.name}</strong>,</p>
            <p>This email confirms that the password for your ConnectPay account (<strong>${student.email}</strong>) was successfully updated.</p>
            <p style="background-color: #fffaf0; border-left: 4px solid #dd6b20; padding: 12px; font-size: 13px; color: #744210;">
              If you did not perform this action, please contact support immediately.
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Password change confirmation sent to', student.email);
  } catch (error) {
    console.error('❌ Error sending password change confirmation email:', error.message);
  }
};


// Send welcome email to admin-created student with temp password
const sendWelcomeEmail = async (student, tempPassword) => {
  if (!transporter) {
    console.log('📧 [DEV] Welcome email (no SMTP):', student.email, '| Temp password:', tempPassword);
    return;
  }

  try {
    const mailOptions = {
      from: `"ConnectPay BYU" <${process.env.EMAIL_USER}>`,
      to: student.email,
      subject: '🎉 Welcome to ConnectPay — Your Account is Ready',
      html: `
        <div style="font-family: 'Segoe UI', sans-serif; background:#0b0c16; color:#e2e8f0; padding:40px; border-radius:16px; max-width:520px; margin:auto;">
          <div style="text-align:center; margin-bottom:28px;">
            <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6); border-radius:50%; width:56px; height:56px; display:inline-flex; align-items:center; justify-content:center; font-size:28px;">⚡</div>
            <h1 style="color:#c4b5fd; margin:12px 0 4px;">Welcome to ConnectPay</h1>
            <p style="color:#94a3b8; margin:0;">BYU Pathway Virtual Card System</p>
          </div>
          <p>Hi <strong style="color:#fff;">${student.name}</strong>,</p>
          <p>Your ConnectPay student account has been created by the admin team. Here are your login credentials:</p>
          <div style="background:#1a1b2e; border:1px solid #2d2f50; border-radius:12px; padding:20px; margin:20px 0;">
            <p style="margin:6px 0;"><strong style="color:#a78bfa;">BYU ID:</strong> <code style="color:#fff;">${student.byuId}</code></p>
            <p style="margin:6px 0;"><strong style="color:#a78bfa;">Temp Password:</strong> <code style="color:#fff; font-size:18px; letter-spacing:2px;">${tempPassword}</code></p>
          </div>
          <p style="color:#94a3b8; font-size:13px;">Please log in and change your password immediately. Your account country is set to <strong style="color:#c4b5fd;">${student.countryCode}</strong>.</p>
          <p style="color:#64748b; font-size:12px; margin-top:32px;">ConnectPay — BYU Pathway West Africa Virtual Card Program</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Welcome email sent to', student.email);
  } catch (error) {
    console.error('❌ Error sending welcome email:', error.message);
  }
};

module.exports = {
  notifyAdminNewRequest,
  notifyStudentCardAssigned,
  notifyStudentCardExpired,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendPasswordChangeConfirmationEmail,
  sendWelcomeEmail
};

