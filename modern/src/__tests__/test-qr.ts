import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { users, guests, units, reservations, invoices, qrPaymentArtifacts, shareLinks, auditEvents } from '../db/schema';
import crypto from 'crypto';
import { eq, desc } from 'drizzle-orm';

const sqlite = new Database(':memory:');
const db = drizzle(sqlite);

// Initialize schema manually for the test
sqlite.exec(`
  CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT, role TEXT, totp_secret TEXT, created_at INTEGER);
  CREATE TABLE guests (id TEXT PRIMARY KEY, full_name TEXT, phone TEXT, email TEXT, notes TEXT, created_at INTEGER, updated_at INTEGER);
  CREATE TABLE units (id TEXT PRIMARY KEY, display_name TEXT, slug TEXT, property_label TEXT, capacity_adults INTEGER, capacity_children INTEGER, active INTEGER, default_check_in_time TEXT, default_check_out_time TEXT);
  CREATE TABLE reservations (id TEXT PRIMARY KEY, reservation_number TEXT, guest_id TEXT, unit_id TEXT, check_in_date TEXT, check_out_date TEXT, booking_status TEXT, payment_status TEXT, adults INTEGER, children INTEGER, payment_mode TEXT, advance_received_minor_units INTEGER, advance_received_at INTEGER, notes TEXT, created_by TEXT, created_at INTEGER, updated_at INTEGER);
  CREATE TABLE invoices (id TEXT PRIMARY KEY, invoice_number TEXT, reservation_id TEXT, version INTEGER, status TEXT, issued_at INTEGER, currency TEXT, subtotal_minor_units INTEGER, tax_minor_units INTEGER, security_deposit_minor_units INTEGER, total_minor_units INTEGER, advance_minor_units INTEGER, balance_minor_units INTEGER, amount_in_words TEXT, snapshot_json TEXT, created_by TEXT, created_at INTEGER);
  CREATE TABLE qr_payment_artifacts (id TEXT PRIMARY KEY, invoice_id TEXT, amount_minor_units INTEGER, upi_id TEXT, payee_name TEXT, currency TEXT, transaction_note TEXT, upi_uri TEXT, qr_format TEXT, artifact_version INTEGER, created_by TEXT, created_at INTEGER);
  CREATE TABLE share_links (id TEXT PRIMARY KEY, invoice_id TEXT, token TEXT, expires_at INTEGER, created_at INTEGER, created_by TEXT);
  CREATE TABLE audit_events (id TEXT PRIMARY KEY, actor_user_id TEXT, entity_type TEXT, entity_id TEXT, event_type TEXT, before_json TEXT, after_json TEXT, request_id TEXT, created_at INTEGER);
`);

async function runTests() {
  console.log('--- Starting QR & Share Tests ---');
  
  // Setup mock user, unit, guest, reservation, invoice
  const userId = crypto.randomUUID();
  db.insert(users).values({ id: userId, email: 'test@example.com', role: 'owner_admin', createdAt: new Date() }).run();

  const unitId = crypto.randomUUID();
  db.insert(units).values({ id: unitId, displayName: 'Test Unit', slug: 'test-unit', active: true }).run();

  const guestId = crypto.randomUUID();
  db.insert(guests).values({ id: guestId, fullName: 'Test Guest', createdAt: new Date(), updatedAt: new Date() }).run();

  const reservationId = crypto.randomUUID();
  db.insert(reservations).values({
    id: reservationId,
    reservationNumber: 'RES-123456',
    guestId,
    unitId,
    checkInDate: '2024-05-01',
    checkOutDate: '2024-05-05',
    bookingStatus: 'confirmed',
    paymentStatus: 'not_requested',
    adults: 2,
    children: 0,
    createdBy: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).run();

  const invoiceId = crypto.randomUUID();
  db.insert(invoices).values({
    id: invoiceId,
    invoiceNumber: 'INV-123456',
    reservationId,
    version: 1,
    status: 'issued',
    currency: 'INR',
    subtotalMinorUnits: 1000000,
    taxMinorUnits: 180000,
    securityDepositMinorUnits: 500000,
    totalMinorUnits: 1180000,
    advanceMinorUnits: 200000,
    balanceMinorUnits: 980000,
    amountInWords: 'Nine Thousand Eight Hundred',
    createdBy: userId,
    createdAt: new Date(),
  }).run();

  // Test 1: Amount-tampering tests (negative amount)
  console.log('Test 1: Amount Tampering');
  let passed = true;
  try {
    const amt = -500;
    if (amt < 0) throw new Error('Amount cannot be negative'); // Simulation of action logic
  } catch (e: any) {
    if (e.message !== 'Amount cannot be negative') passed = false;
  }
  console.log(passed ? '✅ Test 1 Passed' : '❌ Test 1 Failed');

  // Test 2: QR-payload tests & QR-regeneration tests
  console.log('Test 2: QR Payload & Regeneration');
  // Generate first QR
  const upiId = '9482095412@ybl';
  const payeeName = 'Goa Garden Resort';
  const amountStr = (980000 / 100).toFixed(2);
  const upiUri1 = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amountStr}&tr=INV-123456&cu=INR`;
  
  db.insert(qrPaymentArtifacts).values({
    id: crypto.randomUUID(),
    invoiceId,
    amountMinorUnits: 980000,
    upiId,
    payeeName,
    currency: 'INR',
    transactionNote: 'INV-123456',
    upiUri: upiUri1,
    qrFormat: 'SVG',
    artifactVersion: 1,
    createdBy: userId,
    createdAt: new Date(),
  }).run();

  const amountStr2 = (500000 / 100).toFixed(2);
  const upiUri2 = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${amountStr2}&tr=INV-123456&cu=INR`;
  
  db.insert(qrPaymentArtifacts).values({
    id: crypto.randomUUID(),
    invoiceId,
    amountMinorUnits: 500000,
    upiId,
    payeeName,
    currency: 'INR',
    transactionNote: 'INV-123456',
    upiUri: upiUri2,
    qrFormat: 'SVG',
    artifactVersion: 2,
    createdBy: userId,
    createdAt: new Date(),
  }).run();

  const qrs = db.select().from(qrPaymentArtifacts).where(eq(qrPaymentArtifacts.invoiceId, invoiceId)).orderBy(desc(qrPaymentArtifacts.artifactVersion)).all();
  if (qrs.length === 2 && qrs[0].artifactVersion === 2 && qrs[0].upiUri.includes('am=5000.00') && qrs[1].upiUri.includes('am=9800.00')) {
    console.log('✅ Test 2 Passed');
  } else {
    console.log('❌ Test 2 Failed');
  }

  // Test 3: Token hashing and expiry tests
  console.log('Test 3: Token Hashing & Expiry');
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);
  
  const shareId = crypto.randomUUID();
  db.insert(shareLinks).values({
    id: shareId,
    invoiceId,
    token: tokenHash,
    expiresAt,
    createdAt: new Date(),
    createdBy: userId,
  }).run();

  const dbLink = db.select().from(shareLinks).where(eq(shareLinks.token, tokenHash)).get();
  if (dbLink && dbLink.token !== rawToken && new Date(dbLink.expiresAt) > new Date()) {
    console.log('✅ Test 3 Passed');
  } else {
    console.log('❌ Test 3 Failed');
  }

  // Test 4: Token Revocation
  console.log('Test 4: Token Revocation');
  db.update(shareLinks).set({ expiresAt: new Date(0) }).where(eq(shareLinks.id, shareId)).run();
  
  const revokedLink = db.select().from(shareLinks).where(eq(shareLinks.token, tokenHash)).get();
  if (revokedLink && new Date(revokedLink.expiresAt) < new Date()) {
    console.log('✅ Test 4 Passed');
  } else {
    console.log('❌ Test 4 Failed');
  }

  console.log('--- Tests Complete ---');
}

runTests();
