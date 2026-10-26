/**
 * Per-country USD card float ledger.
 * Admins record top-ups to each country's float; every real card assigned or issued debits it.
 * The balance is the sum of the country's entries (top-ups positive, debits negative).
 */

const { FloatEntry } = require('../models');
const { STUDENT_COUNTRIES } = require('./paymentGatewayService');

const DEFAULT_LOW_BALANCE_USD = 500;

const countryOf = (value) => String(value || 'GH').toUpperCase();
const round2 = (n) => Math.round(Number(n || 0) * 100) / 100;

function lowBalanceThreshold(country, env = process.env) {
  const raw = env[`FLOAT_LOW_BALANCE_USD_${country}`] ?? env.FLOAT_LOW_BALANCE_USD;
  const value = Number(raw);
  return raw !== undefined && raw !== '' && Number.isFinite(value) ? value : DEFAULT_LOW_BALANCE_USD;
}

async function recordTopUp({ country, amountUsd, entryDate, note }) {
  return FloatEntry.create({
    country: countryOf(country),
    type: 'topup',
    amountUsd: round2(amountUsd),
    entryDate: entryDate ? new Date(entryDate) : new Date(),
    note: String(note || '').slice(0, 255)
  });
}

/**
 * Debit the float of the request's country for the card's USD amount, once per request.
 * Simulated (fake) cards carry no real money and are never debited.
 */
async function debitForCard(cardRequest) {
  if (!cardRequest || cardRequest.issuer === 'simulation') return null;
  const cardRequestId = String(cardRequest._id || cardRequest.id);
  const existing = await FloatEntry.findOne({ where: { cardRequestId, type: 'debit' } });
  if (existing) return existing;

  return FloatEntry.create({
    country: countryOf(cardRequest.country),
    type: 'debit',
    amountUsd: -round2(cardRequest.amount),
    entryDate: new Date(),
    note: `Card for request ${cardRequest.requestToken || cardRequestId} (${cardRequest.issuer || 'manual'})`,
    cardRequestId
  });
}

/** Never let a ledger write failure undo a card that was already given to a student */
async function safeDebitForCard(cardRequest) {
  try {
    return await debitForCard(cardRequest);
  } catch (err) {
    console.error('⚠️ Could not debit card float:', err.message);
    return null;
  }
}

/** Balance and recent entries for each pilot country (or just `onlyCountry`) */
async function getFloatSummary(onlyCountry, { recent = 20 } = {}) {
  const entries = await FloatEntry.findAll({ order: [['entryDate', 'DESC']] });
  const countries = onlyCountry ? [countryOf(onlyCountry)] : STUDENT_COUNTRIES;

  return countries.map((country) => {
    const mine = entries.filter((e) => countryOf(e.country) === country);
    const toppedUp = mine.filter((e) => e.type === 'topup').reduce((s, e) => s + Number(e.amountUsd || 0), 0);
    const debited = mine.filter((e) => e.type === 'debit').reduce((s, e) => s - Number(e.amountUsd || 0), 0);
    const balance = round2(toppedUp - debited);
    const threshold = lowBalanceThreshold(country);
    return {
      country,
      balance,
      toppedUp: round2(toppedUp),
      debited: round2(debited),
      lowBalanceThreshold: threshold,
      lowBalance: balance < threshold,
      entries: mine.slice(0, recent)
    };
  });
}

module.exports = {
  DEFAULT_LOW_BALANCE_USD,
  lowBalanceThreshold,
  recordTopUp,
  debitForCard,
  safeDebitForCard,
  getFloatSummary
};
