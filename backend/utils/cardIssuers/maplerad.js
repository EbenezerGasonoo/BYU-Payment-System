/**
 * Maplerad card issuer adapter
 * Docs: https://maplerad.dev (check freeze/terminate paths against the live docs before going live)
 */

const axios = require('axios');

async function issue({ studentName, amountUsd }, { secretKey, baseUrl }) {
  const response = await axios.post(
    `${baseUrl}/v1/issuing`,
    {
      cardholder_name: studentName,
      currency: 'USD',
      amount: Math.round(amountUsd * 100),
      brand: 'VISA'
    },
    { headers: { Authorization: `Bearer ${secretKey}` } }
  );
  if (!(response.data && response.data.status)) {
    throw new Error(response.data?.message || 'Maplerad did not issue a card');
  }
  const card = response.data.data;
  return {
    success: true,
    provider: 'maplerad',
    cardId: card.id,
    cardNumber: card.card_number,
    cardholderName: card.cardholder_name,
    expiryDate: `${card.expiry_month}/${card.expiry_year}`,
    cvv: card.cvv,
    status: 'active'
  };
}

async function cardAction(cardId, action, { secretKey, baseUrl }) {
  try {
    await axios.patch(`${baseUrl}/v1/issuing/${cardId}/${action}`, {}, {
      headers: { Authorization: `Bearer ${secretKey}` }
    });
    return { success: true, status: action };
  } catch (error) {
    console.error(`⚠️ Maplerad ${action} error:`, error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

module.exports = {
  name: 'maplerad',
  isApi: true,
  credentialsFrom: (env, cc, { allowGlobal }) => ({
    secretKey: env[`MAPLERAD_SECRET_KEY_${cc}`] || (allowGlobal ? env.MAPLERAD_SECRET_KEY : undefined),
    baseUrl: env[`MAPLERAD_BASE_URL_${cc}`] || env.MAPLERAD_BASE_URL || 'https://sandbox.api.maplerad.com'
  }),
  isConfigured: (creds) => Boolean(creds.secretKey && !creds.secretKey.includes('YOUR_')),
  issue,
  setFrozen: (cardId, frozen, creds) => cardAction(cardId, frozen ? 'freeze' : 'unfreeze', creds),
  terminate: (cardId, creds) => cardAction(cardId, 'terminate', creds)
};
