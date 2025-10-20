const axios = require('axios');

// Hubtel Direct Debit API Configuration
const HUBTEL_POS_SALES_ID = process.env.HUBTEL_POS_SALES_ID || '2030303';
const HUBTEL_CHARGE_URL = process.env.HUBTEL_CHARGE_URL || 'https://rmp.hubtel.com/merchantaccount';
const HUBTEL_PREAPPROVAL_URL = process.env.HUBTEL_PREAPPROVAL_URL || 'https://preapproval.hubtel.com/api/v2';
const HUBTEL_CLIENT_SECRET = process.env.HUBTEL_API_KEY; // API Key is the Client Secret
const HUBTEL_CLIENT_ID = process.env.HUBTEL_API_ID; // API ID is the Client ID

/**
 * Initiate Hubtel Direct Debit PreApproval (Step 1: Customer approval via USSD/OTP)
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
    console.log('🚀 Initiating Hubtel Direct Debit PreApproval:', {
      phoneNumber,
      amount,
      paymentReference,
      description,
      customerName,
      posId: HUBTEL_POS_SALES_ID
    });

    // Hubtel API expects Basic Auth with CLIENT_ID:CLIENT_SECRET
    const authToken = Buffer.from(`${HUBTEL_CLIENT_ID}:${HUBTEL_CLIENT_SECRET}`).toString('base64');

    // Format phone number (remove leading 0 if present, add 233)
    const formattedPhone = phoneNumber.startsWith('0') 
      ? '233' + phoneNumber.substring(1) 
      : phoneNumber.startsWith('233') 
        ? phoneNumber 
        : '233' + phoneNumber;

    // Detect channel based on phone number
    const channel = formattedPhone.startsWith('23324') || formattedPhone.startsWith('23325') || formattedPhone.startsWith('23354') || formattedPhone.startsWith('23355')
      ? 'mtn-gh-direct-debit'
      : 'vodafone-gh-direct-debit';

    // Hubtel Direct Debit PreApproval API payload (CORRECT FORMAT from documentation)
    const requestBody = {
      clientReferenceId: paymentReference,
      customerMsisdn: formattedPhone,
      channel: channel,
      callbackUrl: `${process.env.API_URL || 'https://byupay.up.railway.app'}/api/student/hubtel-callback`
    };

    console.log('📡 Using Hubtel Direct Debit PreApproval API (CORRECT ENDPOINT)');
    console.log('📦 Request body:', requestBody);
    console.log('📱 Sending to:', formattedPhone, 'via channel:', channel);

    // CORRECT Hubtel Direct Debit PreApproval endpoint
    const response = await axios.post(
      `${HUBTEL_PREAPPROVAL_URL}/merchant/${HUBTEL_POS_SALES_ID}/preapproval/initiate`,
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

    console.log('✅ Hubtel Direct Debit PreApproval response:', response.data);

    // Hubtel PreApproval response format
    if (response.data && response.data.responseCode) {
      const { responseCode, message, data } = response.data;
      
      return {
        success: responseCode === '0000' || responseCode === '0001',
        data: {
          hubtelPreApprovalId: data?.hubtelPreApprovalId,
          clientReferenceId: data?.clientReferenceId,
          verificationType: data?.verificationType, // USSD or OTP
          otpPrefix: data?.otpPrefix,
          preapprovalStatus: data?.preapprovalStatus, // PENDING, APPROVED, REJECTED
          status: data?.preapprovalStatus === 'APPROVED' ? 'approved' : 'pending',
          message: message
        }
      };
    } else {
      console.error('❌ Hubtel returned unexpected response:', response.data);
      return {
        success: false,
        error: response.data.message || 'Payment initiation failed',
        details: response.data
      };
    }
  } catch (error) {
    console.error('❌ Hubtel Direct Debit error:', error.response?.data || error.message);
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

