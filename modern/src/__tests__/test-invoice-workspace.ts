import { calculateLiveInvoiceFinancials } from '../lib/live-invoice';
import {
  buildInvoiceWorkspace,
  parseInvoiceListQuery,
  selectLatestActiveInvoices,
  type InvoiceListQuery,
  type InvoiceListRecord,
} from '../app/admin/(protected)/invoices/invoice-list-model';

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

function invoice(overrides: Partial<InvoiceListRecord> = {}): InvoiceListRecord {
  return {
    id: 'invoice-current',
    invoiceNumber: 'GGR-2026-1001',
    reservationId: 'reservation-current',
    reservationNumber: 'RES-1001',
    version: 1,
    invoiceStatus: 'issued',
    bookingStatus: 'confirmed',
    totalMinorUnits: 1_000_000,
    advanceMinorUnits: 200_000,
    createdAt: new Date('2026-09-08T08:00:00Z'),
    issuedAt: new Date('2026-09-08T08:00:00Z'),
    checkInDate: '2026-10-01',
    checkOutDate: '2026-10-04',
    guestName: 'Aarav Sharma',
    unitName: 'Entire 5-Bedroom Private Resort',
    ...overrides,
  };
}

const parsed = parseInvoiceListQuery({
  q: ['  Aarav  ', 'ignored'],
  status: 'partially_paid',
  versions: 'all',
  page: '2',
});
assert(parsed.q === 'Aarav' && parsed.status === 'partially_paid' && parsed.versions === 'all' && parsed.page === 2, 'normalizes URL query state');
assert(parseInvoiceListQuery({ status: 'invalid', page: '-5' }).status === 'all', 'falls back safely for invalid filters');

const live = calculateLiveInvoiceFinancials(
  { id: 'invoice-current', status: 'issued', totalMinorUnits: 1_000_000, advanceMinorUnits: 200_000 },
  [
    { invoiceId: 'invoice-current', amountMinorUnits: 300_000, paymentStatus: 'completed', reference: 'UPI-123' },
    { invoiceId: 'invoice-current', amountMinorUnits: 99_000, paymentStatus: 'pending', reference: 'PENDING' },
  ],
  [
    { invoiceId: 'invoice-current', status: 'verified', verifiedAmountMinorUnits: 300_000, paymentReference: ' upi-123 ' },
    { invoiceId: 'invoice-current', status: 'verified', verifiedAmountMinorUnits: 100_000, paymentReference: 'UPI-456' },
    { invoiceId: 'invoice-current', status: 'verified', verifiedAmountMinorUnits: 100_000, paymentReference: 'upi-456' },
    { invoiceId: 'invoice-current', status: 'pending_review', verifiedAmountMinorUnits: 50_000, paymentReference: null },
  ],
);
assert(live.appliedMinorUnits === 600_000 && live.outstandingMinorUnits === 400_000, 'calculates live balance from advance, completed payments, and verified proofs');
assert(live.paymentState === 'partially_paid', 'derives a partially paid state from live financials');

const overpaid = calculateLiveInvoiceFinancials(
  { id: 'overpaid', status: 'issued', totalMinorUnits: 100_000, advanceMinorUnits: 0 },
  [{ invoiceId: 'overpaid', amountMinorUnits: 120_000, paymentStatus: 'completed', reference: null }],
  [],
);
assert(overpaid.appliedMinorUnits === 100_000 && overpaid.outstandingMinorUnits === 0 && overpaid.paymentState === 'paid', 'caps overpayments and marks a settled invoice paid');

const cancelled = calculateLiveInvoiceFinancials(
  { id: 'cancelled', status: 'cancelled', totalMinorUnits: 100_000, advanceMinorUnits: 0 },
  [],
  [],
);
assert(cancelled.outstandingMinorUnits === 0 && cancelled.paymentState === 'cancelled', 'never reports cancelled invoices as outstanding');

const records = [
  invoice({ id: 'old', version: 1, createdAt: new Date('2026-09-01T00:00:00Z') }),
  invoice({ id: 'latest', version: 2, invoiceNumber: 'GGR-2026-1002' }),
  invoice({ id: 'cancelled-version', version: 3, invoiceStatus: 'cancelled', invoiceNumber: 'GGR-2026-1003' }),
  invoice({ id: 'legacy', reservationId: 'reservation-legacy', reservationNumber: 'RES-LEGACY', guestName: 'Legacy Guest', unitName: '1 Bedroom Villa', totalMinorUnits: 500_000, advanceMinorUnits: 0 }),
  invoice({ id: 'cancelled-stay', reservationId: 'reservation-cancelled', bookingStatus: 'cancelled', invoiceNumber: 'GGR-CANCELLED' }),
];
assert(selectLatestActiveInvoices(records).map((item) => item.id).sort().join(',') === 'latest,legacy', 'selects the latest active invoice while preserving legacy stays');

const defaultQuery: InvoiceListQuery = { q: '', status: 'all', versions: 'latest', page: 1, pageSize: 20 };
const workspace = buildInvoiceWorkspace({ invoices: records, payments: [], proofs: [], query: defaultQuery });
assert(workspace.items.length === 2 && workspace.summary.paymentDueCount === 1 && workspace.summary.partiallyPaidCount === 1, 'builds latest-only results and stable summary counts');
assert(workspace.summary.totalOutstandingMinorUnits === 1_300_000, 'totals live outstanding across latest active invoices');

const allVersions = buildInvoiceWorkspace({
  invoices: records,
  payments: [],
  proofs: [],
  query: { ...defaultQuery, versions: 'all' },
});
assert(allVersions.items.length === 5 && allVersions.items.some((item) => item.paymentState === 'cancelled'), 'reveals historical and cancelled records in all-versions view');

const searched = buildInvoiceWorkspace({
  invoices: records,
  payments: [],
  proofs: [],
  query: { ...defaultQuery, q: '1 bedroom' },
});
assert(searched.items.length === 1 && searched.items[0]?.id === 'legacy', 'searches unit, guest, reservation, and invoice text case-insensitively');

const filtered = buildInvoiceWorkspace({
  invoices: records,
  payments: [],
  proofs: [],
  query: { ...defaultQuery, status: 'partially_paid' },
});
assert(filtered.items.length === 1 && filtered.items[0]?.id === 'latest', 'filters by derived live payment state');

const paginatedRecords = Array.from({ length: 21 }, (_, index) => invoice({
  id: `invoice-${index}`,
  invoiceNumber: `GGR-${index}`,
  reservationId: `reservation-${index}`,
  reservationNumber: `RES-${index}`,
  createdAt: new Date(Date.UTC(2026, 8, index + 1)),
}));
const paginated = buildInvoiceWorkspace({
  invoices: paginatedRecords,
  payments: [],
  proofs: [],
  query: { ...defaultQuery, page: 2 },
});
assert(paginated.items.length === 1 && paginated.rangeStart === 21 && paginated.rangeEnd === 21 && paginated.totalPages === 2, 'paginates results at twenty rows');

const empty = buildInvoiceWorkspace({ invoices: [], payments: [], proofs: [], query: defaultQuery });
assert(!empty.hasInvoices && empty.items.length === 0 && empty.summary.totalOutstandingMinorUnits === 0, 'returns a usable empty workspace');

console.log(`\nInvoice workspace tests: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
