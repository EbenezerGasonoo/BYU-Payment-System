/**
 * Africa's Talking SMS & WhatsApp Notification Service
 * Dispatches instant transactional messaging across West Africa (Ghana, Nigeria, Francophone, etc.)
 */

const axios = require('axios');

async function sendSmsNotification({ toPhone, message }) {
  const AT_USERNAME = process.env.AT_USERNAME || 'sandbox';
  const AT_API_KEY = process.env.AT_API_KEY;

  if (!AT_API_KEY || AT_API_KEY.includes('YOUR_')) {
    console.log(`📱 [SMS Simulation -> ${toPhone}]: ${message}`);
    return { success: true, simulated: true, message: 'SMS simulated successfully' };
  }

  try {
    const params = new URLSearchParams();
    params.append('username', AT_USERNAME);
    params.append('to', toPhone);
    params.append('message', message);

    const response = await axios.post(
      'https://api.africastalking.com/version1/messaging',
      params.toString(),
      {
        headers: {
          apiKey: AT_API_KEY,
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json'
        }
      }
    );

    return {
      success: true,
      data: response.data,
      simulated: false
    };
  } catch (error) {
    console.error('Africa\'s Talking SMS Error:', error.message);
    return { success: false, error: error.message };
  }
}

async function sendWhatsAppNotification({ toPhone, message }) {
  // WhatsApp notification log simulation or Meta / Twilio WhatsApp API
  console.log(`💬 [WhatsApp Notification -> ${toPhone}]: ${message}`);
  return { success: true, simulated: true };
}

module.exports = {
  sendSmsNotification,
  sendWhatsAppNotification
};
