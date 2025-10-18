const axios = require('axios');
const { v4: uuidv4 } = require('uuid');

// MTN MoMo API Configuration
const MTN_MOMO_BASE_URL = process.env.MTN_MOMO_BASE_URL || 'https://sandbox.momodeveloper.mtn.com';
const MTN_COLLECTION_SUBSCRIPTION_KEY = process.env.MTN_COLLECTION_SUBSCRIPTION_KEY;
const MTN_API_USER = process.env.MTN_API_USER;
const MTN_API_KEY = process.env.MTN_API_KEY;
const MTN_TARGET_ENVIRONMENT = process.env.MTN_TARGET_ENVIRONMENT || 'sandbox'; // 'sandbox' or 'mtnghana'

/**
 * Get MTN MoMo Access Token
 * @returns {Promise<string>} Access token
 */
const getAccessToken = async () => {
  try {
    const authString = Buffer.from(`${MTN_API_USER}:${MTN_API_KEY}`).toString('base64');

    const response = await axios.post(
      `${MTN_MOMO_BASE_URL}/collection/token/`,
      {},
      {
        headers: {
          'Authorization': `Basic ${authString}`,
          'Ocp-Apim-Subscription-Key': MTN_COLLECTION_SUBSCRIPTION_KEY
        }
      }
    );

    console.log('✅ MTN MoMo access token obtained');
    return response.data.access_token;
  } catch (error) {
    console.error('❌ MTN MoMo auth error:', error.response?.data || error.message);
    throw new Error('Failed to get MTN MoMo access token');
  }
};

/**
 * Request payment from customer (Request to Pay)
 * @param {string} phoneNumber - Customer phone number (format: 233XXXXXXXXX)
 * @param {number} amount - Amount to collect
 * @param {string} paymentReference - Unique payment reference
 * @param {string} description - Payment description
 * @returns {Promise<Object>} Payment request result
 */
const requestToPay = async (phoneNumber, amount, paymentReference, description = 'BYU Payment') => {
  try {
    console.log('🚀 MTN MoMo Request to Pay:', {
      phoneNumber,
      amount,
      paymentReference,
      description
    });

    // Get access token
    const accessToken = await getAccessToken();

    // Format phone number (must be 233XXXXXXXXX)
    const formattedPhone = phoneNumber.startsWith('0') 
      ? '233' + phoneNumber.substring(1) 
      : phoneNumber.startsWith('233') 
        ? phoneNumber 
        : '233' + phoneNumber;

    // Generate unique reference ID (UUID)
    const referenceId = uuidv4();

    // MTN Request to Pay payload
    const payload = {
      amount: amount.toString(),
      currency: 'GHS',
      externalId: paymentReference,
      payer: {
        partyIdType: 'MSISDN',
        partyId: formattedPhone
      },
      payerMessage: description || 'BYU Virtual Card Payment',
      payeeNote: `Payment for ${paymentReference}`
    };

    console.log('📤 MTN MoMo payload:', payload);
    console.log('📱 Sending prompt to:', formattedPhone);
    console.log('🔑 Reference ID:', referenceId);

    const response = await axios.post(
      `${MTN_MOMO_BASE_URL}/collection/v1_0/requesttopay`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Reference-Id': referenceId,
          'X-Target-Environment': MTN_TARGET_ENVIRONMENT,
          'Ocp-Apim-Subscription-Key': MTN_COLLECTION_SUBSCRIPTION_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ MTN MoMo Request to Pay initiated');
    console.log('   Status:', response.status);

    // MTN returns 202 Accepted for successful initiation
    if (response.status === 202) {
      return {
        success: true,
        data: {
          referenceId: referenceId,
          status: 'pending',
          message: 'Payment request sent to customer phone'
        }
      };
    } else {
      return {
        success: false,
        error: 'Unexpected response from MTN MoMo',
        details: response.data
      };
    }
  } catch (error) {
    console.error('❌ MTN MoMo Request to Pay error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message,
      details: error.response?.data
    };
  }
};

/**
 * Check Payment Status
 * @param {string} referenceId - MTN reference ID from requestToPay
 * @returns {Promise<Object>} Payment status
 */
const checkPaymentStatus = async (referenceId) => {
  try {
    const accessToken = await getAccessToken();

    const response = await axios.get(
      `${MTN_MOMO_BASE_URL}/collection/v1_0/requesttopay/${referenceId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-Target-Environment': MTN_TARGET_ENVIRONMENT,
          'Ocp-Apim-Subscription-Key': MTN_COLLECTION_SUBSCRIPTION_KEY
        }
      }
    );

    console.log('✅ MTN MoMo status check:', response.data);

    return {
      success: true,
      data: {
        status: response.data.status, // SUCCESSFUL, PENDING, or FAILED
        amount: response.data.amount,
        currency: response.data.currency,
        externalId: response.data.externalId,
        financialTransactionId: response.data.financialTransactionId
      }
    };
  } catch (error) {
    console.error('❌ MTN MoMo status check error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
};

module.exports = {
  requestToPay,
  checkPaymentStatus,
  getAccessToken
};

