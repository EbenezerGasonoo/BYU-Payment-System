/**
 * Checks that Sequelize-style `where` clauses translate to the right MongoDB filters.
 * Run: node scripts/test-mongo-where.js   (no database needed)
 */
const assert = require('node:assert/strict');
const { Op } = require('sequelize');
const { translateWhere } = require('../models/mongoAdapter');

const tests = [];
const test = (name, fn) => tests.push({ name, fn });

test('Op.in becomes $in (the open-request check in request-card)', () => {
  assert.deepEqual(
    translateWhere({
      studentId: 'abc',
      status: { [Op.in]: ['pending', 'assigned'] },
      paymentStatus: { [Op.in]: ['unpaid', 'pending'] }
    }),
    {
      studentId: 'abc',
      status: { $in: ['pending', 'assigned'] },
      paymentStatus: { $in: ['unpaid', 'pending'] }
    }
  );
});

test('Op.lte stays $lte (card expiry job), not $lt', () => {
  const now = new Date('2026-10-26T12:00:00Z');
  assert.deepEqual(
    translateWhere({ status: 'assigned', expiresAt: { [Op.lte]: now } }),
    { status: 'assigned', expiresAt: { $lte: now } }
  );
});

test('Op.gte stays $gte, not $gt', () => {
  const d = new Date('2026-01-01T00:00:00Z');
  assert.deepEqual(translateWhere({ createdAt: { [Op.gte]: d } }), { createdAt: { $gte: d } });
});

test('several operators on one field are combined', () => {
  const a = new Date('2026-01-01T00:00:00Z');
  const b = new Date('2026-02-01T00:00:00Z');
  assert.deepEqual(
    translateWhere({ createdAt: { [Op.gte]: a, [Op.lt]: b } }),
    { createdAt: { $gte: a, $lt: b } }
  );
});

test('Op.ne, Op.gt, Op.notIn and Op.eq map directly', () => {
  assert.deepEqual(
    translateWhere({ status: { [Op.ne]: 'deleted' }, amount: { [Op.gt]: 0 }, currency: { [Op.notIn]: ['XOF'] }, byuId: { [Op.eq]: '1' } }),
    { status: { $ne: 'deleted' }, amount: { $gt: 0 }, currency: { $nin: ['XOF'] }, byuId: { $eq: '1' } }
  );
});

test('top-level Op.or is translated recursively', () => {
  assert.deepEqual(
    translateWhere({ [Op.or]: [{ byuId: '1234567' }, { email: 'a@byupathway.edu' }], status: { [Op.ne]: 'deleted' } }),
    { status: { $ne: 'deleted' }, $or: [{ byuId: '1234567' }, { email: 'a@byupathway.edu' }] }
  );
});

test('a Date value is kept as an equality, not treated as operators', () => {
  const d = new Date('2026-03-03T00:00:00Z');
  assert.deepEqual(translateWhere({ paidAt: d }), { paidAt: d });
});

test('id maps to _id', () => {
  assert.deepEqual(translateWhere({ id: 'x1' }), { _id: 'x1' });
});

test('an unsupported operator throws instead of silently matching everything', () => {
  assert.throws(() => translateWhere({ name: { [Op.like]: '%a%' } }), /Unsupported query operator "like"/);
});

let failed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`✓ ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`✗ ${name}\n  ${err.message}`);
  }
}
console.log(failed ? `\n${failed} failed` : `\nAll ${tests.length} passed`);
process.exit(failed ? 1 : 0);
