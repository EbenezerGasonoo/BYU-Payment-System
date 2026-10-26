/**
 * Per-country card issuer registry.
 *
 * Each pilot country picks its issuer with CARD_ISSUER_<CC> (e.g. CARD_ISSUER_GH=manual,
 * CARD_ISSUER_NG=sudo) and its own credentials (e.g. SUDO_API_KEY_NG). An adapter only has to
 * implement issue / setFrozen / terminate, so a new provider (Fyatu, UfitPay, Miden, a bank)
 * is one new file registered below.
 *
 * When CARD_ISSUER_<CC> is not set the country keeps today's behaviour: try Sudo then Maplerad
 * with the global SUDO_API_KEY / MAPLERAD_SECRET_KEY, and fall back to manual assignment.
 */

const manual = require('./manual');
const sudo = require('./sudo');
const maplerad = require('./maplerad');

const adapters = new Map();
const registerIssuer = (adapter) => adapters.set(adapter.name, adapter);
[manual, sudo, maplerad].forEach(registerIssuer);

// Order the legacy global keys were tried in before issuers were chosen per country
const LEGACY_CHAIN = ['sudo', 'maplerad'];

const countryCode = (country) => String(country || 'GH').toUpperCase();

/**
 * Which issuer(s) to try for a country, with credentials already resolved.
 * Returns { country, issuer, source, candidates: [{ adapter, creds }] }.
 */
function resolveCountryIssuer(country, env = process.env) {
  const cc = countryCode(country);
  const explicit = String(env[`CARD_ISSUER_${cc}`] || '').trim().toLowerCase();

  if (explicit) {
    const adapter = adapters.get(explicit);
    if (!adapter) {
      console.warn(`⚠️ CARD_ISSUER_${cc}=${explicit} is not a known issuer; using manual assignment`);
      return { country: cc, issuer: 'manual', source: `CARD_ISSUER_${cc}`, candidates: [] };
    }
    // An explicitly chosen API issuer must have this country's own keys, never another country's
    const creds = adapter.credentialsFrom(env, cc, { allowGlobal: false });
    const candidates = adapter.isApi && adapter.isConfigured(creds) ? [{ adapter, creds }] : [];
    if (adapter.isApi && candidates.length === 0) {
      console.warn(`⚠️ CARD_ISSUER_${cc}=${explicit} has no credentials for ${cc}; using manual assignment`);
    }
    return { country: cc, issuer: adapter.name, source: `CARD_ISSUER_${cc}`, candidates };
  }

  const candidates = LEGACY_CHAIN
    .map((name) => adapters.get(name))
    .map((adapter) => ({ adapter, creds: adapter.credentialsFrom(env, cc, { allowGlobal: true }) }))
    .filter(({ adapter, creds }) => adapter.isConfigured(creds));
  return {
    country: cc,
    issuer: candidates.length ? candidates.map((c) => c.adapter.name).join('+') : 'manual',
    source: candidates.length ? 'global keys' : 'default',
    candidates
  };
}

/** True when cards issued by this issuer name can be frozen/closed through an API */
const isApiIssuer = (issuerName) => Boolean(adapters.get(issuerName)?.isApi);

/** Adapter + credentials for controlling an existing card, from the issuer that issued it */
function controlsFor(cardRequest, env = process.env) {
  const adapter = adapters.get(cardRequest.issuer);
  if (!adapter || !adapter.isApi || !cardRequest.providerCardId) return null;
  const creds = adapter.credentialsFrom(env, countryCode(cardRequest.country), { allowGlobal: true });
  return adapter.isConfigured(creds) ? { adapter, creds } : null;
}

async function setCardFrozen(cardRequest, frozen, env = process.env) {
  const controls = controlsFor(cardRequest, env);
  if (!controls) return { success: false, manual: true };
  return controls.adapter.setFrozen(cardRequest.providerCardId, frozen, controls.creds);
}

async function terminateCard(cardRequest, env = process.env) {
  const controls = controlsFor(cardRequest, env);
  if (!controls) return { success: false, manual: true };
  return controls.adapter.terminate(cardRequest.providerCardId, controls.creds);
}

module.exports = {
  registerIssuer,
  getIssuer: (name) => adapters.get(name),
  resolveCountryIssuer,
  isApiIssuer,
  setCardFrozen,
  terminateCard
};
