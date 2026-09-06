import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { calculateInvoice, convertRupeesToWords } from '../lib/invoice';
import { users, invoices, auditEvents, reservations, guests, units, reservationLineItems } from '../db/schema';
import crypto from 'crypto';

const sqlite = new Database(':memory:');
const db = drizzle(sqlite);

sqlite.exec(`
  CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT, role TEXT, totp_secret TEXT, created_at INTEGER);
  CREATE TABLE guests (id TEXT PRIMARY KEY, full_name TEXT, phone TEXT, email TEXT, notes TEXT, created_at INTEGER, updated_at INTEGER);
  CREATE TABLE units (id TEXT PRIMARY KEY, display_name TEXT, slug TEXT, property_label TEXT, capacity_adults INTEGER, capacity_children INTEGER, active INTEGER, default_check_in_time TEXT, default_check_out_time TEXT);
  CREATE TABLE reservations (id TEXT PRIMARY KEY, reservation_number TEXT, guest_id TEXT, unit_id TEXT, check_in_date TEXT, check_out_date TEXT, booking_status TEXT, payment_status TEXT, adults INTEGER, children INTEGER, payment_mode TEXT, advance_received_minor_units INTEGER, advance_received_at INTEGER, notes TEXT, created_by TEXT, created_at INTEGER, updated_at INTEGER);
  CREATE TABLE reservation_line_items (id TEXT PRIMARY KEY, reservation_id TEXT, category TEXT, description TEXT, quantity INTEGER, unit_label TEXT, rate_minor_units INTEGER, tax_rate REAL, amount_minor_units INTEGER, sort_order INTEGER);
  CREATE TABLE audit_events (id TEXT PRIMARY KEY, actor_user_id TEXT, entity_type TEXT, entity_id TEXT, event_type TEXT, before_json TEXT, after_json TEXT, request_id TEXT, created_at INTEGER);
  CREATE TABLE invoices (id TEXT PRIMARY KEY, invoice_number TEXT, reservation_id TEXT, version INTEGER, status TEXT, issued_at INTEGER, currency TEXT, subtotal_minor_units INTEGER, tax_minor_units INTEGER, security_deposit_minor_units INTEGER, total_minor_units INTEGER, advance_minor_units INTEGER, balance_minor_units INTEGER, amount_in_words TEXT, snapshot_json TEXT, created_by TEXT, created_at INTEGER);
`);

async function runInvoiceTests() {
  console.log('--- Starting Invoice Tests ---');

  // Test 1: Words
  console.log('Test 1: Convert Rupees To Words');
  const words1 = convertRupeesToWords(0);
  const words2 = convertRupeesToWords(105);
  const words3 = convertRupeesToWords(5000);
  const words4 = convertRupeesToWords(1500000); // 15 Lakh
  
  if (words1 === 'Zero Rupees Only' && words3 === 'Five Thousand Rupees Only' && words4 === 'Fifteen Lakh Rupees Only') {
    console.log('✅ Test 1 Passed');
  } else {
    console.error('❌ Test 1 Failed', { words1, words3, words4 });
  }

  // Test 2: Standard Invoice Calculation
  console.log('Test 2: Standard Invoice Calculation');
  const calc1 = calculateInvoice({
    lineItems: [
      { category: 'room', description: 'Villa', quantity: 2, rateMinorUnits: 1000000 }, // 2 x 10000 = 20000
      { category: 'extra', description: 'Extra Person', quantity: 1, rateMinorUnits: 80000 }, // 1 x 800 = 800
    ],
    advanceReceivedMinorUnits: 500000, // 5000
    refundableSecurityDepositMinorUnits: 500000 // 5000
  });

  if (calc1.subtotalMinorUnits === 2080000 && calc1.taxMinorUnits === 0 && calc1.securityDepositMinorUnits === 500000 && calc1.totalMinorUnits === 2580000 && calc1.balanceMinorUnits === 2080000) {
    console.log('✅ Test 2 Passed');
  } else {
    console.error('❌ Test 2 Failed', calc1);
  }

  // Test 3: Negative checking and overpayment
  console.log('Test 3: Negative Advance checking & Overpayment');
  const calc2 = calculateInvoice({
    lineItems: [{ category: 'room', description: 'Villa', quantity: 1, rateMinorUnits: 100000 }], // 1000
    advanceReceivedMinorUnits: 5000000 // 50000 advance
  });
  // Balance should not be negative
  if (calc2.balanceMinorUnits === 0 && calc2.overpaymentMinorUnits === 4400000) { // 50000 - 6000(total) = 44000
    console.log('✅ Test 3 Passed');
  } else {
    console.error('❌ Test 3 Failed', calc2);
  }

  // Test 4: Rollback & Transaction behavior
  console.log('Test 4: Issue Invoice Transaction');
  
  const userId = crypto.randomUUID();
  const guestId = crypto.randomUUID();
  const unitId = crypto.randomUUID();
  const reservationId = crypto.randomUUID();

  db.insert(users).values({ id: userId, email: 'test@example.com', role: 'owner_admin', createdAt: new Date() }).run();
  db.insert(units).values({ id: unitId, displayName: 'Test', slug: 'test' }).run();
  db.insert(guests).values({ id: guestId, fullName: 'Test', createdAt: new Date(), updatedAt: new Date() }).run();
  db.insert(reservations).values({
    id: reservationId, reservationNumber: 'RES-123', guestId, unitId, checkInDate: '2024-01-01', checkOutDate: '2024-01-05',
    bookingStatus: 'confirmed', paymentStatus: 'not_requested', adults: 2, children: 0, createdAt: new Date(), updatedAt: new Date()
  }).run();

  // Issue first version
  db.transaction((tx) => {
    tx.insert(invoices).values({
      id: crypto.randomUUID(), invoiceNumber: 'INV-1', reservationId, version: 1, status: 'issued',
      issuedAt: new Date(), currency: 'INR', subtotalMinorUnits: 0, taxMinorUnits: 0, securityDepositMinorUnits: 0,
      totalMinorUnits: 0, advanceMinorUnits: 0, balanceMinorUnits: 0, amountInWords: 'Zero', createdBy: userId, createdAt: new Date()
    }).run();
  });

  // Issue second version - simulate conflict rollback
  let rollbackSuccess = false;
  try {
    db.transaction((tx) => {
      tx.insert(invoices).values({
        id: crypto.randomUUID(), invoiceNumber: 'INV-2', reservationId, version: 2, status: 'issued',
        issuedAt: new Date(), currency: 'INR', subtotalMinorUnits: 0, taxMinorUnits: 0, securityDepositMinorUnits: 0,
        totalMinorUnits: 0, advanceMinorUnits: 0, balanceMinorUnits: 0, amountInWords: 'Zero', createdBy: userId, createdAt: new Date()
      }).run();
      
      throw new Error("FORCED_ROLLBACK");
    });
  } catch (err: any) {
    if (err.message === "FORCED_ROLLBACK") {
      rollbackSuccess = true;
    }
  }

  const invoicesCount = db.select().from(invoices).all().length;
  if (rollbackSuccess && invoicesCount === 1) {
    console.log('✅ Test 4 Passed');
  } else {
    console.error('❌ Test 4 Failed', { rollbackSuccess, invoicesCount });
  }

  console.log('--- Tests Complete ---');
}

runInvoiceTests();
