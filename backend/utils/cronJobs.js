const cron = require('node-cron');
const { Op } = require('sequelize');
const { CardRequest, Student } = require('../models');
const { notifyStudentCardExpired } = require('./emailService');
const cardIssuers = require('./cardIssuers');

/**
 * Close an expired card at its issuer when the issuer has an API. Cards from a manual issuer
 * (or whose provider call fails) are flagged so an admin closes them by hand.
 */
async function closeExpiredCard(card) {
  card.status = 'expired';
  if (cardIssuers.isApiIssuer(card.issuer)) {
    const result = await cardIssuers.terminateCard(card);
    if (result.success) {
      card.cardStatus = 'terminated';
      card.needsManualClose = false;
      return 'terminated';
    }
    console.warn(`⚠️ Could not terminate card ${card.providerCardId} at ${card.issuer}; flagging for manual close`);
  }
  // Simulated cards are fake and have nothing to close
  if (card.issuer !== 'simulation') {
    card.needsManualClose = true;
  }
  return 'flagged';
}

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
          await closeExpiredCard(card);
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

module.exports = { startCardExpiryJob, closeExpiredCard };
