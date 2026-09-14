import { uploadProofAction } from '../app/share/[token]/actions';
import { db } from '../db';
import { shareLinks, invoices, reservations, paymentProofs } from '../db/schema';
import crypto from 'crypto';

import { eq } from 'drizzle-orm';

// We can just use the native File class
async function runTests() {
  console.log('--- Running Upload Proof Tests ---');

  // Setup mock data
  const invoiceId = 'inv-upload-test';
  const shareId = 'share-upload-test';
  const token = 'test-token-123';
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  const resId = 'res-upload-test';

  // Ensure cleanup
  db.delete(paymentProofs).where(eq(paymentProofs.invoiceId, invoiceId)).run();
  db.delete(shareLinks).where(eq(shareLinks.id, shareId)).run();
  db.delete(invoices).where(eq(invoices.id, invoiceId)).run();
  db.delete(reservations).where(eq(reservations.id, resId)).run();
  try { db.delete(require('../db/schema').guests).where(eq(require('../db/schema').guests.id, 'dummy-guest')).run(); } catch(e) {}

  // Create base mock data
  try {
    db.insert(require('../db/schema').guests).values({
      id: 'dummy-guest',
      fullName: 'Test Guest',
      createdAt: new Date(),
      updatedAt: new Date(),
    }).run();
  } catch(e) {}
  
  try {
    db.insert(require('../db/schema').units).values({
      id: 'dummy-unit',
      displayName: 'Test Unit',
      slug: 'test-unit-upload',
    }).run();
  } catch(e) {}

  db.insert(reservations).values({
    id: resId,
    reservationNumber: 'RES-UPLOAD-1',
    guestId: 'dummy-guest',
    unitId: 'dummy-unit',
    checkInDate: '2025-01-01',
    checkOutDate: '2025-01-02',
    bookingStatus: 'confirmed',
    paymentStatus: 'qr_generated',
    adults: 2,
    children: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }).run();

  db.insert(invoices).values({
    id: invoiceId,
    invoiceNumber: 'INV-UPLOAD-1',
    reservationId: resId,
    version: 1,
    status: 'issued',
    currency: 'INR',
    subtotalMinorUnits: 100,
    taxMinorUnits: 0,
    securityDepositMinorUnits: 0,
    totalMinorUnits: 100,
    advanceMinorUnits: 0,
    balanceMinorUnits: 100,
    createdAt: new Date(),
  }).run();

  db.insert(shareLinks).values({
    id: shareId,
    invoiceId,
    token: tokenHash,
    expiresAt: new Date(Date.now() + 86400000), // Valid tomorrow
    createdAt: new Date(),
  }).run();

  const validPngBuffer = Buffer.from('89504E470D0A1A0A0000000D49484452', 'hex');
  const validJpegBuffer = Buffer.from('FFD8FFE000104A464946', 'hex');
  const validPdfBuffer = Buffer.from('%PDF-1.4\n1 0 obj', 'utf8');
  const invalidMimeBuffer = Buffer.from('hello world', 'utf8');
  const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB

  const createFormData = (fileBuffer: Buffer, fileName: string, type: string, reqToken: string = token) => {
    const fd = new FormData();
    const file = new File([new Uint8Array(fileBuffer)], fileName, { type });
    fd.append('file', file);
    fd.append('token', reqToken);
    return fd;
  };

  try {
    // 1. Invalid MIME/content
    console.log('Test 1: Invalid Content');
    const res1 = await uploadProofAction(createFormData(invalidMimeBuffer, 'test.txt', 'text/plain'));
    if (res1.success) throw new Error('Failed: Allowed invalid mime');
    console.log('Passed:', res1.error);

    // 2. Oversize file
    console.log('Test 2: Oversized File');
    const res2 = await uploadProofAction(createFormData(largeBuffer, 'large.png', 'image/png'));
    if (res2.success) throw new Error('Failed: Allowed oversized file');
    console.log('Passed:', res2.error);

    // 3. Unknown token
    console.log('Test 3: Unknown Token');
    const res3 = await uploadProofAction(createFormData(validPngBuffer, 'test.png', 'image/png', 'wrong-token'));
    if (res3.success) throw new Error('Failed: Allowed unknown token');
    console.log('Passed:', res3.error);

    // 4. Valid PNG upload
    console.log('Test 4: Valid PNG');
    const res4 = await uploadProofAction(createFormData(validPngBuffer, 'test.png', 'image/png'));
    if (!res4.success) throw new Error('Failed: PNG upload failed - ' + res4.error);
    console.log('Passed: PNG upload successful');

    // 5. Duplicate upload handling
    console.log('Test 5: Duplicate upload handling');
    const res5 = await uploadProofAction(createFormData(validJpegBuffer, 'test2.jpg', 'image/jpeg'));
    if (res5.success) throw new Error('Failed: Allowed duplicate upload');
    console.log('Passed:', res5.error);

    // Clear duplicate for further tests
    db.delete(paymentProofs).where(eq(paymentProofs.invoiceId, invoiceId)).run();

    // 6. Valid JPEG upload
    console.log('Test 6: Valid JPEG');
    const res6 = await uploadProofAction(createFormData(validJpegBuffer, 'test2.jpg', 'image/jpeg'));
    if (!res6.success) throw new Error('Failed: JPEG upload failed');
    console.log('Passed: JPEG upload successful');
    db.delete(paymentProofs).where(eq(paymentProofs.invoiceId, invoiceId)).run();

    // 7. Valid PDF upload
    console.log('Test 7: Valid PDF');
    const res7 = await uploadProofAction(createFormData(validPdfBuffer, 'test3.pdf', 'application/pdf'));
    if (!res7.success) throw new Error('Failed: PDF upload failed');
    console.log('Passed: PDF upload successful');
    db.delete(paymentProofs).where(eq(paymentProofs.invoiceId, invoiceId)).run();

    // 8. Expired Token
    console.log('Test 8: Expired token');
    db.update(shareLinks).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(shareLinks.id, shareId)).run();
    const res8 = await uploadProofAction(createFormData(validPngBuffer, 'test.png', 'image/png'));
    if (res8.success) throw new Error('Failed: Allowed expired token');
    console.log('Passed:', res8.error);

    // 9. Finalized invoice rejection
    console.log('Test 9: Finalized invoice');
    // Restore token
    db.update(shareLinks).set({ expiresAt: new Date(Date.now() + 86400000) }).where(eq(shareLinks.id, shareId)).run();
    db.update(reservations).set({ paymentStatus: 'paid' }).where(eq(reservations.id, resId)).run();
    
    const res9 = await uploadProofAction(createFormData(validPngBuffer, 'test.png', 'image/png'));
    if (res9.success) throw new Error('Failed: Allowed upload for finalized payment');
    console.log('Passed:', res9.error);

    console.log('--- All Upload Proof Tests Passed ---');

  } catch (err: any) {
    console.error('TEST FAILED:', err.message);
  } finally {
    // Clear duplicate for further tests
    db.delete(paymentProofs).where(eq(paymentProofs.invoiceId, invoiceId)).run();
    db.delete(shareLinks).where(eq(shareLinks.id, shareId)).run();
    db.delete(invoices).where(eq(invoices.id, invoiceId)).run();
    db.delete(reservations).where(eq(reservations.id, resId)).run();
  }
}

runTests();
