const axios = require('axios');

// Hubtel Direct Debit Money API Configuration
const HUBTEL_API_BASE = process.env.HUBTEL_API_BASE || 'https://api.hubtel.com/v1/merchantaccount';
const HUBTEL_CLIENT_SECRET = process.env.HUBTEL_API_KEY; // API Key is the Client Secret
const HUBTEL_CLIENT_ID = process.env.HUBTEL_API_ID; // API ID is the Client ID

/**
 * Initialize Mobile Money Payment via Hubtel Direct Debit (Send Prompt to Phone)
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
    console.log('🚀 Initiating Hubtel Direct Debit (Phone Prompt):', {
      phoneNumber,
      amount,
      paymentReference,
      description,
      customerName
    });

    // Hubtel API expects Basic Auth with CLIENT_ID:CLIENT_SECRET
    const authToken = Buffer.from(`${HUBTEL_CLIENT_ID}:${HUBTEL_CLIENT_SECRET}`).toString('base64');

    // Format phone number (remove leading 0 if present, add 233)
    const formattedPhone = phoneNumber.startsWith('0') 
      ? '233' + phoneNumber.substring(1) 
      : phoneNumber.startsWith('233') 
        ? phoneNumber 
        : '233' + phoneNumber;

    // Hubtel Direct Debit API payload format
    const payload = {
      amount: amount,
      title: 'BYU Virtual Card Payment',
      description: description || `Payment for ${customerName}`,
      clientReference: paymentReference,
      callbackUrl: `${process.env.API_URL || 'https://byupay.up.railway.app'}/api/student/hubtel-callback`,
      cancellationUrl: `${process.env.FRONTEND_URL || 'https://byupay.vercel.app'}/request`,
      returnUrl: `${process.env.FRONTEND_URL || 'https://byupay.vercel.app'}/dashboard`
    };

    console.log('📤 Hubtel Direct Debit payload:', payload);
    console.log('📱 Sending payment prompt to:', formattedPhone);

    // Hubtel Direct Debit endpoint: POST /request-money/{mobileNumber}
    const response = await axios.post(
      `${HUBTEL_API_BASE}/merchants/${HUBTEL_CLIENT_ID}/receive/mobilemoney`,
      {
        CustomerName: customerName,
        CustomerMsisdn: formattedPhone,
        CustomerEmail: customerEmail || '',
        Channel: 'mtn-gh', // Will be auto-detected by Hubtel based on phone number
        Amount: amount,
        PrimaryCallbackUrl: `${process.env.API_URL || 'https://byupay.up.railway.app'}/api/student/hubtel-callback`,
        Description: description || 'BYU Virtual Card Payment',
        ClientReference: paymentReference
      },
      {
        headers: {
          'Authorization': `Basic ${authToken}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );

    console.log('✅ Hubtel Direct Debit response:', response.data);

    // Hubtel Direct Debit returns different response structure
    if (response.data && (response.data.ResponseCode === '0000' || response.data.Status === 'Success')) {
      return {
        success: true,
        data: {
          transactionId: response.data.TransactionId || response.data.Data?.TransactionId,
          status: 'pending',
          message: 'Payment prompt sent to customer phone'
        }
      };
    } else {
      console.error('❌ Hubtel returned non-success code:', response.data);
      return {
        success: false,
        error: response.data.Message || response.data.message || 'Payment initiation failed',
        details: response.data
      };
    }
  } catch (error) {
    console.error('❌ Hubtel Direct Debit error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.Message || error.response?.data?.message || error.message,
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
      `${HUBTEL_API_BASE}/merchants/${HUBTEL_CLIENT_ID}/transactions/${transactionId}`,
      {
        headers: {
          'Authorization': `Basic ${authToken}`,
          'Accept': 'application/json'
        }
      }
    );

    console.log('✅ Hubtel transaction status:', response.data);

    if (response.data && response.data.ResponseCode === '0000') {
      return {
        success: true,
        data: response.data.Data
      };
    } else {
      return {
        success: false,
        error: response.data.Message || 'Status check failed'
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

