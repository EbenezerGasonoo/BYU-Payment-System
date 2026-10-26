/**
 * Sudo Africa card issuer adapter
 * Docs: https://docs.sudo.africa
 */

const axios = require('axios');

const baseUrlFor = (env) => (env === 'live' ? 'https://api.sudo.africa/v2' : 'https://sandbox.sudo.africa/v2');

const authHeaders = (apiKey) => ({
  Authorization: `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
});

async function issue({ studentName, amountUsd, email }, { apiKey, env }) {
  const baseUrl = baseUrlFor(env);
  const nameParts = (studentName || 'Student User').trim().split(' ');
  const firstName = nameParts[0] || 'Student';
  const lastName = nameParts.slice(1).join(' ') || 'User';

  try {
    // Step 1: Create or find Customer on Sudo Africa
    const customerResponse = await axios.post(
      `${baseUrl}/customers`,
      {
        type: 'individual',
        name: { firstName, lastName },
        email: email || `student_${Date.now()}@connectpay.africa`,
        status: 'active'
      },
      { headers: authHeaders(apiKey) }
    );

    const customerId = customerResponse.data?.data?._id || customerResponse.data?._id;

    // Step 2: Create Virtual USD Card under Customer
    const cardResponse = await axios.post(
      `${baseUrl}/cards`,
      {
        customerId,
        currency: 'USD',
        type: 'virtual',
        brand: 'Visa',
        issuer: 'sudo',
        status: 'active',
        amount: parseFloat(amountUsd)
      },
      { headers: authHeaders(apiKey) }
    );

    const cardData = cardResponse.data?.data || cardResponse.data;

    return {
      success: true,
      provider: 'sudo-africa',
      cardId: cardData._id || cardData.id,
      cardNumber: cardData.pan || cardData.cardNumber,
      cardholderName: `${firstName} ${lastName}`.toUpperCase(),
      expiryDate: `${cardData.expiryMonth}/${cardData.expiryYear?.toString().slice(-2)}`,
      cvv: cardData.cvv,
      brand: cardData.brand || 'VISA',
      status: cardData.status === 'active' ? 'active' : 'inactive'
    };
  } catch (error) {
    console.error('⚠️ Sudo Africa API Error:', error.response?.data || error.message);
    throw error;
  }
}

async function setStatus(cardId, sudoStatus, { apiKey, env }) {
  try {
    await axios.put(
      `${baseUrlFor(env)}/cards/${cardId}/status`,
      { status: sudoStatus },
      { headers: authHeaders(apiKey) }
    );
    return { success: true, status: sudoStatus };
  } catch (error) {
    console.error(`⚠️ Sudo Africa status (${sudoStatus}) error:`, error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  name: 'sudo',
  isApi: true,
  credentialsFrom: (env, cc, { allowGlobal }) => ({
    apiKey: env[`SUDO_API_KEY_${cc}`] || (allowGlobal ? env.SUDO_API_KEY : undefined),
    env: env[`SUDO_ENV_${cc}`] || env.SUDO_ENV || 'sandbox'
  }),
  isConfigured: (creds) => Boolean(creds.apiKey && !creds.apiKey.includes('YOUR_')),
  issue,
  setFrozen: (cardId, frozen, creds) => setStatus(cardId, frozen ? 'inactive' : 'active', creds),
  terminate: (cardId, creds) => setStatus(cardId, 'canceled', creds)
};
