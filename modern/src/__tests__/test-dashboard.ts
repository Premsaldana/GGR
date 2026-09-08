import { buildDashboardSnapshot, getDateKeyInTimeZone } from '../app/admin/(protected)/dashboard-model';
import { hasResortBookingConflict, isBookableResortUnitSlug } from '../lib/resort-inventory';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`✓ ${message}`);
    passed += 1;
    return;
  }

  console.error(`✗ ${message}`);
  failed += 1;
}

const now = new Date('2026-09-07T20:00:00.000Z');
const reservation = (overrides: Partial<{
  id: string;
  reservationNumber: string;
  checkInDate: string;
  checkOutDate: string;
  bookingStatus: string;
  paymentStatus: string;
  adults: number;
  children: number;
  guestName: string;
  unitName: string;
}> = {}) => ({
  id: 'current',
  reservationNumber: 'RES-CURRENT',
  checkInDate: '2026-09-07',
  checkOutDate: '2026-09-09',
  bookingStatus: 'confirmed',
  paymentStatus: 'partially_paid',
  adults: 2,
  children: 1,
  guestName: 'Current Guest',
  unitName: 'Entire 5-Bedroom Private Resort',
  ...overrides,
});

const reservations = [
  reservation(),
  reservation({
    id: 'arrival',
    reservationNumber: 'RES-ARRIVAL',
    checkInDate: '2026-09-08',
    checkOutDate: '2026-09-10',
    adults: 4,
    children: 0,
    guestName: 'Arrival Guest',
  }),
  reservation({
    id: 'departure',
    reservationNumber: 'RES-DEPARTURE',
    checkInDate: '2026-09-06',
    checkOutDate: '2026-09-08',
    adults: 2,
    children: 0,
    guestName: 'Departure Guest',
  }),
  reservation({
    id: 'pending',
    reservationNumber: 'RES-PENDING',
    checkInDate: '2026-09-11',
    checkOutDate: '2026-09-13',
    bookingStatus: 'pending',
    adults: 6,
    children: 1,
    guestName: 'Pending Guest',
  }),
  reservation({
    id: 'cancelled',
    reservationNumber: 'RES-CANCELLED',
    checkInDate: '2026-09-08',
    checkOutDate: '2026-09-12',
    bookingStatus: 'cancelled',
    adults: 20,
    children: 0,
    guestName: 'Cancelled Guest',
  }),
];

const snapshot = buildDashboardSnapshot({
  reservations,
  invoices: [
    { id: 'invoice-old', reservationId: 'current', version: 1, status: 'issued', totalMinorUnits: 600_000, advanceMinorUnits: 100_000, createdAt: new Date('2026-09-01T00:00:00Z') },
    { id: 'invoice-current', reservationId: 'current', version: 2, status: 'issued', totalMinorUnits: 500_000, advanceMinorUnits: 100_000, createdAt: new Date('2026-09-02T00:00:00Z') },
    { id: 'invoice-arrival', reservationId: 'arrival', version: 1, status: 'issued', totalMinorUnits: 200_000, advanceMinorUnits: 0, createdAt: new Date('2026-09-03T00:00:00Z') },
    { id: 'invoice-cancelled', reservationId: 'cancelled', version: 1, status: 'issued', totalMinorUnits: 999_000, advanceMinorUnits: 0, createdAt: new Date('2026-09-04T00:00:00Z') },
  ],
  proofs: [
    { id: 'proof-pending', invoiceId: 'invoice-current', status: 'pending_review', verifiedAmountMinorUnits: null, paymentReference: null, submittedAt: new Date('2026-09-07T18:00:00Z') },
    { id: 'proof-reviewed', invoiceId: 'invoice-arrival', status: 'verified', verifiedAmountMinorUnits: 100_000, paymentReference: 'UPI-ARRIVAL', submittedAt: new Date('2026-09-07T17:00:00Z') },
  ],
  payments: [
    { id: 'payment-current', invoiceId: 'invoice-current', amountMinorUnits: 100_000, paymentStatus: 'completed', reference: 'UPI-CURRENT' },
  ],
  auditEvents: [
    { id: 'audit-payment', entityType: 'invoice_payment', entityId: 'payment-current', eventType: 'CREATE', createdAt: new Date('2026-09-07T19:00:00Z') },
    { id: 'audit-invoice', entityType: 'invoice', entityId: 'invoice-arrival', eventType: 'ISSUE', createdAt: new Date('2026-09-07T18:00:00Z') },
  ],
  now,
});

assert(getDateKeyInTimeZone(now) === '2026-09-08', 'uses the Asia/Kolkata date after UTC midnight crossover');
assert(snapshot.metrics.inHouseGuests === 7, 'counts confirmed guests in house, including today arrivals');
assert(snapshot.metrics.inHouseStays === 2, 'excludes check-outs and non-confirmed stays from in-house count');
assert(snapshot.metrics.arrivals === 1 && snapshot.metrics.arrivalGuests === 4, 'counts confirmed arrivals and guest totals');
assert(snapshot.metrics.departures === 1 && snapshot.metrics.departureGuests === 2, 'counts confirmed departures with checkout-day exclusivity');
assert(snapshot.metrics.outstandingBalanceMinorUnits === 400_000, 'uses live balances from only the latest invoice per non-cancelled reservation');
assert(snapshot.metrics.pendingProofs === 1 && snapshot.paymentAttention.length === 1, 'shows only payment proofs awaiting review');
assert(snapshot.upcomingStays.map((stay) => stay.id).join(',') === 'arrival,pending', 'sorts confirmed and pending future stays and omits cancelled stays');
assert(snapshot.recentActivity[0]?.reservationId === 'current', 'resolves payment activity back to its reservation');
assert(snapshot.recentActivity[1]?.label === 'Invoice issued', 'renders a human-readable audit event label');
assert(isBookableResortUnitSlug('5-bedroom-villa-private-pool'), 'allows the entire private resort inventory');
assert(!isBookableResortUnitSlug('1-bedroom-villa'), 'rejects legacy unit inventory for new bookings');
assert(hasResortBookingConflict([
  { checkInDate: '2026-10-10', checkOutDate: '2026-10-12', bookingStatus: 'confirmed' },
], '2026-10-11', '2026-10-13'), 'blocks a whole-resort booking that overlaps a confirmed legacy stay');
assert(!hasResortBookingConflict([
  { checkInDate: '2026-10-10', checkOutDate: '2026-10-12', bookingStatus: 'confirmed' },
], '2026-10-12', '2026-10-14'), 'allows checkout-day turnover after a legacy stay');
assert(!hasResortBookingConflict([
  { checkInDate: '2026-10-10', checkOutDate: '2026-10-12', bookingStatus: 'cancelled' },
], '2026-10-11', '2026-10-13'), 'ignores cancelled legacy stays when checking resort availability');

const empty = buildDashboardSnapshot({
  reservations: [],
  invoices: [],
  proofs: [],
  payments: [],
  auditEvents: [],
  now,
});

assert(empty.metrics.inHouseGuests === 0, 'returns zeroed metrics for an empty database');
assert(empty.upcomingStays.length === 0 && empty.recentActivity.length === 0, 'returns usable empty collections');

console.log(`\nDashboard tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
