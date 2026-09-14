import assert from 'node:assert/strict';
import { formatDateForDisplay, formatPrice, monthRange, nextIsoDate, parseDisplayDate, validatePriceInput } from '../lib/pricing-core';

assert.deepEqual(monthRange('2026-02'), { month: '2026-02', start: '2026-02-01', end: '2026-02-28' });
assert.equal(formatPrice(125000), '₹1,250');
assert.equal(formatPrice(0), null);
assert.equal(formatDateForDisplay('2026-09-11'), '11-09-2026');
assert.equal(parseDisplayDate('19-09-2026'), '2026-09-19');
assert.equal(parseDisplayDate('31-02-2026'), null);
assert.equal(nextIsoDate('2026-09-15'), '2026-09-16');
assert.equal(nextIsoDate('2026-09-30'), '2026-10-01');
assert.equal(nextIsoDate('2026-12-31'), '2027-01-01');
assert.equal(nextIsoDate('2026-02-30'), null);
assert.deepEqual(validatePriceInput({ unitId: 'unit-1', date: '2026-09-11', amountMinorUnits: 250000, rateCode: 'standard', currency: 'INR' }).amountMinorUnits, 250000);
assert.throws(() => monthRange('2026-13'));
assert.throws(() => validatePriceInput({ unitId: 'unit-1', date: '2026-02-30', amountMinorUnits: 250000, rateCode: 'standard', currency: 'INR' }));
assert.throws(() => validatePriceInput({ unitId: 'unit-1', date: '2026-09-11', amountMinorUnits: 0, rateCode: 'standard', currency: 'INR' }));
console.log('pricing tests passed');
