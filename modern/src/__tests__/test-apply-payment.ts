import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import crypto from 'crypto';
import { applyPayment } from '../lib/payments/apply-payment';
import { auditEvents, guests, invoicePayments, invoices, reservations, units, users } from '../db/schema';

const sqlite = new Database(':memory:');
sqlite.exec(`
  CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT, role TEXT, created_at INTEGER);
  CREATE TABLE guests (id TEXT PRIMARY KEY, full_name TEXT, created_at INTEGER, updated_at INTEGER);
  CREATE TABLE units (id TEXT PRIMARY KEY, display_name TEXT, slug TEXT);
  CREATE TABLE reservations (id TEXT PRIMARY KEY, reservation_number TEXT, guest_id TEXT, unit_id TEXT, check_in_date TEXT, check_out_date TEXT, booking_status TEXT, payment_status TEXT, adults INTEGER, children INTEGER, advance_received_minor_units INTEGER, created_at INTEGER, updated_at INTEGER);
  CREATE TABLE invoices (id TEXT PRIMARY KEY, invoice_number TEXT, reservation_id TEXT, version INTEGER, status TEXT, currency TEXT, subtotal_minor_units INTEGER, tax_minor_units INTEGER, security_deposit_minor_units INTEGER, total_minor_units INTEGER, advance_minor_units INTEGER, balance_minor_units INTEGER, created_at INTEGER);
  CREATE TABLE invoice_payments (id TEXT PRIMARY KEY, invoice_id TEXT, amount_minor_units INTEGER, payment_mode TEXT, payment_status TEXT, received_at INTEGER, reference TEXT, notes TEXT, recorded_by TEXT, created_at INTEGER, attempt_id TEXT, source TEXT DEFAULT 'manual', provider_payment_id TEXT);
  CREATE TABLE audit_events (id TEXT PRIMARY KEY, actor_user_id TEXT, entity_type TEXT, entity_id TEXT, event_type TEXT, before_json TEXT, after_json TEXT, created_at INTEGER);
`);
const db = drizzle(sqlite);
const id = () => crypto.randomUUID();
const now = new Date();
const userId = id();
const guestId = id();
const unitId = id();
const reservationId = id();
const invoiceId = id();

db.insert(users).values({ id: userId, email: 'test@ggr.local', role: 'owner_admin', createdAt: now }).run();
db.insert(guests).values({ id: guestId, fullName: 'Payment Test', createdAt: now, updatedAt: now }).run();
db.insert(units).values({ id: unitId, displayName: 'Test Villa', slug: 'test-villa' }).run();
db.insert(reservations).values({ id: reservationId, reservationNumber: 'RES-APPLY-1', guestId, unitId, checkInDate: '2026-10-01', checkOutDate: '2026-10-02', bookingStatus: 'confirmed', paymentStatus: 'payment_pending', adults: 2, children: 0, advanceReceivedMinorUnits: 200000, createdAt: now, updatedAt: now }).run();
db.insert(invoices).values({ id: invoiceId, invoiceNumber: 'INV-APPLY-1', reservationId, version: 1, status: 'issued', currency: 'INR', subtotalMinorUnits: 1000000, taxMinorUnits: 0, securityDepositMinorUnits: 0, totalMinorUnits: 1000000, advanceMinorUnits: 200000, balanceMinorUnits: 800000, createdAt: now }).run();

async function run() {
  const first = await applyPayment(db, { invoiceId, amountMinorUnits: 300000, mode: 'UPI', reference: 'UPI-APPLY-1', providerPaymentId: 'PROVIDER-1', source: 'auto', actorUserId: null });
  if (first.status !== 'applied' || first.totalPaidMinorUnits !== 500000 || first.balanceMinorUnits !== 500000) throw new Error(`unexpected first result: ${JSON.stringify(first)}`);
  const duplicate = await applyPayment(db, { invoiceId, amountMinorUnits: 300000, mode: 'UPI', reference: 'UPI-APPLY-1', providerPaymentId: 'PROVIDER-1', source: 'auto', actorUserId: null });
  if (duplicate.status !== 'duplicate' || db.select().from(invoicePayments).all().length !== 1) throw new Error('duplicate payment was posted twice');
  if (db.select().from(auditEvents).all().length !== 1) throw new Error('duplicate payment created a second audit event');
  console.log('shared applyPayment idempotency tests passed');
}
run().catch((error: unknown) => { console.error(error); process.exitCode = 1; });
