import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { getDashboardReservationCounts, getTodayInResortTimeZone } from '../lib/dashboard';

const sqlite = new Database(':memory:');
const db = drizzle(sqlite);
sqlite.exec(`
  CREATE TABLE reservations (
    id TEXT PRIMARY KEY,
    reservation_number TEXT,
    guest_id TEXT,
    unit_id TEXT,
    check_in_date TEXT,
    check_out_date TEXT,
    booking_status TEXT,
    payment_status TEXT,
    adults INTEGER,
    children INTEGER,
    security_deposit_minor_units INTEGER,
    payment_mode TEXT,
    advance_received_minor_units INTEGER,
    advance_received_at INTEGER,
    notes TEXT,
    created_by TEXT,
    created_at INTEGER,
    updated_at INTEGER
  )
`);

const today = getTodayInResortTimeZone(new Date('2026-09-08T00:00:00.000Z'));
if (today !== '2026-09-08') throw new Error(`Expected resort date 2026-09-08, got ${today}`);

const insert = sqlite.prepare(`INSERT INTO reservations (id, check_in_date, check_out_date, booking_status) VALUES (?, ?, ?, ?)`);
insert.run('arriving', today, '2026-09-10', 'confirmed');
insert.run('departing', '2026-09-06', today, 'confirmed');
insert.run('in-house', '2026-09-06', '2026-09-10', 'confirmed');
insert.run('cancelled-arrival', today, '2026-09-10', 'cancelled');

const counts = getDashboardReservationCounts(db as unknown as typeof import('../db').db, today);
if (counts.arrivingToday !== 1 || counts.departingToday !== 1 || counts.inHouseToday !== 1) {
  throw new Error(`Unexpected dashboard counts: ${JSON.stringify(counts)}`);
}

console.log('Dashboard regression tests passed');
