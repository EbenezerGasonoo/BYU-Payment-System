/**
 * Automated USD Virtual Card Issuing Provider Engine
 * Dispatches to each country's issuer (utils/cardIssuers), with an ISO mock fallback for simulation only
 */

const cardIssuers = require('./cardIssuers');
const sudoIssuer = require('./cardIssuers/sudo');

// Fake card numbers are only allowed when explicitly enabled (never in production)
const CARD_SIMULATION_ENABLED = process.env.CARD_SIMULATION === 'true';

/**
 * Generate ISO-compliant Visa Virtual Card Details
 */
function generateMockVirtualCard(cardholderName, amountUsd) {
  // ISO 7812 Visa BIN prefix for West African Virtual USD Cards: 4124 55
  const bin = '412455';
  const middle = Math.floor(10000000 + Math.random() * 90000000).toString();
  
  // Luhn algorithm check digit generator
  const rawNumber = bin + middle;
  let sum = 0;
  let alternate = false;
  for (let i = rawNumber.length - 1; i >= 0; i--) {
    let n = parseInt(rawNumber.charAt(i), 10);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  const cardNumber = rawNumber + checkDigit.toString();

  const now = new Date();
  const expiryYear = (now.getFullYear() + 3).toString().slice(-2);
  const expiryMonth = (now.getMonth() + 1).toString().padStart(2, '0');
  const expiryDate = `${expiryMonth}/${expiryYear}`;

  const cvv = Math.floor(100 + Math.random() * 900).toString();

  return {
    cardNumber,
    cardholderName: cardholderName || 'ConnectPay Student',
    expiryDate,
    cvv,
    brand: 'VISA',
    cardType: 'VIRTUAL',
    currency: 'USD',
    balance: parseFloat(amountUsd) || 0.00,
    status: 'active'
  };
}

/**
 * Issue a Virtual USD Card via Sudo Africa API with the global keys (kept for existing callers)
 */
const issueVirtualCardWithSudo = (details) =>
  sudoIssuer.issue(details, sudoIssuer.credentialsFrom(process.env, 'GH', { allowGlobal: true }));

/**
 * Freeze or Unfreeze a Sudo Africa Virtual Card with the global keys (kept for existing callers)
 */
async function updateSudoCardStatus(cardId, status) {
  const creds = sudoIssuer.credentialsFrom(process.env, 'GH', { allowGlobal: true });
  if (!sudoIssuer.isConfigured(creds)) return { success: false, message: 'Sudo API key not set' };
  return sudoIssuer.setFrozen(cardId, status === 'frozen' || status === 'inactive', creds);
}

/**
 * Issue a Virtual USD Card automatically upon verified payment, through the issuer
 * configured for the request's country (see utils/cardIssuers)
 */
async function issueVirtualCard({ studentName, amountUsd, email, cardRequestId, country }) {
  const { country: cc, candidates } = cardIssuers.resolveCountryIssuer(country);

  // 1. Try the country's API issuer(s) in order
  for (const { adapter, creds } of candidates) {
    try {
      console.log(`💳 Issuing USD Virtual Card for ${cc} via ${adapter.name}...`);
      const card = await adapter.issue({ studentName, amountUsd, email, cardRequestId }, creds);
      if (card && card.success) {
        return { ...card, issuer: adapter.name, country: cc };
      }
    } catch (err) {
      console.warn(`⚠️ ${adapter.name} issuing failed for ${cc}, trying next option:`, err.message);
    }
  }

  // 2. No real provider issued a card: leave the request for an admin to assign manually
  if (!CARD_SIMULATION_ENABLED) {
    return { success: false, issuer: 'manual', country: cc, message: 'No card provider available; card must be assigned manually' };
  }

  // 3. Simulation only: generate a fake ISO-compliant test card
  const mockCard = generateMockVirtualCard(studentName, amountUsd);
  return {
    success: true,
    provider: 'auto-issuing-engine',
    issuer: 'simulation',
    country: cc,
    cardNumber: mockCard.cardNumber,
    cardholderName: mockCard.cardholderName,
    expiryDate: mockCard.expiryDate,
    cvv: mockCard.cvv,
    status: 'active'
  };
}

module.exports = {
  CARD_SIMULATION_ENABLED,
  generateMockVirtualCard,
  issueVirtualCardWithSudo,
  updateSudoCardStatus,
  issueVirtualCard
};
