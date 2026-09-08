import { buildLiveInvoiceFinancials } from '@/lib/live-invoice';

export const GOA_TIME_ZONE = 'Asia/Kolkata';

export type DashboardReservationRecord = {
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
};

export type DashboardInvoiceRecord = {
  id: string;
  reservationId: string;
  version: number;
  status: string;
  totalMinorUnits: number;
  advanceMinorUnits: number;
  createdAt: Date;
};

export type DashboardProofRecord = {
  id: string;
  invoiceId: string;
  status: string;
  verifiedAmountMinorUnits: number | null;
  paymentReference: string | null;
  submittedAt: Date;
};

export type DashboardPaymentRecord = {
  id: string;
  invoiceId: string;
  amountMinorUnits: number;
  paymentStatus: string;
  reference: string | null;
};

export type DashboardAuditRecord = {
  id: string;
  entityType: string;
  entityId: string;
  eventType: string;
  createdAt: Date;
};

export type DashboardStay = DashboardReservationRecord & {
  guestCount: number;
};

export type DashboardAttentionItem = {
  id: string;
  reservationId: string;
  reservationNumber: string;
  guestName: string;
  submittedAt: Date;
};

export type DashboardActivity = {
  id: string;
  label: string;
  detail: string;
  createdAt: Date;
  reservationId?: string;
};

export type DashboardSnapshot = {
  today: string;
  metrics: {
    inHouseGuests: number;
    inHouseStays: number;
    arrivals: number;
    arrivalGuests: number;
    departures: number;
    departureGuests: number;
    outstandingBalanceMinorUnits: number;
    pendingProofs: number;
  };
  upcomingStays: DashboardStay[];
  paymentAttention: DashboardAttentionItem[];
  recentActivity: DashboardActivity[];
};

type BuildDashboardSnapshotInput = {
  reservations: DashboardReservationRecord[];
  invoices: DashboardInvoiceRecord[];
  proofs: DashboardProofRecord[];
  payments: DashboardPaymentRecord[];
  auditEvents: DashboardAuditRecord[];
  now?: Date;
};

export function getDateKeyInTimeZone(date: Date, timeZone = GOA_TIME_ZONE): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value;

  const year = part('year');
  const month = part('month');
  const day = part('day');

  if (!year || !month || !day) {
    throw new Error('Unable to resolve the current date');
  }

  return `${year}-${month}-${day}`;
}

function isOperationalReservation(reservation: DashboardReservationRecord): boolean {
  return reservation.bookingStatus === 'confirmed';
}

function isUpcomingReservation(reservation: DashboardReservationRecord): boolean {
  return reservation.bookingStatus === 'confirmed' || reservation.bookingStatus === 'pending';
}

function guestCount(reservation: DashboardReservationRecord): number {
  return reservation.adults + reservation.children;
}

function humanize(value: string): string {
  return value.replaceAll('_', ' ').toLowerCase();
}

function describeActivity(
  event: DashboardAuditRecord,
  reservation?: DashboardReservationRecord,
): { label: string; detail: string } {
  const labels: Record<string, string> = {
    'reservation:CREATE': 'Reservation created',
    'invoice:ISSUE': 'Invoice issued',
    'invoice:FINALIZE_INVOICE': 'Invoice finalized',
    'payment_proof:VERIFY_PROOF': 'Payment proof verified',
    'payment_proof:REJECT_PROOF': 'Payment proof needs follow-up',
    'invoice_payment:CREATE': 'Payment recorded',
    'qr_payment_artifact:CREATE': 'Payment QR created',
    'share_link:CREATE': 'Guest payment link created',
    'share_link:REVOKE': 'Guest payment link revoked',
  };

  return {
    label: labels[`${event.entityType}:${event.eventType}`]
      ?? `${humanize(event.entityType)} ${humanize(event.eventType)}`,
    detail: reservation
      ? `${reservation.reservationNumber} · ${reservation.guestName}`
      : humanize(event.entityType),
  };
}

export function buildDashboardSnapshot({
  reservations,
  invoices,
  proofs,
  payments,
  auditEvents,
  now = new Date(),
}: BuildDashboardSnapshotInput): DashboardSnapshot {
  const today = getDateKeyInTimeZone(now);
  const reservationById = new Map(reservations.map((reservation) => [reservation.id, reservation]));
  const invoiceById = new Map(invoices.map((invoice) => [invoice.id, invoice]));
  const proofById = new Map(proofs.map((proof) => [proof.id, proof]));
  const paymentById = new Map(payments.map((payment) => [payment.id, payment]));
  const liveFinancials = buildLiveInvoiceFinancials(invoices, payments, proofs);

  const inHouse = reservations.filter((reservation) =>
    isOperationalReservation(reservation)
    && reservation.checkInDate <= today
    && reservation.checkOutDate > today,
  );
  const arrivals = reservations.filter((reservation) =>
    isOperationalReservation(reservation) && reservation.checkInDate === today,
  );
  const departures = reservations.filter((reservation) =>
    isOperationalReservation(reservation) && reservation.checkOutDate === today,
  );

  const latestInvoices = new Map<string, DashboardInvoiceRecord>();
  for (const invoice of invoices) {
    if (invoice.status === 'cancelled') continue;
    const current = latestInvoices.get(invoice.reservationId);
    if (
      !current
      || invoice.version > current.version
      || (invoice.version === current.version && invoice.createdAt > current.createdAt)
    ) {
      latestInvoices.set(invoice.reservationId, invoice);
    }
  }

  const outstandingBalanceMinorUnits = [...latestInvoices.values()].reduce((total, invoice) => {
    const reservation = reservationById.get(invoice.reservationId);
    if (!reservation || reservation.bookingStatus === 'cancelled') return total;
    return total + (liveFinancials.get(invoice.id)?.outstandingMinorUnits ?? 0);
  }, 0);

  const pendingProofRows = proofs
    .filter((proof) => proof.status === 'pending_review')
    .sort((left, right) => right.submittedAt.getTime() - left.submittedAt.getTime());

  const paymentAttention = pendingProofRows.flatMap((proof) => {
    const invoice = invoiceById.get(proof.invoiceId);
    const reservation = invoice ? reservationById.get(invoice.reservationId) : undefined;
    if (!reservation) return [];
    return [{
      id: proof.id,
      reservationId: reservation.id,
      reservationNumber: reservation.reservationNumber,
      guestName: reservation.guestName,
      submittedAt: proof.submittedAt,
    }];
  }).slice(0, 5);

  const upcomingStays = reservations
    .filter((reservation) => isUpcomingReservation(reservation) && reservation.checkInDate >= today)
    .sort((left, right) => left.checkInDate.localeCompare(right.checkInDate))
    .slice(0, 6)
    .map((reservation) => ({ ...reservation, guestCount: guestCount(reservation) }));

  const reservationForEvent = (event: DashboardAuditRecord): DashboardReservationRecord | undefined => {
    if (event.entityType === 'reservation') return reservationById.get(event.entityId);

    if (event.entityType === 'invoice') {
      const invoice = invoiceById.get(event.entityId);
      return invoice ? reservationById.get(invoice.reservationId) : undefined;
    }

    if (event.entityType === 'payment_proof') {
      const proof = proofById.get(event.entityId);
      const invoice = proof ? invoiceById.get(proof.invoiceId) : undefined;
      return invoice ? reservationById.get(invoice.reservationId) : undefined;
    }

    if (event.entityType === 'invoice_payment') {
      const payment = paymentById.get(event.entityId);
      const invoice = payment ? invoiceById.get(payment.invoiceId) : undefined;
      return invoice ? reservationById.get(invoice.reservationId) : undefined;
    }

    return undefined;
  };

  const recentActivity = [...auditEvents]
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, 8)
    .map((event) => {
      const reservation = reservationForEvent(event);
      const description = describeActivity(event, reservation);
      return {
        id: event.id,
        ...description,
        createdAt: event.createdAt,
        reservationId: reservation?.id,
      };
    });

  return {
    today,
    metrics: {
      inHouseGuests: inHouse.reduce((total, reservation) => total + guestCount(reservation), 0),
      inHouseStays: inHouse.length,
      arrivals: arrivals.length,
      arrivalGuests: arrivals.reduce((total, reservation) => total + guestCount(reservation), 0),
      departures: departures.length,
      departureGuests: departures.reduce((total, reservation) => total + guestCount(reservation), 0),
      outstandingBalanceMinorUnits,
      pendingProofs: pendingProofRows.length,
    },
    upcomingStays,
    paymentAttention,
    recentActivity,
  };
}

export function formatDateKey(dateKey: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${dateKey}T12:00:00Z`));
}

export function formatGoaDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: GOA_TIME_ZONE,
  }).format(date);
}
