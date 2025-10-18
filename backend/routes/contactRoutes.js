const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/ContactMessage');
const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
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

    // Validate BYU Pathway email
    if (!email.toLowerCase().endsWith('@byupathway.edu')) {
      return res.status(400).json({
        success: false,
        message: 'Please use your BYU Pathway email address (@byupathway.edu)'
      });
    }

    // Validate BYU Student ID format if provided
    if (byuId && !/^\d{9}$/.test(byuId)) {
      return res.status(400).json({
        success: false,
        message: 'BYU Student ID must be exactly 9 digits'
      });
    }

    // Save to database
    const contactMessage = new ContactMessage({
      name,
      email,
      byuId,
      subject,
      message
    });
    await contactMessage.save();

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
                BYU Pathway Ghana Virtual Card System<br>
                Support Request ID: ${contactMessage._id}
              </p>
            </div>
          `
        });

        // Send confirmation to user
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: '✅ We received your message - BYU Pathway Ghana',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #002E5D;">Thank You for Contacting Us!</h2>
              <p>Hello ${name},</p>
              <p>We've received your message and will respond within 24 hours.</p>
              
              <div style="background-color: #e8f4f8; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Subject:</strong> ${subjectLabels[subject]}</p>
                <p><strong>Reference ID:</strong> ${contactMessage._id}</p>
              </div>
              
              <p>In the meantime, you can:</p>
              <ul>
                <li>Check our <a href="${process.env.FRONTEND_URL || 'http://localhost:5175'}/faq">FAQ page</a> for instant answers</li>
                <li>View your <a href="${process.env.FRONTEND_URL || 'http://localhost:5175'}/dashboard">Dashboard</a> for card status</li>
              </ul>
              
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                BYU Pathway Ghana Virtual Card System<br>
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
        referenceId: contactMessage._id,
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
    const filter = status ? { status } : {};
    
    const messages = await ContactMessage.find(filter).sort({ createdAt: -1 });

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
    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        respondedAt: status === 'responded' ? new Date() : undefined
      },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found'
      });
    }

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

