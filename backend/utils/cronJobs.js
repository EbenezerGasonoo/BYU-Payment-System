const cron = require('node-cron');
const CardRequest = require('../models/CardRequest');
const Student = require('../models/Student');
const { notifyStudentCardExpired } = require('./emailService');

// Run every 5 minutes to check for expired cards
const startCardExpiryJob = () => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('🕐 Running card expiry check...');
      
      const now = new Date();
      
      // Find all assigned cards that have passed their expiry time
      const expiredCards = await CardRequest.find({
        status: 'assigned',
        expiresAt: { $lte: now }
      }).populate('student');
      
      if (expiredCards.length > 0) {
        console.log(`⏰ Found ${expiredCards.length} expired card(s)`);
        
        for (const card of expiredCards) {
          // Update status to expired
          card.status = 'expired';
          await card.save();
          
          // Notify student
          await notifyStudentCardExpired(card.student, card);
          console.log(`✅ Card ${card.virtualCardNumber} marked as expired`);
        }
      } else {
        console.log('✓ No expired cards found');
      }
    } catch (error) {
      console.error('❌ Error in card expiry job:', error);
    }
  });
  
  console.log('✅ Card expiry cron job started (runs every 5 minutes)');
};

module.exports = { startCardExpiryJob };

