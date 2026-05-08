const cron = require('node-cron');
const { Op } = require('sequelize');
const { CardRequest, Student } = require('../models');
const { notifyStudentCardExpired } = require('./emailService');

// Run every 5 minutes to check for expired cards
const startCardExpiryJob = () => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      console.log('🕐 Running card expiry check...');

      const now = new Date();

      // Find all assigned cards that have passed their expiry time
      const expiredCards = await CardRequest.findAll({
        where: {
          status: 'assigned',
          expiresAt: { [Op.lte]: now }
        },
        include: [{ model: Student, as: 'student' }]
      });

      if (expiredCards.length > 0) {
        console.log(`⏰ Found ${expiredCards.length} expired card(s)`);

        for (const card of expiredCards) {
          card.status = 'expired';
          await card.save();

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
