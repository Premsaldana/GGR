import { ALLOWED_UNITS, DEFAULT_CHECK_IN_TIME, DEFAULT_CHECK_OUT_TIME, getCanonicalRoomType, isAllowedUnitSlug } from '../lib/units';
import { getInvoiceStayMetadata } from '../lib/invoiceMetadata';

if (ALLOWED_UNITS.map((unit) => unit.slug).join(',') !== 'private-pool-villa') {
  throw new Error('Allowed unit catalog must contain only private-pool-villa');
}
if (!isAllowedUnitSlug('private-pool-villa')) {
  throw new Error('Private Pool Villa must be an allowed unit');
}
if (isAllowedUnitSlug('test-unit') || isAllowedUnitSlug('legacy-room')) {
  throw new Error('Legacy or arbitrary units should be rejected');
}
if (getCanonicalRoomType({ slug: 'private-pool-villa', displayName: 'Private Pool Villa' }) !== 'Private Pool Villa') {
  throw new Error('Private Pool Villa canonicalization failed');
}
if (getCanonicalRoomType({ slug: 'legacy-room', displayName: 'Legacy room' }) !== null) {
  throw new Error('Legacy room labels should not map to an active room type');
}

const reservation = { reservationNumber: 'RES-1', checkInDate: '2026-09-08', checkOutDate: '2026-09-09' };
const withUnit = getInvoiceStayMetadata(reservation, { id: 'u1', displayName: 'Private Pool Villa', defaultCheckInTime: null, defaultCheckOutTime: null });
if (withUnit.unitDisplayName !== 'Private Pool Villa' || withUnit.checkInTime !== DEFAULT_CHECK_IN_TIME || withUnit.checkOutTime !== DEFAULT_CHECK_OUT_TIME) {
  throw new Error(`Unexpected configured metadata: ${JSON.stringify(withUnit)}`);
}

const legacy = getInvoiceStayMetadata(reservation, null);
if (legacy.unitDisplayName !== 'Unit' || legacy.checkInTime !== DEFAULT_CHECK_IN_TIME || legacy.checkOutTime !== DEFAULT_CHECK_OUT_TIME) {
  throw new Error(`Unexpected legacy fallback metadata: ${JSON.stringify(legacy)}`);
}

console.log('Single-villa invoice flow regression tests passed');
