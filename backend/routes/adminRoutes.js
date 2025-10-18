const express = require('express');
const router = express.Router();
const CardRequest = require('../models/CardRequest');
const Student = require('../models/Student');
const { notifyStudentCardAssigned } = require('../utils/emailService');

// Middleware to verify admin key
const verifyAdminKey = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'];
  
  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({
      success: false,
      message: 'Unauthorized: Invalid admin key'
    });
  }
  
  next();
};

// Apply admin middleware to all routes
router.use(verifyAdminKey);

// Get all card requests with filters
router.get('/requests', async (req, res) => {
  try {
    const { status } = req.query;
    
    const filter = status ? { status } : {};
    const requests = await CardRequest.find(filter)
      .populate('student')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: requests
    });
  } catch (error) {
    console.error('Error fetching requests:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Manually assign card to request
router.post('/assign', async (req, res) => {
  try {
    const { requestId, cardNumber, expiryDate, cvv } = req.body;

    if (!requestId || !cardNumber || !expiryDate || !cvv) {
      return res.status(400).json({
        success: false,
        message: 'All card details are required'
      });
    }

    const cardRequest = await CardRequest.findById(requestId).populate('student');
    if (!cardRequest) {
      return res.status(404).json({
        success: false,
        message: 'Card request not found'
      });
    }

    if (cardRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Card request is not pending'
      });
    }

    // Update card request with manual card details
    cardRequest.virtualCardNumber = cardNumber;
    cardRequest.cardExpiryDate = expiryDate;
    cardRequest.cardCVV = cvv;
    cardRequest.status = 'assigned';
    cardRequest.assignedAt = new Date();
    cardRequest.expiresAt = new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 hours from now

    await cardRequest.save();

    // Notify student
    await notifyStudentCardAssigned(cardRequest.student, cardRequest);

    res.json({
      success: true,
      message: 'Card assigned successfully',
      data: cardRequest
    });
  } catch (error) {
    console.error('Error assigning card:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Auto-generate and assign mock card
router.post('/assign/mock', async (req, res) => {
  try {
    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({
        success: false,
        message: 'Request ID is required'
      });
    }

    const cardRequest = await CardRequest.findById(requestId).populate('student');
    if (!cardRequest) {
      return res.status(404).json({
        success: false,
        message: 'Card request not found'
      });
    }

    if (cardRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Card request is not pending'
      });
    }

    // Generate mock card details
    const cardNumber = '4' + Math.floor(Math.random() * 1e15).toString().padStart(15, '0');
    const expiryMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const expiryYear = String(new Date().getFullYear() + 2).slice(-2);
    const expiryDate = `${expiryMonth}/${expiryYear}`;
    const cvv = Math.floor(Math.random() * 900 + 100).toString();

    // Update card request
    cardRequest.virtualCardNumber = cardNumber;
    cardRequest.cardExpiryDate = expiryDate;
    cardRequest.cardCVV = cvv;
    cardRequest.status = 'assigned';
    cardRequest.assignedAt = new Date();
    cardRequest.expiresAt = new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 hours from now

    await cardRequest.save();

    // Notify student
    await notifyStudentCardAssigned(cardRequest.student, cardRequest);

    res.json({
      success: true,
      message: 'Mock card generated and assigned successfully',
      data: cardRequest
    });
  } catch (error) {
    console.error('Error assigning mock card:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Mark card request as paid, expired, or declined
router.post('/action', async (req, res) => {
  try {
    const { requestId, action } = req.body;

    if (!requestId || !action) {
      return res.status(400).json({
        success: false,
        message: 'Request ID and action are required'
      });
    }

    if (!['paid', 'expired', 'declined'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action. Must be: paid, expired, or declined'
      });
    }

    const cardRequest = await CardRequest.findById(requestId);
    if (!cardRequest) {
      return res.status(404).json({
        success: false,
        message: 'Card request not found'
      });
    }

    cardRequest.status = action;
    if (action === 'paid') {
      cardRequest.paidAt = new Date();
    }

    await cardRequest.save();

    res.json({
      success: true,
      message: `Card request marked as ${action}`,
      data: cardRequest
    });
  } catch (error) {
    console.error('Error updating card status:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

// Get admin dashboard statistics
router.get('/stats', async (req, res) => {
  try {
    const totalRequests = await CardRequest.countDocuments();
    const pendingRequests = await CardRequest.countDocuments({ status: 'pending' });
    const assignedRequests = await CardRequest.countDocuments({ status: 'assigned' });
    const paidRequests = await CardRequest.countDocuments({ status: 'paid' });
    const expiredRequests = await CardRequest.countDocuments({ status: 'expired' });
    const totalStudents = await Student.countDocuments();

    res.json({
      success: true,
      data: {
        totalRequests,
        pendingRequests,
        assignedRequests,
        paidRequests,
        expiredRequests,
        totalStudents
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;

