import { db } from '../src/db';
import { users, guests, units, reservations, reservationLineItems, invoices, qrPaymentArtifacts, shareLinks } from '../src/db/schema';
import crypto from 'crypto';

async function seed() {
  const adminId = 'seed-admin-1';
  db.insert(users).values({ id: adminId, email: 'admin@ggr.com', role: 'owner_admin', createdAt: new Date() }).onConflictDoNothing().run();

  const guestId = 'qa-guest-' + Date.now();
  db.insert(guests).values({ id: guestId, fullName: 'QA Guest Upload Test', email: 'qa@ggr.test', createdAt: new Date(), updatedAt: new Date() }).run();

  const unit = db.select().from(units).get();
  const unitId = unit?.id || 'unit-1';

  const reservationId = 'RES-QA-' + Date.now();
  db.insert(reservations).values({
    id: reservationId,
    reservationNumber: reservationId,
    guestId,
    unitId,
    checkInDate: '2026-10-01',
    checkOutDate: '2026-10-03',
    bookingStatus: 'confirmed',
    paymentStatus: 'qr_generated',
    adults: 2,
    children: 0,
    securityDepositMinorUnits: 500000,
    advanceReceivedMinorUnits: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }).run();

  db.insert(reservationLineItems).values({
    id: crypto.randomUUID(),
    reservationId,
    category: 'Accommodation',
    description: 'QA Rent',
    quantity: 2,
    rateMinorUnits: 1000000,
    amountMinorUnits: 2000000,
    sortOrder: 1
  }).run();

  const invoiceId = 'INV-QA-' + Date.now();
  db.insert(invoices).values({
    id: invoiceId,
    invoiceNumber: invoiceId,
    reservationId,
    version: 1,
    status: 'issued',
    issuedAt: new Date(),
    subtotalMinorUnits: 2000000,
    taxMinorUnits: 0,
    securityDepositMinorUnits: 500000,
    totalMinorUnits: 2500000,
    advanceMinorUnits: 0,
    balanceMinorUnits: 2500000,
    amountInWords: 'Twenty Five Thousand Rupees Only',
    snapshotJson: JSON.stringify({
      guestName: 'QA Guest Upload Test',
      input: { lineItems: [{ category: 'Accommodation', description: 'QA Rent', quantity: 2, rateMinorUnits: 1000000, amountMinorUnits: 2000000 }] },
      calculation: { totalMinorUnits: 2500000, balanceMinorUnits: 2500000, advanceMinorUnits: 0, subtotalMinorUnits: 2000000, taxMinorUnits: 0, securityDepositMinorUnits: 500000, amountInWords: 'Twenty Five Thousand Rupees Only' }
    }),
    createdAt: new Date()
  }).run();

  db.insert(qrPaymentArtifacts).values({
    id: crypto.randomUUID(),
    invoiceId,
    amountMinorUnits: 2500000,
    upiId: 'qa@upi',
    payeeName: 'GGR QA',
    upiUri: 'upi://pay?pa=qa@upi&pn=GGR QA&am=25000.00',
    qrFormat: 'svg',
    artifactVersion: 1,
    createdAt: new Date()
  }).run();

  const rawToken = crypto.randomBytes(32).toString('base64url');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);

  db.insert(shareLinks).values({
    id: crypto.randomUUID(),
    invoiceId,
    token: tokenHash,
    expiresAt: expiry,
    createdAt: new Date()
  }).run();

  console.log('--- QA FIXTURE CREATED ---');
  console.log(`Reservation: ${reservationId}`);
  console.log(`Invoice: ${invoiceId}`);
  console.log(`Share Link URL: http://localhost:3000/share/${rawToken}`);
}

seed().catch(console.error);
