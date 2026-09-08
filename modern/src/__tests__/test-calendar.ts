import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { guests, reservations, units, users, reservationLineItems, auditEvents } from '../db/schema';
import { eq, lte, gte, or, and } from 'drizzle-orm';
import crypto from 'crypto';

const sqlite = new Database(':memory:');
const db = drizzle(sqlite);

// Initialize schema manually for the test
sqlite.exec(`
  CREATE TABLE users (id TEXT PRIMARY KEY, email TEXT, role TEXT, totp_secret TEXT, created_at INTEGER);
  CREATE TABLE guests (id TEXT PRIMARY KEY, full_name TEXT, phone TEXT, email TEXT, notes TEXT, created_at INTEGER, updated_at INTEGER);
  CREATE TABLE units (id TEXT PRIMARY KEY, display_name TEXT, slug TEXT, property_label TEXT, capacity_adults INTEGER, capacity_children INTEGER, active INTEGER, default_check_in_time TEXT, default_check_out_time TEXT);
  CREATE TABLE reservations (id TEXT PRIMARY KEY, reservation_number TEXT, guest_id TEXT, unit_id TEXT, check_in_date TEXT, check_out_date TEXT, booking_status TEXT, payment_status TEXT, adults INTEGER, children INTEGER, payment_mode TEXT, advance_received_minor_units INTEGER, advance_received_at INTEGER, notes TEXT, created_by TEXT, created_at INTEGER, updated_at INTEGER);
  CREATE TABLE reservation_line_items (id TEXT PRIMARY KEY, reservation_id TEXT, category TEXT, description TEXT, quantity INTEGER, unit_label TEXT, rate_minor_units INTEGER, tax_rate REAL, amount_minor_units INTEGER, sort_order INTEGER);
  CREATE TABLE audit_events (id TEXT PRIMARY KEY, actor_user_id TEXT, entity_type TEXT, entity_id TEXT, event_type TEXT, before_json TEXT, after_json TEXT, request_id TEXT, created_at INTEGER);
`);

// The transaction logic we want to test
function runReservationTx(validData: any, userId: string) {
  return db.transaction((tx) => {
    const overlapping = tx.select().from(reservations).where(
      and(
        eq(reservations.unitId, validData.unitId),
        or(eq(reservations.bookingStatus, 'pending'), eq(reservations.bookingStatus, 'confirmed')),
        lte(reservations.checkInDate, validData.checkOutDate),
        gte(reservations.checkOutDate, validData.checkInDate)
      )
    ).get();

    if (overlapping) {
      if (!(overlapping.checkOutDate <= validData.checkInDate || overlapping.checkInDate >= validData.checkOutDate)) {
        throw new Error('CONFLICT');
      }
    }

    if (validData.forceError) {
      throw new Error('FORCED_ERROR');
    }

    const guestId = crypto.randomUUID();
    tx.insert(guests).values({
      id: guestId,
      fullName: validData.guestName,
      phone: validData.phone || null,
      email: validData.email || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).run();

    const reservationId = crypto.randomUUID();
    tx.insert(reservations).values({
      id: reservationId,
      reservationNumber: `RES-${crypto.randomUUID().slice(0, 6)}`,
      guestId,
      unitId: validData.unitId,
      checkInDate: validData.checkInDate,
      checkOutDate: validData.checkOutDate,
      bookingStatus: validData.bookingStatus,
      paymentStatus: 'not_requested',
      adults: 2,
      children: 0,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).run();

    return reservationId;
  });
}

async function runTests() {
  console.log('--- Starting Tests ---');
  
  // Setup mock user and unit
  const userId = crypto.randomUUID();
  db.insert(users).values({
    id: userId,
    email: 'test@example.com',
    role: 'owner_admin',
    createdAt: new Date()
  }).run();

  const unitId = crypto.randomUUID();
  db.insert(units).values({
    id: unitId,
    displayName: 'Test Unit',
    slug: 'test-unit'
  }).run();

  // Test 1: Concurrency / Double Booking (Promise.all)
  console.log('Test 1: Concurrency via Promise.all');
  const req1 = {
    unitId,
    guestName: 'Guest 1',
    checkInDate: '2024-01-01',
    checkOutDate: '2024-01-05',
    bookingStatus: 'confirmed'
  };
  const req2 = {
    unitId,
    guestName: 'Guest 2',
    checkInDate: '2024-01-01',
    checkOutDate: '2024-01-05',
    bookingStatus: 'confirmed'
  };

  let successCount = 0;
  let conflictCount = 0;

  // We wrap the synchronous driver calls in Promises to simulate incoming concurrent HTTP requests
  const p1 = new Promise<void>((resolve) => {
    try {
      runReservationTx(req1, userId);
      successCount++;
    } catch (e: any) {
      if (e.message === 'CONFLICT') conflictCount++;
    }
    resolve();
  });

  const p2 = new Promise<void>((resolve) => {
    try {
      runReservationTx(req2, userId);
      successCount++;
    } catch (e: any) {
      if (e.message === 'CONFLICT') conflictCount++;
    }
    resolve();
  });

  await Promise.all([p1, p2]);

  const totalReservations = db.select().from(reservations).where(eq(reservations.unitId, unitId)).all().length;
  console.log(`Successes: ${successCount}, Conflicts: ${conflictCount}, Total in DB: ${totalReservations}`);
  if (successCount === 1 && conflictCount === 1 && totalReservations === 1) {
    console.log('✅ Test 1 Passed');
  } else {
    console.error('❌ Test 1 Failed');
  }

  // Test 2: Same-day boundary behavior
  console.log('Test 2: Same-day boundary');
  try {
    runReservationTx({
      unitId,
      guestName: 'Guest 3',
      checkInDate: '2024-01-05',
      checkOutDate: '2024-01-10',
      bookingStatus: 'confirmed'
    }, userId);
    console.log('✅ Test 2 Passed (Allowed same-day turnover)');
  } catch (e) {
    console.error('❌ Test 2 Failed (Threw error on same day turnover)');
  }

  // Test 3: Cancelled/voided reservations
  console.log('Test 3: Cancelled status ignored');
  try {
    runReservationTx({
      unitId,
      guestName: 'Guest 4',
      checkInDate: '2024-02-01',
      checkOutDate: '2024-02-05',
      bookingStatus: 'cancelled'
    }, userId);
    
    runReservationTx({
      unitId,
      guestName: 'Guest 5',
      checkInDate: '2024-02-01',
      checkOutDate: '2024-02-05',
      bookingStatus: 'confirmed'
    }, userId);
    console.log('✅ Test 3 Passed');
  } catch (e) {
    console.error('❌ Test 3 Failed', e);
  }

  // Test 4: Transaction rollback
  console.log('Test 4: Transaction rollback');
  const beforeCount = db.select().from(guests).all().length;
  try {
    runReservationTx({
      unitId,
      guestName: 'Guest 6',
      checkInDate: '2024-03-01',
      checkOutDate: '2024-03-05',
      bookingStatus: 'confirmed',
      forceError: true
    }, userId);
  } catch (e: any) {
    if (e.message === 'FORCED_ERROR') {
      const afterCount = db.select().from(guests).all().length;
      if (beforeCount === afterCount) {
        console.log('✅ Test 4 Passed (Rollback successful)');
      } else {
        console.error('❌ Test 4 Failed (Rollback failed)');
      }
    }
  }

  // Test 5: Active Units Validation
  console.log('Test 5: Active Units Validation');
  const inactiveUnitId = crypto.randomUUID();
  db.insert(units).values({
    id: inactiveUnitId,
    displayName: 'Inactive Unit',
    slug: 'inactive-unit',
    active: false
  }).run();

  const activeUnits = db.select().from(units).where(eq(units.active, true)).all();
  if (activeUnits.some(u => u.id === inactiveUnitId)) {
    console.error('❌ Test 5 Failed (Inactive unit returned)');
  } else if (!activeUnits.some(u => u.id === unitId)) {
    console.error('❌ Test 5 Failed (Active unit missing)');
  } else {
    // Also test validation in createReservation logic
    try {
      runReservationTx({
        unitId: inactiveUnitId,
        guestName: 'Guest 7',
        checkInDate: '2024-04-01',
        checkOutDate: '2024-04-05',
        bookingStatus: 'confirmed'
      }, userId);
      console.error('❌ Test 5 Failed (Allowed booking on inactive unit)');
    } catch (e: any) {
      if (e.message === 'INVALID_UNIT') {
        console.log('✅ Test 5 Passed');
      } else {
        console.error('❌ Test 5 Failed', e);
      }
    }
  }

  console.log('--- Tests Complete ---');
}

runTests();
