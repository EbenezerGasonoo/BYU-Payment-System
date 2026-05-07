const axios = require('axios');

// Hubtel Online Checkout API Configuration
const HUBTEL_CLIENT_ID = process.env.HUBTEL_API_ID || process.env.HUBTEL_CLIENT_ID;
const HUBTEL_CLIENT_SECRET = process.env.HUBTEL_API_KEY || process.env.HUBTEL_CLIENT_SECRET;
const HUBTEL_CHECKOUT_URL = process.env.HUBTEL_CHECKOUT_URL || 'https://payproxyapi.hubtel.com/items/initiate';
const HUBTEL_BASE_URL = process.env.HUBTEL_BASE_URL || 'https://rmsc.hubtel.com';
const HUBTEL_CALLBACK_URL = process.env.HUBTEL_CALLBACK_URL || `${process.env.BACKEND_URL || 'http://localhost:3000'}/api/student/hubtel-callback`;
const HUBTEL_RETURN_URL = process.env.HUBTEL_RETURN_URL || `${process.env.FRONTEND_URL || 'http://localhost:5173'}/request?payment=success`;

/**
 * Initiate Hubtel Online Checkout Payment
 * @param {number} amount - Amount to charge (in GHS)
 * @param {string} paymentReference - Unique payment reference
 * @param {string} description - Payment description
 * @param {string} customerName - Customer name
 * @param {string} customerEmail - Customer email
 * @param {string} customerPhone - Customer phone number
 * @returns {Promise<Object>} Payment initiation result with checkout URL
 */
const initiatePayment = async (amount, paymentReference, description, customerName = 'Student', customerEmail = '', customerPhone = '') => {
  try {
    console.log('🚀 Initiating Hubtel Online Checkout:', {
      amount,
      paymentReference,
      description,
      customerName,
      customerEmail,
      customerPhone
    });

    if (!HUBTEL_CLIENT_ID || !HUBTEL_CLIENT_SECRET) {
      return {
        success: false,
        error: 'Hubtel credentials not configured. Please set HUBTEL_API_ID and HUBTEL_API_KEY environment variables.'
      };
    }

    // Hubtel API expects Basic Auth with CLIENT_ID:CLIENT_SECRET
    const authToken = Buffer.from(`${HUBTEL_CLIENT_ID}:${HUBTEL_CLIENT_SECRET}`).toString('base64');

    // Hubtel Online Checkout API payload
    const requestBody = {
      totalAmount: amount,
      description: description || 'BYU Virtual Card Payment',
      callbackUrl: HUBTEL_CALLBACK_URL,
      returnUrl: HUBTEL_RETURN_URL,
      merchantBusinessLogoUrl: '',
      merchantAccountNumber: '',
      cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/request?payment=cancelled`,
      clientReference: paymentReference,
      customerName: customerName,
      customerEmail: customerEmail,
      customerMsisdn: customerPhone
    };

    console.log('📡 Using Hubtel Online Checkout API');
    console.log('📦 Request body:', { ...requestBody, callbackUrl: HUBTEL_CALLBACK_URL });

    const response = await axios.post(
      HUBTEL_CHECKOUT_URL,
      requestBody,
      {
        headers: {
          'Authorization': `Basic ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 30000
      }
    );

    console.log('✅ Hubtel Online Checkout response:', response.data);

    // Hubtel Checkout response format
    if (response.data && response.data.responseCode) {
      const { responseCode, data } = response.data;
      
      if (responseCode === '0000' && data) {
        return {
          success: true,
          data: {
            checkoutUrl: data.checkoutUrl || data.checkoutDirectUrl,
            checkoutId: data.checkoutId || data.transactionId,
            status: 'pending',
            message: 'Payment checkout created successfully. Redirecting to Hubtel...',
            transactionId: data.checkoutId || data.transactionId
          }
        };
      } else {
        return {
          success: false,
          error: response.data.message || 'Failed to create checkout',
          details: response.data
        };
      }
    } else {
      console.error('❌ Hubtel returned unexpected response:', response.data);
      return {
        success: false,
        error: response.data?.message || 'Payment initiation failed',
        details: response.data
      };
    }
  } catch (error) {
    console.error('❌ Hubtel Online Checkout error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.response?.data?.Message || error.message,
      details: error.response?.data
    };
  }
};

/**
 * Check Payment Status via Hubtel
 * @param {string} transactionId - Hubtel transaction ID
 * @returns {Promise<Object>} Payment status result
 */
const checkPaymentStatus = async (transactionId) => {
  try {
    const authToken = Buffer.from(`${HUBTEL_CLIENT_ID}:${HUBTEL_CLIENT_SECRET}`).toString('base64');

    const response = await axios.get(
      `${HUBTEL_BASE_URL}/merchants/${HUBTEL_CLIENT_ID}/transactions/${transactionId}`,
      {
        headers: {
          'Authorization': `Basic ${authToken}`,
          'Accept': 'application/json'
        }
      }
    );

    console.log('✅ Hubtel transaction status:', response.data);

    const code = response.data?.ResponseCode || response.data?.responseCode;
    const payload = response.data?.Data || response.data?.data;

    if ((code === '0000' || code === '00') && payload) {
      // Normalize the Hubtel status string ("Paid", "Success", etc.) so callers
      // can reliably check for `status === 'paid'`.
      const rawStatus = (payload.Status || payload.status || '').toString().toLowerCase();
      const normalizedStatus = ['paid', 'success', 'successful', 'completed'].includes(rawStatus)
        ? 'paid'
        : rawStatus || 'pending';

      return {
        success: true,
        data: { ...payload, status: normalizedStatus }
      };
    } else {
      return {
        success: false,
        error: response.data?.Message || response.data?.message || 'Status check failed'
      };
    }
  } catch (error) {
    console.error('❌ Hubtel status check error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.Message || error.response?.data?.message || error.message
    };
  }
};

module.exports = {
  initiatePayment,
  checkPaymentStatus
};

