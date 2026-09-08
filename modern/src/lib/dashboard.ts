import { db as applicationDb } from '@/db';
import { ALLOWED_UNITS, getCanonicalRoomType, isAllowedUnit } from './units';
import { guests, invoicePayments, invoices, reservations, units } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const RESORT_TIME_ZONE = 'Asia/Kolkata';
type DashboardDatabase = typeof applicationDb;
type DateLike = Date | number | string;

function asDate(value: DateLike | null | undefined) {
  if (value instanceof Date) return value;
  return value == null ? null : new Date(value);
}

function localDate(value: DateLike) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: RESORT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(asDate(value) || new Date(0));
}

function monthKey(value: DateLike) {
  return localDate(value).slice(0, 7);
}

function addDays(date: string, days: number) {
  const result = new Date(`${date}T12:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

function previousMonthKey(date: string) {
  const current = new Date(`${date.slice(0, 7)}-01T12:00:00Z`);
  current.setUTCMonth(current.getUTCMonth() - 1);
  return current.toISOString().slice(0, 7);
}

function activeReservation(reservation: typeof reservations.$inferSelect) {
  return reservation.bookingStatus !== 'cancelled';
}

export function getTodayInResortTimeZone(now: Date = new Date()): string {
  return localDate(now);
}

export function getDashboardReservationCounts(database: DashboardDatabase, today: string) {
  const active = database.select().from(reservations).all().filter(activeReservation);
  return {
    arrivingToday: active.filter((reservation) => reservation.checkInDate === today).length,
    departingToday: active.filter((reservation) => reservation.checkOutDate === today).length,
    inHouseToday: active.filter((reservation) => reservation.checkInDate <= today && reservation.checkOutDate > today).length,
  };
}

export function getDashboardMetrics(database: DashboardDatabase = applicationDb, now: Date = new Date()) {
  const today = getTodayInResortTimeZone(now);
  const currentMonth = monthKey(now);
  const previousMonth = previousMonthKey(today);
  const activeUnits = database.select().from(units).all().filter((unit) => unit.active !== false && isAllowedUnit(unit));
  const allReservations = database.select().from(reservations).all();
  const activeReservations = allReservations.filter(activeReservation);
  const allInvoices = database.select().from(invoices).all();
  const allPayments = database.select().from(invoicePayments).all().filter((payment) => payment.paymentStatus === 'completed');
  const reservationById = new Map(allReservations.map((reservation) => [reservation.id, reservation]));
  const invoiceById = new Map(allInvoices.map((invoice) => [invoice.id, invoice]));
  const latestInvoiceByReservation = new Map<string, typeof invoices.$inferSelect>();

  for (const invoice of allInvoices) {
    const current = latestInvoiceByReservation.get(invoice.reservationId);
    if (!current || invoice.version > current.version) latestInvoiceByReservation.set(invoice.reservationId, invoice);
  }

  const paymentsByReservation = new Map<string, typeof invoicePayments.$inferSelect[]>();
  for (const payment of allPayments) {
    const invoice = invoiceById.get(payment.invoiceId);
    if (invoice) {
      const payments = paymentsByReservation.get(invoice.reservationId) || [];
      payments.push(payment);
      paymentsByReservation.set(invoice.reservationId, payments);
    }
  }

  const invoiceLedger = Array.from(latestInvoiceByReservation.values()).map((invoice) => {
    const reservation = reservationById.get(invoice.reservationId);
    const collected = invoice.advanceMinorUnits + (paymentsByReservation.get(invoice.reservationId) || []).reduce((sum, payment) => sum + payment.amountMinorUnits, 0);
    const outstanding = Math.max(0, invoice.totalMinorUnits - collected);
    return { invoice, reservation, collected, outstanding, isPaid: collected >= invoice.totalMinorUnits };
  }).filter(({ invoice, reservation }) => invoice.status !== 'cancelled' && reservation && activeReservation(reservation));

  const cashEvent = (amountMinorUnits: number, date: DateLike | null | undefined) => ({ amountMinorUnits, date: date ? localDate(date) : null, month: date ? monthKey(date) : null });
  const cashEvents = invoiceLedger.flatMap(({ invoice, reservation }) => {
    const events = [];
    if (invoice.advanceMinorUnits > 0) {
      events.push(cashEvent(invoice.advanceMinorUnits, reservation?.advanceReceivedAt || invoice.issuedAt || invoice.createdAt));
    }
    for (const payment of paymentsByReservation.get(invoice.reservationId) || []) {
      events.push(cashEvent(payment.amountMinorUnits, payment.receivedAt || payment.createdAt));
    }
    return events;
  });

  const collectedTotal = invoiceLedger.reduce((sum, item) => sum + item.collected, 0);
  const outstandingDues = invoiceLedger.reduce((sum, item) => sum + item.outstanding, 0);
  const paidInvoices = invoiceLedger.filter((item) => item.isPaid).length;
  const dueInvoices = invoiceLedger.filter((item) => !item.isPaid).length;
  const currentBookingInvoices = Array.from(latestInvoiceByReservation.values()).filter((invoice) => invoice.status !== 'cancelled' && activeReservation(reservationById.get(invoice.reservationId)!));
  const averageBookingValue = currentBookingInvoices.length === 0
    ? 0
    : currentBookingInvoices.reduce((sum, invoice) => sum + invoice.totalMinorUnits, 0) / currentBookingInvoices.length;

  const collectedForMonth = (month: string) => cashEvents.filter((event) => event.month === month).reduce((sum, event) => sum + event.amountMinorUnits, 0);
  const monthRevenue = collectedForMonth(currentMonth);
  const previousMonthRevenue = collectedForMonth(previousMonth);
  const revenueGrowthPercent = previousMonthRevenue === 0 ? null : ((monthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;

  const currentOccupants = activeReservations.filter((reservation) => reservation.checkInDate <= today && reservation.checkOutDate > today);
  const occupiedUnitIds = new Set(currentOccupants.map((reservation) => reservation.unitId));
  const availableUnits = Math.max(0, activeUnits.length - occupiedUnitIds.size);
  const occupancyRate = activeUnits.length === 0 ? 0 : (occupiedUnitIds.size / activeUnits.length) * 100;
  const reservationCounts = getDashboardReservationCounts(database, today);

  const trendDays = Array.from({ length: 14 }, (_, index) => addDays(today, index - 13));
  const revenueTrend = trendDays.map((date) => ({ date, amountMinorUnits: cashEvents.filter((event) => event.date === date).reduce((sum, event) => sum + event.amountMinorUnits, 0) }));
  const occupancyTrend = trendDays.map((date) => ({
    date,
    occupied: new Set(activeReservations.filter((reservation) => reservation.checkInDate <= date && reservation.checkOutDate > date).map((reservation) => reservation.unitId)).size,
    total: activeUnits.length,
  }));

  const roomTypePerformance = ALLOWED_UNITS.map((allowedUnit) => {
    const catalogUnits = activeUnits.filter((unit) => getCanonicalRoomType(unit) === allowedUnit.displayName);
    const catalogIds = new Set(catalogUnits.map((unit) => unit.id));
    const roomReservations = activeReservations.filter((reservation) => catalogIds.has(reservation.unitId));
    const roomInvoices = invoiceLedger.filter(({ reservation }) => reservation && catalogIds.has(reservation.unitId));
    const roomOccupied = currentOccupants.filter((reservation) => catalogIds.has(reservation.unitId)).length;
    return {
      roomType: allowedUnit.displayName,
      unitCount: catalogUnits.length,
      bookings: roomReservations.length,
      occupied: new Set(currentOccupants.filter((reservation) => catalogIds.has(reservation.unitId)).map((reservation) => reservation.unitId)).size,
      available: Math.max(0, catalogUnits.length - new Set(currentOccupants.filter((reservation) => catalogIds.has(reservation.unitId)).map((reservation) => reservation.unitId)).size),
      occupancyRate: catalogUnits.length === 0 ? 0 : (roomOccupied / catalogUnits.length) * 100,
      revenueMinorUnits: roomInvoices.reduce((sum, item) => sum + item.collected, 0),
    };
  });

  const statusBreakdown = ['pending', 'confirmed', 'cancelled'].map((status) => ({
    status,
    count: allReservations.filter((reservation) => reservation.bookingStatus === status).length,
  }));
  const monthlyTrend = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(`${currentMonth}-01T12:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() - (5 - index));
    const key = date.toISOString().slice(0, 7);
    return {
      month: key,
      revenueMinorUnits: collectedForMonth(key),
      bookings: activeReservations.filter((reservation) => monthKey(reservation.createdAt) === key).length,
    };
  });

  const recentReservations = database.select({ reservation: reservations, guest: guests, unit: units })
    .from(reservations)
    .innerJoin(guests, eq(reservations.guestId, guests.id))
    .innerJoin(units, eq(reservations.unitId, units.id))
    .orderBy(reservations.updatedAt)
    .all()
    .sort((a, b) => asDate(b.reservation.updatedAt)!.getTime() - asDate(a.reservation.updatedAt)!.getTime())
    .slice(0, 8);
  const recentInvoices = database.select().from(invoices).all().sort((a, b) => asDate(b.createdAt)!.getTime() - asDate(a.createdAt)!.getTime()).slice(0, 8);

  return {
    today,
    currentMonth,
    financial: { monthRevenue, collectedTotal, outstandingDues, paidInvoices, dueInvoices, averageBookingValue, revenueGrowthPercent },
    operations: { totalReservations: allReservations.length, cancelledReservations: allReservations.filter((reservation) => reservation.bookingStatus === 'cancelled').length, totalUnits: activeUnits.length, occupiedUnits: occupiedUnitIds.size, availableUnits, occupancyRate, ...reservationCounts },
    roomTypePerformance,
    revenueTrend,
    occupancyTrend,
    statusBreakdown,
    monthlyTrend,
    recentReservations,
    recentInvoices,
  };
}
