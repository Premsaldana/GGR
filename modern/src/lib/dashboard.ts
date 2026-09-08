import { and, eq, lte, gt, ne } from 'drizzle-orm';
import { reservations } from '@/db/schema';
import { db as applicationDb } from '@/db';

export const RESORT_TIME_ZONE = 'Asia/Kolkata';

export function getTodayInResortTimeZone(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: RESORT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

export function getDashboardReservationCounts(db: typeof applicationDb, today: string) {
  const validReservation = ne(reservations.bookingStatus, 'cancelled');
  const arrivingToday = db.select({ id: reservations.id })
    .from(reservations)
    .where(and(validReservation, eq(reservations.checkInDate, today)))
    .all().length;
  const departingToday = db.select({ id: reservations.id })
    .from(reservations)
    .where(and(validReservation, eq(reservations.checkOutDate, today)))
    .all().length;
  const inHouseToday = db.select({ id: reservations.id })
    .from(reservations)
    .where(and(validReservation, lte(reservations.checkInDate, today), gt(reservations.checkOutDate, today)))
    .all().length;

  return { arrivingToday, departingToday, inHouseToday };
}
