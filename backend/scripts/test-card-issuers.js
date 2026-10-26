/**
 * Exercises per-country card issuer dispatch, card controls and the float ledger without a
 * database or network. Run with: npm run test:issuers
 */

// Start from a clean slate: no issuer env vars, no simulation
for (const key of Object.keys(process.env)) {
  if (/^(CARD_ISSUER_|SUDO_|MAPLERAD_|FLOAT_LOW_BALANCE_USD)/.test(key)) delete process.env[key];
}
delete process.env.CARD_SIMULATION;

const assert = require('node:assert/strict');
const axios = require('axios');
const cardIssuers = require('../utils/cardIssuers');
const { issueVirtualCard } = require('../utils/cardProviderService');
const { closeExpiredCard } = require('../utils/cronJobs');
const SqlFloatEntry = require('../models/FloatEntry');
const cardFloatService = require('../utils/cardFloatService');

// A fake API issuer, standing in for any new provider adapter
const calls = [];
cardIssuers.registerIssuer({
  name: 'mockapi',
  isApi: true,
  credentialsFrom: (env, cc) => ({ key: env[`MOCKAPI_KEY_${cc}`] }),
  isConfigured: (creds) => Boolean(creds.key),
  issue: async ({ amountUsd }, creds) => {
    calls.push(['issue', creds.key, amountUsd]);
    return { success: true, cardId: 'mock-card-1', cardNumber: '4111111111111111', cardholderName: 'TEST', expiryDate: '01/30', cvv: '123' };
  },
  setFrozen: async (cardId, frozen, creds) => { calls.push(['freeze', creds.key, cardId, frozen]); return { success: true }; },
  terminate: async (cardId, creds) => {
    calls.push(['terminate', creds.key, cardId]);
    return { success: cardId !== 'fails' };
  }
});

// In-memory float ledger in place of the database
const ledger = [];
SqlFloatEntry.create = async (data) => { const row = { id: ledger.length + 1, ...data }; ledger.push(row); return row; };
SqlFloatEntry.findOne = async ({ where }) => ledger.find((r) => Object.entries(where).every(([k, v]) => r[k] === v)) || null;
SqlFloatEntry.findAll = async () => [...ledger];

const tests = [];
const test = (name, fn) => tests.push([name, fn]);
const withEnv = async (vars, fn) => {
  Object.assign(process.env, vars);
  try { return await fn(); } finally { Object.keys(vars).forEach((k) => delete process.env[k]); }
};

test('GH and NG default to manual and return success:false', async () => {
  for (const country of ['GH', 'NG']) {
    assert.equal(cardIssuers.resolveCountryIssuer(country).issuer, 'manual');
    const card = await issueVirtualCard({ studentName: 'Ama Mensah', amountUsd: 100, country });
    assert.equal(card.success, false);
    assert.equal(card.issuer, 'manual');
    assert.equal(card.country, country);
  }
});

test('explicit CARD_ISSUER_GH=manual stays manual', async () => {
  await withEnv({ CARD_ISSUER_GH: 'manual' }, async () => {
    const card = await issueVirtualCard({ studentName: 'Kwame', amountUsd: 50, country: 'GH' });
    assert.equal(card.success, false);
  });
});

test('NG on an API adapter issues there while GH stays manual', async () => {
  await withEnv({ CARD_ISSUER_NG: 'mockapi', MOCKAPI_KEY_NG: 'ng-key' }, async () => {
    calls.length = 0;
    const ng = await issueVirtualCard({ studentName: 'Chidi Okafor', amountUsd: 200, country: 'NG' });
    assert.equal(ng.success, true);
    assert.equal(ng.issuer, 'mockapi');
    assert.equal(ng.cardId, 'mock-card-1');
    assert.deepEqual(calls, [['issue', 'ng-key', 200]]);

    const gh = await issueVirtualCard({ studentName: 'Ama', amountUsd: 200, country: 'GH' });
    assert.equal(gh.success, false);
    assert.equal(gh.issuer, 'manual');
  });
});

test('an explicit API issuer without that country\'s keys falls back to manual', async () => {
  await withEnv({ CARD_ISSUER_NG: 'sudo', SUDO_API_KEY: 'global-key' }, async () => {
    const resolved = cardIssuers.resolveCountryIssuer('NG');
    assert.equal(resolved.candidates.length, 0);
    const card = await issueVirtualCard({ studentName: 'Chidi', amountUsd: 10, country: 'NG' });
    assert.equal(card.success, false);
  });
});

test('unknown issuer name falls back to manual', async () => {
  await withEnv({ CARD_ISSUER_GH: 'nosuchbank' }, async () => {
    assert.equal(cardIssuers.resolveCountryIssuer('GH').issuer, 'manual');
  });
});

test('no CARD_ISSUER_* but legacy global keys keeps today\'s Sudo -> Maplerad chain', async () => {
  await withEnv({ SUDO_API_KEY: 'global-sudo', MAPLERAD_SECRET_KEY: 'global-maple' }, async () => {
    const resolved = cardIssuers.resolveCountryIssuer('NG');
    assert.deepEqual(resolved.candidates.map((c) => c.adapter.name), ['sudo', 'maplerad']);
    assert.equal(resolved.source, 'global keys');
  });
});

test('CARD_ISSUER_NG=sudo uses SUDO_API_KEY_NG against the Sudo API', async () => {
  const originalPost = axios.post;
  const seen = [];
  axios.post = async (url, body, { headers }) => {
    seen.push([url, headers.Authorization]);
    if (url.endsWith('/customers')) return { data: { data: { _id: 'cust-1' } } };
    return { data: { data: { _id: 'sudo-card-9', pan: '5399000000000000', expiryMonth: '07', expiryYear: 2029, cvv: '999', status: 'active' } } };
  };
  try {
    await withEnv({ CARD_ISSUER_NG: 'sudo', SUDO_API_KEY_NG: 'ng-sudo', SUDO_ENV_NG: 'live' }, async () => {
      const card = await issueVirtualCard({ studentName: 'Ngozi Eze', amountUsd: 75, country: 'NG' });
      assert.equal(card.success, true);
      assert.equal(card.issuer, 'sudo');
      assert.equal(card.cardId, 'sudo-card-9');
      assert.deepEqual(seen.map((s) => s[1]), ['Bearer ng-sudo', 'Bearer ng-sudo']);
      assert.ok(seen[0][0].startsWith('https://api.sudo.africa/'));
    });
  } finally {
    axios.post = originalPost;
  }
});

test('freeze and terminate go to the provider for API cards, not for manual ones', async () => {
  await withEnv({ MOCKAPI_KEY_NG: 'ng-key' }, async () => {
    calls.length = 0;
    const apiCard = { issuer: 'mockapi', providerCardId: 'mock-card-1', country: 'NG' };
    assert.equal((await cardIssuers.setCardFrozen(apiCard, true)).success, true);
    assert.equal((await cardIssuers.terminateCard(apiCard)).success, true);
    assert.deepEqual(calls, [['freeze', 'ng-key', 'mock-card-1', true], ['terminate', 'ng-key', 'mock-card-1']]);

    const manualCard = { issuer: 'manual', country: 'GH' };
    assert.equal(cardIssuers.isApiIssuer('manual'), false);
    assert.equal((await cardIssuers.setCardFrozen(manualCard, true)).manual, true);
  });
});

test('expiry closes API cards and flags manual (or failed) ones for manual close', async () => {
  await withEnv({ MOCKAPI_KEY_GH: 'gh-key' }, async () => {
    const apiCard = { issuer: 'mockapi', providerCardId: 'ok', country: 'GH', status: 'assigned' };
    assert.equal(await closeExpiredCard(apiCard), 'terminated');
    assert.equal(apiCard.cardStatus, 'terminated');
    assert.equal(apiCard.needsManualClose, false);

    const failing = { issuer: 'mockapi', providerCardId: 'fails', country: 'GH', status: 'assigned' };
    assert.equal(await closeExpiredCard(failing), 'flagged');
    assert.equal(failing.needsManualClose, true);

    const manualCard = { issuer: 'manual', country: 'GH', status: 'assigned' };
    await closeExpiredCard(manualCard);
    assert.equal(manualCard.status, 'expired');
    assert.equal(manualCard.needsManualClose, true);

    const simulated = { issuer: 'simulation', country: 'GH', status: 'assigned' };
    await closeExpiredCard(simulated);
    assert.notEqual(simulated.needsManualClose, true);
  });
});

test('float: top-ups credit, cards debit once, balances stay per country', async () => {
  ledger.length = 0;
  await cardFloatService.recordTopUp({ country: 'GH', amountUsd: 1000, note: 'Initial GH float' });
  await cardFloatService.recordTopUp({ country: 'NG', amountUsd: 600 });
  const ghCard = { id: 1, requestToken: 'GH1', country: 'GH', amount: 300, issuer: 'manual' };
  await cardFloatService.debitForCard(ghCard);
  await cardFloatService.debitForCard(ghCard); // repeated save must not double-debit
  await cardFloatService.debitForCard({ id: 2, country: 'NG', amount: 250, issuer: 'mockapi' });
  await cardFloatService.debitForCard({ id: 3, country: 'NG', amount: 999, issuer: 'simulation' });

  const [gh, ng] = await cardFloatService.getFloatSummary();
  assert.equal(gh.balance, 700);
  assert.equal(gh.lowBalance, false);
  assert.equal(ng.balance, 350);
  assert.equal(ng.lowBalance, true); // default threshold is $500

  await withEnv({ FLOAT_LOW_BALANCE_USD_NG: '100' }, async () => {
    const [ngAgain] = await cardFloatService.getFloatSummary('NG');
    assert.equal(ngAgain.lowBalance, false);
  });
});

(async () => {
  let failed = 0;
  for (const [name, fn] of tests) {
    try {
      await fn();
      console.log(`✓ ${name}`);
    } catch (err) {
      failed += 1;
      console.error(`✗ ${name}\n  ${err.stack}`);
    }
  }
  console.log(failed ? `\n${failed} of ${tests.length} failed` : `\nAll ${tests.length} passed`);
  process.exit(failed ? 1 : 0);
})();
