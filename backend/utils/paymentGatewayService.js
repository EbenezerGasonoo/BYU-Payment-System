/**
 * West Africa Multi-Gateway Payment Router & FX Exchange Rate Service
 * Supports Ghana (GHS), Nigeria (NGN), Francophone West Africa (XOF), Liberia (LRD), Sierra Leone (SLE)
 */

const axios = require('axios');

// Default fallback conversion rates to USD (1 USD = X Local Currency)
const DEFAULT_RATES = {
  GHS: 15.50,   // Ghanaian Cedi
  NGN: 1520.00, // Nigerian Naira
  XOF: 605.00,  // CFA Franc (CI, SN, BJ, TG)
  LRD: 195.00,  // Liberian Dollar
  SLE: 22.50,   // Sierra Leonean Leone
  USD: 1.00     // US Dollar
};

const COUNTRY_CONFIGS = {
  GH: { name: 'Ghana', currency: 'GHS', flag: '🇬🇭', dialCode: '+233', defaultGateway: 'hubtel' },
  NG: { name: 'Nigeria', currency: 'NGN', flag: '🇳🇬', dialCode: '+234', defaultGateway: 'paystack' },
  CI: { name: "Côte d'Ivoire", currency: 'XOF', flag: '🇨🇮', dialCode: '+225', defaultGateway: 'paystack' },
  SN: { name: 'Senegal', currency: 'XOF', flag: '🇸🇳', dialCode: '+221', defaultGateway: 'wave' },
  LR: { name: 'Liberia', currency: 'LRD', flag: '🇱🇷', dialCode: '+231', defaultGateway: 'flutterwave' },
  SL: { name: 'Sierra Leone', currency: 'SLE', flag: '🇸🇱', dialCode: '+232', defaultGateway: 'flutterwave' }
};

let cachedRates = { ...DEFAULT_RATES };
let lastFetchTime = 0;

/**
 * Fetch live exchange rates (or fallback to configured rates)
 */
async function getExchangeRates() {
  const now = Date.now();
  // Cache for 30 minutes
  if (now - lastFetchTime < 30 * 60 * 1000) {
    return cachedRates;
  }

  try {
    const response = await axios.get('https://open.er-api.com/v6/latest/USD', { timeout: 4000 });
    if (response.data && response.data.rates) {
      const r = response.data.rates;
      cachedRates = {
        GHS: r.GHS || DEFAULT_RATES.GHS,
        NGN: r.NGN || DEFAULT_RATES.NGN,
        XOF: r.XOF || DEFAULT_RATES.XOF,
        LRD: r.LRD || DEFAULT_RATES.LRD,
        SLE: r.SLE || DEFAULT_RATES.SLE,
        USD: 1.0
      };
      lastFetchTime = now;
      console.log('✅ Updated West Africa FX exchange rates:', cachedRates);
    }
  } catch (err) {
    console.warn('⚠️ Could not fetch live FX rates, using standard West Africa rates:', err.message);
  }

  return cachedRates;
}

/**
 * Calculate total local currency amount for USD virtual card request (USD + processing fee)
 */
async function calculateLocalAmount(usdAmount, currency = 'GHS', feePercentage = 5) {
  const rates = await getExchangeRates();
  const rate = rates[currency.toUpperCase()] || DEFAULT_RATES[currency.toUpperCase()] || 1.0;
  
  const subtotalUsd = parseFloat(usdAmount);
  const feeUsd = subtotalUsd * (feePercentage / 100);
  const totalUsd = subtotalUsd + feeUsd;
  
  const subtotalLocal = Math.ceil(subtotalUsd * rate * 100) / 100;
  const feeLocal = Math.ceil(feeUsd * rate * 100) / 100;
  const totalLocal = Math.ceil(totalUsd * rate * 100) / 100;

  return {
    usdAmount: subtotalUsd,
    feeUsd: Math.round(feeUsd * 100) / 100,
    totalUsd: Math.round(totalUsd * 100) / 100,
    currency,
    exchangeRate: rate,
    subtotalLocal,
    feeLocal,
    totalLocal
  };
}

/**
 * Initialize Paystack Payment Transaction
 */
async function initializePaystackPayment({ email, amountLocal, currency, reference, callbackUrl }) {
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  
  if (!PAYSTACK_SECRET_KEY || PAYSTACK_SECRET_KEY.includes('YOUR_')) {
    // Sandbox / Test simulation mode
    return {
      success: true,
      authorizationUrl: `${callbackUrl || 'https://byupay.vercel.app'}?paystack_ref=${reference}&status=simulated`,
      reference,
      simulated: true,
      message: 'Paystack transaction initialized (Simulation mode)'
    };
  }

  try {
    // Paystack amounts are in kobo / pesewas (multiply by 100)
    const payload = {
      email,
      amount: Math.round(amountLocal * 100),
      currency: currency.toUpperCase(),
      reference,
      callback_url: callbackUrl,
      metadata: { custom_fields: [{ display_name: "Service", variable_name: "service", value: "BYU Pathway USD Virtual Card" }] }
    };

    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      payload,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.status) {
      return {
        success: true,
        authorizationUrl: response.data.data.authorization_url,
        accessCode: response.data.data.access_code,
        reference,
        simulated: false
      };
    }
    throw new Error(response.data.message || 'Failed to initialize Paystack payment');
  } catch (error) {
    console.error('Paystack init error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.message || error.message
    };
  }
}

/**
 * Verify Paystack Payment Status
 */
async function verifyPaystackPayment(reference) {
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

  if (!PAYSTACK_SECRET_KEY || PAYSTACK_SECRET_KEY.includes('YOUR_')) {
    return { success: true, verified: true, status: 'success', reference, simulated: true };
  }

  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: { Authorization: `Bearer ${PAYSTACK_SECRET_KEY}` }
      }
    );

    if (response.data && response.data.status && response.data.data.status === 'success') {
      return {
        success: true,
        verified: true,
        status: 'success',
        amountPaid: response.data.data.amount / 100,
        currency: response.data.data.currency,
        reference
      };
    }

    return {
      success: false,
      verified: false,
      status: response.data?.data?.status || 'failed'
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  COUNTRY_CONFIGS,
  DEFAULT_RATES,
  getExchangeRates,
  calculateLocalAmount,
  initializePaystackPayment,
  verifyPaystackPayment
};
