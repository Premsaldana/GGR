import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { users, guests, units, reservations, invoices, invoicePayments, auditEvents } from '../db/schema';
import crypto from 'crypto';
import { eq, sum } from 'drizzle-orm';

const sqlite = new Database(':memory:');
const db = drizzle(sqlite);

sqlite.exec(`
  CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT, role TEXT, totp_secret TEXT, created_at INTEGER);
  CREATE TABLE guests (id TEXT PRIMARY KEY, full_name TEXT, phone TEXT, email TEXT, notes TEXT, created_at INTEGER, updated_at INTEGER);
  CREATE TABLE units (id TEXT PRIMARY KEY, display_name TEXT, slug TEXT, property_label TEXT, capacity_adults INTEGER, capacity_children INTEGER, active INTEGER, default_check_in_time TEXT, default_check_out_time TEXT);
  CREATE TABLE reservations (id TEXT PRIMARY KEY, reservation_number TEXT, guest_id TEXT, unit_id TEXT, check_in_date TEXT, check_out_date TEXT, booking_status TEXT, payment_status TEXT, adults INTEGER, children INTEGER, payment_mode TEXT, advance_received_minor_units INTEGER, advance_received_at INTEGER, notes TEXT, created_by TEXT, created_at INTEGER, updated_at INTEGER);
  CREATE TABLE invoices (id TEXT PRIMARY KEY, invoice_number TEXT, reservation_id TEXT, version INTEGER, status TEXT, issued_at INTEGER, currency TEXT, subtotal_minor_units INTEGER, tax_minor_units INTEGER, security_deposit_minor_units INTEGER, total_minor_units INTEGER, advance_minor_units INTEGER, balance_minor_units INTEGER, amount_in_words TEXT, snapshot_json TEXT, created_by TEXT, created_at INTEGER);
  CREATE TABLE invoice_payments (id TEXT PRIMARY KEY, invoice_id TEXT, amount_minor_units INTEGER, payment_mode TEXT, payment_status TEXT, received_at INTEGER, reference TEXT, notes TEXT, recorded_by TEXT, created_at INTEGER);
  CREATE TABLE audit_events (id TEXT PRIMARY KEY, actor_user_id TEXT, entity_type TEXT, entity_id TEXT, event_type TEXT, before_json TEXT, after_json TEXT, request_id TEXT, created_at INTEGER);
`);

function recordPaymentTx(invoiceId: string, amount: number, userId: string, idempotencyKey: string) {
  return db.transaction((tx) => {
    if (amount <= 0) throw new Error('Payment amount must be positive');

    // Check idempotency (simplified for test using reference as idempotency key)
    const existing = tx.select().from(invoicePayments).where(eq(invoicePayments.reference, idempotencyKey)).get();
    if (existing) return existing;

    const invoice = tx.select().from(invoices).where(eq(invoices.id, invoiceId)).get();
    if (!invoice) throw new Error('Invoice not found');

    const reservation = tx.select().from(reservations).where(eq(reservations.id, invoice.reservationId)).get();
    if (!reservation) throw new Error('Reservation not found');

    const paymentId = crypto.randomUUID();
    tx.insert(invoicePayments).values({
      id: paymentId,
      invoiceId,
      amountMinorUnits: amount,
      paymentMode: 'UPI',
      paymentStatus: 'completed',
      receivedAt: new Date(),
      reference: idempotencyKey,
      recordedBy: userId,
      createdAt: new Date(),
    }).run();

    // Recompute totals
    const paymentsResult = tx.select({ total: sum(invoicePayments.amountMinorUnits) })
      .from(invoicePayments)
      .where(eq(invoicePayments.invoiceId, invoiceId))
      .get();
    
    const additionalPaid = paymentsResult?.total || 0;
    const totalPaid = invoice.advanceMinorUnits + Number(additionalPaid);
    
    let newStatus = reservation.paymentStatus;
    if (totalPaid >= invoice.totalMinorUnits) {
      newStatus = 'paid';
    } else if (totalPaid > invoice.advanceMinorUnits) {
      newStatus = 'partially_paid';
    }

    if (newStatus !== reservation.paymentStatus) {
      tx.update(reservations).set({ paymentStatus: newStatus }).where(eq(reservations.id, reservation.id)).run();
    }

    tx.insert(auditEvents).values({
      id: crypto.randomUUID(),
      actorUserId: userId,
      entityType: 'invoice_payment',
      entityId: paymentId,
      eventType: 'CREATE',
      createdAt: new Date(),
    }).run();

    return { id: paymentId, newStatus, totalPaid };
  });
}

async function runTests() {
  console.log('--- Starting Payment Tests ---');
  const userId = crypto.randomUUID();
  db.insert(users).values({ id: userId, email: 'test@example.com', role: 'owner_admin', createdAt: new Date() }).run();

  const unitId = crypto.randomUUID();
  db.insert(units).values({ id: unitId, displayName: 'Test Unit', slug: 'test-unit' }).run();

  const guestId = crypto.randomUUID();
  db.insert(guests).values({ id: guestId, fullName: 'Test Guest', createdAt: new Date(), updatedAt: new Date() }).run();

  const reservationId = crypto.randomUUID();
  db.insert(reservations).values({
    id: reservationId, reservationNumber: 'RES-1', guestId, unitId, checkInDate: '2024-05-01', checkOutDate: '2024-05-05',
    bookingStatus: 'confirmed', paymentStatus: 'not_requested', adults: 2, children: 0,
    advanceReceivedMinorUnits: 200000, createdBy: userId, createdAt: new Date(), updatedAt: new Date(),
  }).run();

  const invoiceId = crypto.randomUUID();
  db.insert(invoices).values({
    id: invoiceId, invoiceNumber: 'INV-1', reservationId, version: 1, status: 'issued', currency: 'INR',
    subtotalMinorUnits: 1000000, taxMinorUnits: 180000, securityDepositMinorUnits: 0,
    totalMinorUnits: 1180000, advanceMinorUnits: 200000, balanceMinorUnits: 980000, createdBy: userId, createdAt: new Date(),
  }).run();

  // Test 1: Zero/Negative validation
  console.log('Test 1: Zero/Negative validation');
  try {
    recordPaymentTx(invoiceId, -500, userId, 'ref-1');
    console.error('❌ Test 1 Failed');
  } catch (e: any) {
    if (e.message === 'Payment amount must be positive') console.log('✅ Test 1 Passed');
    else console.error('❌ Test 1 Failed');
  }

  // Test 2: Partial Payment Status
  console.log('Test 2: Partial Payment');
  const res2 = recordPaymentTx(invoiceId, 500000, userId, 'ref-2') as any;
  if (res2.newStatus === 'partially_paid' && res2.totalPaid === 700000) console.log('✅ Test 2 Passed');
  else console.error('❌ Test 2 Failed', res2);

  // Test 3: Idempotency (Duplicate submission)
  console.log('Test 3: Idempotency');
  const res3 = recordPaymentTx(invoiceId, 500000, userId, 'ref-2') as any; // same ref
  if (res3.id === (res2 as any).id) console.log('✅ Test 3 Passed'); // returned existing
  else console.error('❌ Test 3 Failed');

  // Test 4: Full Payment Status
  console.log('Test 4: Full Payment');
  const res4 = recordPaymentTx(invoiceId, 480000, userId, 'ref-4') as any;
  if (res4.newStatus === 'paid' && res4.totalPaid === 1180000) console.log('✅ Test 4 Passed');
  else console.error('❌ Test 4 Failed', res4);

  // Test 5: Overpayment
  console.log('Test 5: Overpayment');
  const res5 = recordPaymentTx(invoiceId, 50000, userId, 'ref-5') as any;
  if (res5.newStatus === 'paid' && res5.totalPaid === 1230000) console.log('✅ Test 5 Passed');
  else console.error('❌ Test 5 Failed', res5);

  console.log('--- Tests Complete ---');
}

runTests();
