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
    port: process.env.EMAIL_PORT || 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
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

module.exports = {
  notifyAdminNewRequest,
  notifyStudentCardAssigned,
  notifyStudentCardExpired,
  sendVerificationEmail
};

