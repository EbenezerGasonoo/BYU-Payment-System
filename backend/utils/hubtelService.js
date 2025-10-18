const axios = require('axios');

// Hubtel Online Checkout API Configuration
const HUBTEL_CHECKOUT_URL = process.env.HUBTEL_CHECKOUT_URL || 'https://payproxyapi.hubtel.com/items/initiate';
const HUBTEL_CLIENT_SECRET = process.env.HUBTEL_API_KEY; // API Key is the Client Secret
const HUBTEL_CLIENT_ID = process.env.HUBTEL_API_ID; // API ID is the Client ID

/**
 * Initialize Mobile Money Payment via Hubtel Online Checkout
 * @param {string} phoneNumber - Customer phone number (e.g., 0241234567)
 * @param {number} amount - Amount to charge
 * @param {string} paymentReference - Unique payment reference
 * @param {string} description - Payment description
 * @param {string} customerName - Customer name
 * @param {string} customerEmail - Customer email
 * @returns {Promise<Object>} Payment initiation result
 */
const initiatePayment = async (phoneNumber, amount, paymentReference, description, customerName = 'Student', customerEmail = '') => {
  try {
    console.log('🚀 Initiating Hubtel Online Checkout:', {
      phoneNumber,
      amount,
      paymentReference,
      description,
      customerName
    });

    // Hubtel API expects Basic Auth with CLIENT_ID:CLIENT_SECRET
    const authToken = Buffer.from(`${HUBTEL_CLIENT_ID}:${HUBTEL_CLIENT_SECRET}`).toString('base64');

    // Hubtel Online Checkout API payload format
    const payload = {
      totalAmount: amount,
      description: description || 'BYU Virtual Card Payment',
      callbackUrl: `${process.env.API_URL || 'https://byupay.up.railway.app'}/api/student/hubtel-callback`,
      returnUrl: `${process.env.FRONTEND_URL || 'https://byupay.vercel.app'}/dashboard`,
      cancellationUrl: `${process.env.FRONTEND_URL || 'https://byupay.vercel.app'}/request`,
      merchantAccountNumber: HUBTEL_CLIENT_ID, // Use your Hubtel merchant account number
      clientReference: paymentReference,
      // Customer details
      payeeName: customerName,
      payeeMobileNumber: phoneNumber,
      payeeEmail: customerEmail || ''
    };

    console.log('📤 Hubtel Online Checkout payload:', payload);

    const response = await axios.post(
      HUBTEL_CHECKOUT_URL,
      payload,
      {
        headers: {
          'Authorization': `Basic ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    console.log('✅ Hubtel response:', response.data);

    // Hubtel returns responseCode "0000" for success
    if (response.data && response.data.responseCode === '0000') {
      return {
        success: true,
        data: {
          checkoutId: response.data.data?.checkoutId,
          checkoutUrl: response.data.data?.checkoutUrl,
          checkoutDirectUrl: response.data.data?.checkoutDirectUrl,
          status: response.data.status || 'pending'
        }
      };
    } else {
      console.error('❌ Hubtel returned non-success code:', response.data);
      return {
        success: false,
        error: response.data.message || 'Payment initiation failed',
        details: response.data
      };
    }
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
    const authToken = Buffer.from(`${HUBTEL_CLIENT_ID}:${HUBTEL_CLIENT_SECRET}`).toString('base64');

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

    if (response.data && response.data.responseCode === '0000') {
      return {
        success: true,
        data: response.data.data
      };
    } else {
      return {
        success: false,
        error: response.data.message || 'Status check failed'
      };
    }
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

