import { ALLOWED_UNITS, DEFAULT_CHECK_IN_TIME, DEFAULT_CHECK_OUT_TIME, isAllowedUnitSlug } from '../lib/units';
import { getInvoiceStayMetadata } from '../lib/invoiceMetadata';

if (ALLOWED_UNITS.map((unit) => unit.slug).join(',') !== '1bhk,4bhk,5bhk') {
  throw new Error('Allowed unit catalog must contain only 1bhk, 4bhk, and 5bhk');
}
if (!isAllowedUnitSlug('1bhk') || !isAllowedUnitSlug('4bhk') || !isAllowedUnitSlug('5bhk')) {
  throw new Error('Approved units should be accepted');
}
if (isAllowedUnitSlug('test-unit') || isAllowedUnitSlug('2bhk')) {
  throw new Error('Arbitrary units should be rejected');
}

const reservation = { reservationNumber: 'RES-1', checkInDate: '2026-09-08', checkOutDate: '2026-09-09' };
const withUnit = getInvoiceStayMetadata(reservation, { id: 'u1', displayName: '5BHK', defaultCheckInTime: null, defaultCheckOutTime: null });
if (withUnit.unitDisplayName !== '5BHK' || withUnit.checkInTime !== DEFAULT_CHECK_IN_TIME || withUnit.checkOutTime !== DEFAULT_CHECK_OUT_TIME) {
  throw new Error(`Unexpected configured metadata: ${JSON.stringify(withUnit)}`);
}

const legacy = getInvoiceStayMetadata(reservation, null);
if (legacy.unitDisplayName !== 'Unit' || legacy.checkInTime !== DEFAULT_CHECK_IN_TIME || legacy.checkOutTime !== DEFAULT_CHECK_OUT_TIME) {
  throw new Error(`Unexpected legacy fallback metadata: ${JSON.stringify(legacy)}`);
}

console.log('Approved invoice flow regression tests passed');
