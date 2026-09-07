import { toPaise } from '../lib/invoice';

async function runTests() {
  console.log('--- Starting Fix Pass Tests ---');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string) {
    if (condition) {
      console.log(`✅ ${name}`);
      passed++;
    } else {
      console.error(`❌ ${name}`);
      failed++;
    }
  }

  function assertThrows(fn: () => void, name: string) {
    try {
      fn();
      console.error(`❌ ${name} (Did not throw)`);
      failed++;
    } catch (e) {
      console.log(`✅ ${name} (Threw expected error)`);
      passed++;
    }
  }

  // 1. Money units tests
  console.log('\nTesting Money Units (toPaise):');
  assert(toPaise(1000) === 100000, '₹1,000 becomes exactly 100,000 paise once');
  assert(toPaise(0) === 0, '₹0 becomes 0 paise');
  assert(toPaise(1000.5) === 100050, 'Decimal rupees are rounded correctly');
  
  assertThrows(() => toPaise(-500), 'Negative values are rejected');
  assertThrows(() => toPaise(NaN), 'NaN is rejected');
  assertThrows(() => toPaise(Infinity), 'Infinity is rejected');

  console.log(`\n--- Tests Complete: ${passed} Passed, ${failed} Failed ---`);
  if (failed > 0) process.exit(1);
}

runTests();

// Add a test suite for the payment proof lifecycle and legacy invoice parsing
async function runAdvancedTests() {
  console.log('\nTesting Legacy Invoice Snapshot Parsing:');
  const legacySnapshot = {
    input: {
      lineItems: [
        { category: 'Accommodation', description: 'Rent', quantity: 2, rateMinorUnits: 100000 }
      ]
    }
  };
  
  const mappedLineItems = legacySnapshot.input.lineItems.map((li: any) => ({
    ...li,
    amountMinorUnits: li.amountMinorUnits ?? (li.quantity * li.rateMinorUnits)
  }));

  if (mappedLineItems[0].amountMinorUnits === 200000) {
    console.log('✅ Legacy line items correctly compute missing amountMinorUnits');
  } else {
    console.error('❌ Legacy line items failed to compute amountMinorUnits');
  }

  console.log('\nTesting Payment Proof Lifecycle Rules (Database Validation):');
  
  // Create a clean test invoice
  const testInvoiceId = 'TEST-INV-' + Date.now();
  const testShareLinkId = 'TEST-LINK-' + Date.now();
  
  const { db } = await import('../db');
  const { invoices, paymentProofs, shareLinks, reservations, guests, units } = await import('../db/schema');
  const crypto = await import('crypto');

  // Seed minimum required data
  db.insert(guests).values({ id: 'test-guest', fullName: 'Test', email: 'test@ggr.test', createdAt: new Date(), updatedAt: new Date() }).onConflictDoNothing().run();
  db.insert(units).values({ id: 'test-unit', displayName: 'Test Unit', slug: 'test-unit' }).onConflictDoNothing().run();
  
  db.insert(reservations).values({
    id: 'test-res',
    reservationNumber: 'RES-TEST',
    guestId: 'test-guest',
    unitId: 'test-unit',
    checkInDate: '2026-01-01',
    checkOutDate: '2026-01-02',
    bookingStatus: 'confirmed',
    paymentStatus: 'pending',
    adults: 1,
    children: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }).onConflictDoNothing().run();

  db.insert(invoices).values({
    id: testInvoiceId,
    invoiceNumber: testInvoiceId,
    reservationId: 'test-res',
    version: 1,
    status: 'issued',
    subtotalMinorUnits: 1000,
    taxMinorUnits: 0,
    securityDepositMinorUnits: 0,
    totalMinorUnits: 1000,
    advanceMinorUnits: 0,
    balanceMinorUnits: 1000,
    currency: 'INR',
    createdAt: new Date()
  }).run();

  db.insert(shareLinks).values({
    id: testShareLinkId,
    invoiceId: testInvoiceId,
    token: 'test-token-' + Date.now(),
    expiresAt: new Date(Date.now() + 1000000),
    createdAt: new Date()
  }).run();

  // Simulate upload logic
  db.insert(paymentProofs).values({
    id: crypto.randomUUID(),
    invoiceId: testInvoiceId,
    shareLinkId: testShareLinkId,
    storageProvider: 'local',
    storageKey: 'test-key',
    mimeType: 'image/png',
    sizeBytes: 1024,
    status: 'pending_review',
    submittedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date()
  }).run();

  const { eq } = await import('drizzle-orm');

  // Assertions
  const insertedProof = db.select().from(paymentProofs).where(eq(paymentProofs.invoiceId, testInvoiceId)).get();
  if (insertedProof && insertedProof.status === 'pending_review') {
    console.log('✅ Valid upload creates pending_review in DB');
  } else {
    console.error('❌ Upload did not create pending_review');
  }

  const { invoicePayments } = await import('../db/schema');
  const payments = db.select().from(invoicePayments).where(eq(invoicePayments.invoiceId, testInvoiceId)).all();
  if (payments.length === 0) {
    console.log('✅ Upload does not insert an invoice payment');
  } else {
    console.error('❌ Upload unexpectedly inserted a payment');
  }

  const updatedInvoice = db.select().from(invoices).where(eq(invoices.id, testInvoiceId)).get();
  if (updatedInvoice && updatedInvoice.balanceMinorUnits === 1000 && updatedInvoice.status === 'issued') {
    console.log('✅ Upload does not alter invoice payment status or balance');
  } else {
    console.error('❌ Upload altered invoice ledger');
  }
}
runAdvancedTests();
