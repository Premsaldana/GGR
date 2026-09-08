import {
  buildLiveInvoiceFinancials,
  type InvoicePaymentState,
  type LivePaymentRecord,
  type LiveProofRecord,
} from '@/lib/live-invoice';

export type InvoiceListRecord = {
  id: string;
  invoiceNumber: string;
  reservationId: string;
  reservationNumber: string;
  version: number;
  invoiceStatus: string;
  bookingStatus: string;
  totalMinorUnits: number;
  advanceMinorUnits: number;
  createdAt: Date;
  issuedAt: Date | null;
  checkInDate: string;
  checkOutDate: string;
  guestName: string;
  unitName: string;
};

export type InvoiceStatusFilter = 'all' | InvoicePaymentState;
export type InvoiceVersionView = 'latest' | 'all';

export type InvoiceListQuery = {
  q: string;
  status: InvoiceStatusFilter;
  versions: InvoiceVersionView;
  page: number;
  pageSize: number;
};

export type InvoiceListItem = InvoiceListRecord & {
  appliedMinorUnits: number;
  outstandingMinorUnits: number;
  paymentState: InvoicePaymentState;
};

export type InvoiceWorkspace = {
  summary: {
    totalOutstandingMinorUnits: number;
    paymentDueCount: number;
    partiallyPaidCount: number;
    paidCount: number;
  };
  items: InvoiceListItem[];
  query: InvoiceListQuery;
  totalItems: number;
  totalPages: number;
  rangeStart: number;
  rangeEnd: number;
  hasInvoices: boolean;
};

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parseInvoiceListQuery(searchParams: SearchParams): InvoiceListQuery {
  const rawStatus = firstValue(searchParams.status);
  const allowedStatuses: InvoiceStatusFilter[] = ['all', 'payment_due', 'partially_paid', 'paid', 'cancelled'];
  const status = allowedStatuses.includes(rawStatus as InvoiceStatusFilter)
    ? rawStatus as InvoiceStatusFilter
    : 'all';
  const rawPage = Number.parseInt(firstValue(searchParams.page) ?? '1', 10);

  return {
    q: (firstValue(searchParams.q) ?? '').trim().slice(0, 100),
    status,
    versions: firstValue(searchParams.versions) === 'all' ? 'all' : 'latest',
    page: Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1,
    pageSize: 20,
  };
}

function newerInvoice(left: InvoiceListRecord, right: InvoiceListRecord): InvoiceListRecord {
  if (left.version !== right.version) return left.version > right.version ? left : right;
  return left.createdAt > right.createdAt ? left : right;
}

export function selectLatestActiveInvoices(invoices: InvoiceListRecord[]): InvoiceListRecord[] {
  const latestByReservation = new Map<string, InvoiceListRecord>();

  for (const invoice of invoices) {
    if (invoice.invoiceStatus === 'cancelled' || invoice.bookingStatus === 'cancelled') continue;
    const current = latestByReservation.get(invoice.reservationId);
    latestByReservation.set(
      invoice.reservationId,
      current ? newerInvoice(current, invoice) : invoice,
    );
  }

  return [...latestByReservation.values()];
}

function sortNewestFirst(left: InvoiceListItem, right: InvoiceListItem): number {
  return right.createdAt.getTime() - left.createdAt.getTime()
    || right.version - left.version
    || right.invoiceNumber.localeCompare(left.invoiceNumber);
}

export function buildInvoiceWorkspace({
  invoices,
  payments,
  proofs,
  query,
}: {
  invoices: InvoiceListRecord[];
  payments: LivePaymentRecord[];
  proofs: LiveProofRecord[];
  query: InvoiceListQuery;
}): InvoiceWorkspace {
  const financials = buildLiveInvoiceFinancials(
    invoices.map((invoice) => ({
      id: invoice.id,
      status: invoice.invoiceStatus,
      totalMinorUnits: invoice.totalMinorUnits,
      advanceMinorUnits: invoice.advanceMinorUnits,
    })),
    payments,
    proofs,
  );
  const enrich = (invoice: InvoiceListRecord): InvoiceListItem => ({
    ...invoice,
    ...(financials.get(invoice.id) ?? {
      appliedMinorUnits: 0,
      outstandingMinorUnits: Math.max(0, invoice.totalMinorUnits),
      paymentState: 'payment_due' as const,
    }),
  });

  const latestActive = selectLatestActiveInvoices(invoices).map(enrich);
  const summary = latestActive.reduce((metrics, invoice) => {
    metrics.totalOutstandingMinorUnits += invoice.outstandingMinorUnits;
    if (invoice.paymentState === 'payment_due') metrics.paymentDueCount += 1;
    if (invoice.paymentState === 'partially_paid') metrics.partiallyPaidCount += 1;
    if (invoice.paymentState === 'paid') metrics.paidCount += 1;
    return metrics;
  }, {
    totalOutstandingMinorUnits: 0,
    paymentDueCount: 0,
    partiallyPaidCount: 0,
    paidCount: 0,
  });

  const source = query.versions === 'all' ? invoices.map(enrich) : latestActive;
  const search = query.q.toLocaleLowerCase('en-IN');
  const filtered = source
    .filter((invoice) => query.status === 'all' || invoice.paymentState === query.status)
    .filter((invoice) => {
      if (!search) return true;
      return [
        invoice.invoiceNumber,
        invoice.reservationNumber,
        invoice.guestName,
        invoice.unitName,
      ].some((value) => value.toLocaleLowerCase('en-IN').includes(search));
    })
    .sort(sortNewestFirst);

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / query.pageSize));
  const currentPage = Math.min(query.page, totalPages);
  const offset = (currentPage - 1) * query.pageSize;
  const items = filtered.slice(offset, offset + query.pageSize);

  return {
    summary,
    items,
    query: { ...query, page: currentPage },
    totalItems,
    totalPages,
    rangeStart: totalItems === 0 ? 0 : offset + 1,
    rangeEnd: Math.min(offset + query.pageSize, totalItems),
    hasInvoices: invoices.length > 0,
  };
}
