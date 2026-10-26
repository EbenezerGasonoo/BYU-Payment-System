/**
 * Shows that an admin cannot assign a card before the payment is confirmed, and can after
 * confirming a manual Mobile Money payment. No database or network. Run with: npm run test:payment-gate
 */

process.env.ADMIN_KEY = 'test-admin-key';
delete process.env.CARD_SIMULATION;

const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');

// Stub side effects before the routes pick them up
const emailService = require('../utils/emailService');
const notified = [];
emailService.notifyStudentCardAssigned = async (student, request) => { notified.push(request.id); };
const cardFloatService = require('../utils/cardFloatService');
const debited = [];
cardFloatService.safeDebitForCard = async (request) => { debited.push(request.id); };

// In-memory card requests in place of the database
const SqlCardRequest = require('../models/CardRequest');
const rows = new Map();
const makeRequest = (data) => {
  const row = {
    status: 'pending',
    paymentStatus: 'pending',
    country: 'GH',
    currency: 'GHS',
    student: { name: 'Ama Mensah', countryCode: 'GH' },
    ...data,
    async save() { return this; },
    toJSON() { const { save, toJSON, ...rest } = this; return rest; }
  };
  rows.set(String(row.id), row);
  return row;
};
SqlCardRequest.findByPk = async (id) => rows.get(String(id)) || null;

const adminRoutes = require('../routes/adminRoutes');
const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);

let port;
const post = (path, body) => new Promise((resolve, reject) => {
  const req = http.request({
    port,
    path: `/api/admin${path}`,
    method: 'POST',
    agent: false,
    headers: { 'Content-Type': 'application/json', 'x-admin-key': process.env.ADMIN_KEY }
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
  });
  req.on('error', reject);
  req.end(JSON.stringify(body));
});
const card = { cardNumber: '4111 1111 1111 1111', cardholderName: 'AMA MENSAH', expiryDate: '12/28', cvv: '123' };

const tests = [];
const test = (name, fn) => tests.push([name, fn]);

test('assign is refused while the payment is unconfirmed', async () => {
  for (const paymentStatus of ['unpaid', 'pending', 'failed']) {
    const r = makeRequest({ id: `unpaid-${paymentStatus}`, paymentStatus, amount: 100, amountLocal: 1600 });
    const res = await post('/assign', { requestId: r.id, ...card });
    assert.equal(res.status, 409);
    assert.equal(res.body.code, 'PAYMENT_NOT_CONFIRMED');
    assert.equal(r.status, 'pending');
    assert.equal(r.virtualCardNumber, undefined);
  }
  assert.deepEqual(debited, []);
  assert.deepEqual(notified, []);
});

test('confirming a manual payment marks it paid and keeps the request pending', async () => {
  const r = makeRequest({ id: 'manual-1', amount: 100, amountLocal: 1600 });
  const res = await post(`/requests/${r.id}/confirm-payment`, { reference: ' MP2610.1234.A ', note: 'Checked MoMo statement' });
  assert.equal(res.status, 200);
  assert.equal(r.paymentStatus, 'paid');
  assert.equal(r.paymentMethod, 'momo-manual');
  assert.equal(r.status, 'pending');
  assert.equal(r.manualPaymentReference, 'MP2610.1234.A');
  assert.equal(r.paymentNote, 'Checked MoMo statement');
  assert.ok(r.paymentVerifiedAt instanceof Date);

  const again = await post(`/requests/${r.id}/confirm-payment`, {});
  assert.equal(again.status, 409);
});

test('assign is allowed once the payment is confirmed', async () => {
  const r = rows.get('manual-1');
  const res = await post('/assign', { requestId: r.id, ...card });
  assert.equal(res.status, 200);
  assert.equal(r.status, 'assigned');
  assert.equal(r.paymentStatus, 'paid');
  assert.deepEqual(debited, ['manual-1']);
});

test('gateway-confirmed payments can be assigned as before', async () => {
  const r = makeRequest({ id: 'paystack-1', paymentStatus: 'paid', paymentMethod: 'paystack', amount: 50 });
  const res = await post('/assign', { requestId: r.id, ...card });
  assert.equal(res.status, 200);
  assert.equal(r.status, 'assigned');
});

test('confirm-payment refuses declined requests', async () => {
  const r = makeRequest({ id: 'declined-1', status: 'declined' });
  const res = await post(`/requests/${r.id}/confirm-payment`, {});
  assert.equal(res.status, 409);
  assert.equal(r.paymentStatus, 'pending');
});

(async () => {
  const server = app.listen(0);
  port = server.address().port;
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
  server.close();
  console.log(failed ? `\n${failed} failed` : `\nAll ${tests.length} passed`);
  process.exit(failed ? 1 : 0);
})();
