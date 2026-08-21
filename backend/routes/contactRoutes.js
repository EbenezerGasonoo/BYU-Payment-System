const express = require('express');
const router = express.Router();
const { ContactMessage } = require('../models');
const nodemailer = require('nodemailer');

// Create reusable transporter matching email configuration
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'mail.entechnologygh.com',
  port: parseInt(process.env.EMAIL_PORT || '465', 10),
  secure: (process.env.EMAIL_PORT || '465') === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Submit contact form
router.post('/submit', async (req, res) => {
  try {
    const { name, email, byuId, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, subject, and message are required'
      });
    }

    // Validate Pathway email
    if (!email.toLowerCase().endsWith('@byupathway.edu')) {
      return res.status(400).json({
        success: false,
        message: 'Please use your Pathway email address (@byupathway.edu)'
      });
    }

    // Validate BYU Student ID format if provided
    if (byuId && !/^\d{7,8}$/.test(byuId)) {
      return res.status(400).json({
        success: false,
        message: 'BYU Student ID must be 7-8 digits'
      });
    }

    // Save to database
    const contactMessage = await ContactMessage.create({
      name,
      email,
      byuId,
      subject,
      message
    });

    // Send email to admin (if email is configured)
    if (process.env.EMAIL_USER && process.env.ADMIN_EMAIL) {
      try {
        const subjectLabels = {
          'general': 'General Inquiry',
          'card-request': 'Card Request Issue',
          'registration': 'Registration Problem',
          'payment': 'Payment Question',
          'technical': 'Technical Issue',
          'other': 'Other'
        };

        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: process.env.ADMIN_EMAIL,
          subject: `🔔 New Support Request - ${subjectLabels[subject]}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #002E5D;">New Support Request</h2>
              
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>From:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                ${byuId ? `<p><strong>BYU ID:</strong> ${byuId}</p>` : ''}
                <p><strong>Subject:</strong> ${subjectLabels[subject]}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
              </div>
              
              <div style="background-color: #fff; padding: 20px; border-left: 4px solid #FFB81C; margin: 20px 0;">
                <h3 style="color: #002E5D; margin-top: 0;">Message:</h3>
                <p style="color: #333; line-height: 1.6;">${message}</p>
              </div>
              
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                Pathway Virtual Card System<br>
                Support Request ID: ${contactMessage.id}
              </p>
            </div>
          `
        });

        // Send confirmation to user
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: '✅ We received your message - Pathway',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #002E5D;">Thank You for Contacting Us!</h2>
              <p>Hello ${name},</p>
              <p>We've received your message and will respond within 24 hours.</p>
              
              <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Subject:</strong> ${subjectLabels[subject]}</p>
                <p><strong>Reference ID:</strong> ${contactMessage.id}</p>
              </div>
              
              <p>In the meantime, you can:</p>
              <ul>
                <li>Check our <a href="${process.env.FRONTEND_URL || 'http://localhost:5175'}/faq">FAQ page</a> for instant answers</li>
                <li>View your <a href="${process.env.FRONTEND_URL || 'http://localhost:5175'}/dashboard">Dashboard</a> for card status</li>
              </ul>
              
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                Pathway Virtual Card System<br>
                This is an automated confirmation.
              </p>
            </div>
          `
        });

        console.log('✅ Contact form emails sent');
      } catch (emailError) {
        console.error('❌ Error sending emails:', emailError.message);
        // Continue even if email fails
      }
    }

    res.status(201).json({
      success: true,
      message: 'Your message has been received. We\'ll respond within 24 hours.',
      data: {
        referenceId: contactMessage.id,
        createdAt: contactMessage.createdAt
      }
    });
  } catch (error) {
    console.error('Error submitting contact form:', error);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.',
      error: error.message
    });
  }
});

// Get all contact messages (admin only)
router.get('/messages', async (req, res) => {
  try {
    // Verify admin key
    const adminKey = req.headers['x-admin-key'];
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Invalid admin key'
      });
    }

    const { status } = req.query;
    const where = status ? { status } : undefined;

    const messages = await ContactMessage.findAll({
      where,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Update message status (admin only)
router.patch('/messages/:id', async (req, res) => {
  try {
    // Verify admin key
    const adminKey = req.headers['x-admin-key'];
    if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: Invalid admin key'
      });
    }

    const { status } = req.body;
    const message = await ContactMessage.findByPk(req.params.id);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

    await message.update({
      status,
      respondedAt: status === 'responded' ? new Date() : null
    });

    res.json({
      success: true,
      message: 'Status updated',
      data: message
    });
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;

