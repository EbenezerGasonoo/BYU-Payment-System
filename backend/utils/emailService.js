const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send email to admin when student requests card
const notifyAdminNewRequest = async (student, cardRequest) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: '🔔 New Virtual Card Request - BYU Pathway Ghana',
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
            BYU Pathway Ghana Virtual Card System<br>
            This is an automated notification.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Admin notification sent');
  } catch (error) {
    console.error('❌ Error sending admin notification:', error);
  }
};

// Send email to student when card is assigned
const notifyStudentCardAssigned = async (student, cardRequest) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: student.email,
      subject: '✅ Virtual Card Assigned - BYU Pathway Ghana',
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
            BYU Pathway Ghana Virtual Card System<br>
            This is an automated notification.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Student notification sent (card assigned)');
  } catch (error) {
    console.error('❌ Error sending student notification:', error);
  }
};

// Send email to student when card expires
const notifyStudentCardExpired = async (student, cardRequest) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: student.email,
      subject: '⏰ Virtual Card Expired - BYU Pathway Ghana',
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
            BYU Pathway Ghana Virtual Card System<br>
            This is an automated notification.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('✅ Student notification sent (card expired)');
  } catch (error) {
    console.error('❌ Error sending expiry notification:', error);
  }
};

module.exports = {
  notifyAdminNewRequest,
  notifyStudentCardAssigned,
  notifyStudentCardExpired
};

