import { checkAvailability } from '../lib/availability';
import { db } from '../db';
import { reservations, roomAvailability, units } from '../db/schema';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

async function runTests() {
  console.log('--- Starting availability tests ---');
  let exitCode = 0;
  
  // Find Private Pool Villa
  const unit = (db.select().from(units).where(eq(units.slug, 'private-pool-villa')) as any).get();
  
  if (!unit) {
    console.error('Private Pool Villa not found in DB');
    process.exit(1);
  }

  // Helper to assert
  function assert(condition: boolean, message: string) {
    if (!condition) {
      console.error(`❌ FAIL: ${message}`);
      exitCode = 1;
    } else {
      console.log(`✅ PASS: ${message}`);
    }
  }

  // 1. Valid date range (assuming 2030 is free in test DB)
  const res1 = await checkAvailability('2030-01-01', '2030-01-05', 1);
  assert(res1.available === true, 'Valid date range should be available');

  // 2. Check-out before check-in is invalid
  const res2 = await checkAvailability('2030-01-05', '2030-01-01', 1);
  assert(res2.available === false && res2.reason === 'Check-out must be after check-in', 'Check-out before check-in is invalid');

  // 3. Rooms != 1 is invalid
  const res3 = await checkAvailability('2030-01-01', '2030-01-05', 2);
  assert(res3.available === false && (res3.reason?.includes('1 room') ?? false), 'Rooms other than 1 is rejected');

  // Add dummy reservation for 2030-02-01 to 2030-02-05 (pending)
  const resId1 = crypto.randomUUID();
  (db.insert(reservations).values({
    id: resId1,
    reservationNumber: 'TEST-A1',
    guestId: crypto.randomUUID(), // Assume foreign key might complain if guest doesn't exist, let's insert a dummy guest too
    unitId: unit.id,
    checkInDate: '2030-02-01',
    checkOutDate: '2030-02-05',
    bookingStatus: 'pending',
    paymentStatus: 'not_requested',
    adults: 2,
    children: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }) as any).run();

  // Test pending overlap
  const res4 = await checkAvailability('2030-02-03', '2030-02-06', 1);
  assert(res4.available === false, 'Pending reservation overlap blocks availability');
  
  // Test pending overlap (checkout day is free)
  const res5 = await checkAvailability('2030-02-05', '2030-02-08', 1);
  assert(res5.available === true, 'Check-out day is available for new check-in');

  // Delete dummy
  (db.delete(reservations).where(eq(reservations.id, resId1)) as any).run();

  // Add sold-off date
  const soId = crypto.randomUUID();
  (db.insert(roomAvailability).values({
    id: soId,
    unitId: unit.id,
    date: '2030-03-10',
    status: 'sold_off',
    createdAt: new Date(),
    updatedAt: new Date()
  }) as any).run();

  const res6 = await checkAvailability('2030-03-09', '2030-03-11', 1);
  assert(res6.available === false, 'Sold-off date blocks availability');

  (db.delete(roomAvailability).where(eq(roomAvailability.id, soId)) as any).run();

  console.log('--- Finished availability tests ---');
  process.exit(exitCode);
}

runTests().catch(console.error);
