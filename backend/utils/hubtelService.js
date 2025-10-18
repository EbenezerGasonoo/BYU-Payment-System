const axios = require('axios');

const HUBTEL_API_URL = process.env.HUBTEL_API_URL || 'https://payproxyapi.hubtel.com/items/initiate';
const HUBTEL_API_KEY = process.env.HUBTEL_API_KEY;
const HUBTEL_API_ID = process.env.HUBTEL_API_ID;

/**
 * Initialize Mobile Money Payment via Hubtel
 * @param {string} phoneNumber - Customer phone number (e.g., 0241234567)
 * @param {number} amount - Amount to charge
 * @param {string} paymentReference - Unique payment reference
 * @param {string} description - Payment description
 * @returns {Promise<Object>} Payment initiation result
 */
const initiatePayment = async (phoneNumber, amount, paymentReference, description) => {
  try {
    console.log('🚀 Initiating Hubtel payment:', {
      phoneNumber,
      amount,
      paymentReference,
      description
    });

    // Hubtel API expects Basic Auth with API_ID:API_KEY
    const authToken = Buffer.from(`${HUBTEL_API_ID}:${HUBTEL_API_KEY}`).toString('base64');

    const requestBody = {
      totalAmount: amount,
      description: description || 'BYU Virtual Card Payment',
      callbackUrl: `${process.env.API_URL || 'https://byupay.up.railway.app'}/api/student/hubtel-callback`,
      returnUrl: `${process.env.FRONTEND_URL || 'https://byupay.vercel.app'}/dashboard`,
      merchantAccountNumber: phoneNumber,
      cancellationUrl: `${process.env.FRONTEND_URL || 'https://byupay.vercel.app'}/request`,
      clientReference: paymentReference
    };

    console.log('📤 Hubtel request body:', requestBody);

    const response = await axios.post(
      HUBTEL_API_URL,
      requestBody,
      {
        headers: {
          'Authorization': `Basic ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    console.log('✅ Hubtel response:', response.data);

    return {
      success: true,
      data: {
        checkoutId: response.data.checkoutId,
        checkoutUrl: response.data.checkoutUrl,
        checkoutDirectUrl: response.data.checkoutDirectUrl,
        status: response.data.status
      }
    };
  } catch (error) {
    console.error('❌ Hubtel payment error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      details: error.response?.data
    };
  }
};

/**
 * Check Payment Status via Hubtel
 * @param {string} checkoutId - Hubtel checkout ID
 * @returns {Promise<Object>} Payment status result
 */
const checkPaymentStatus = async (checkoutId) => {
  try {
    const authToken = Buffer.from(`${HUBTEL_API_ID}:${HUBTEL_API_KEY}`).toString('base64');

    const response = await axios.get(
      `https://payproxyapi.hubtel.com/items/status/${checkoutId}`,
      {
        headers: {
          'Authorization': `Basic ${authToken}`,
          'Accept': 'application/json'
        }
      }
    );

    console.log('✅ Hubtel status check:', response.data);

    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    console.error('❌ Hubtel status check error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

module.exports = {
  initiatePayment,
  checkPaymentStatus
};

