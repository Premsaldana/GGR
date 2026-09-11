import { db } from './index';
import { units } from './schema';
import { eq } from 'drizzle-orm';
import { ALLOWED_UNITS, DEFAULT_CHECK_IN_TIME, DEFAULT_CHECK_OUT_TIME } from '@/lib/units';
import crypto from 'crypto';

async function seed() {
  console.log('Seeding Private Pool Villa inventory...');
  const existingUnits = db.select().from(units).all();
  const existingBySlug = new Map(existingUnits.map((unit) => [unit.slug, unit]));

  for (const allowedUnit of ALLOWED_UNITS) {
    const existing = existingBySlug.get(allowedUnit.slug);
    if (existing) {
      db.update(units).set({
        displayName: allowedUnit.displayName,
        active: true,
        capacityAdults: allowedUnit.capacityAdults,
        capacityChildren: allowedUnit.capacityChildren,
        defaultCheckInTime: DEFAULT_CHECK_IN_TIME,
        defaultCheckOutTime: DEFAULT_CHECK_OUT_TIME,
      }).where(eq(units.id, existing.id)).run();
    } else {
      db.insert(units).values({
        id: crypto.randomUUID(),
        displayName: allowedUnit.displayName,
        slug: allowedUnit.slug,
        active: true,
        capacityAdults: allowedUnit.capacityAdults,
        capacityChildren: allowedUnit.capacityChildren,
        defaultCheckInTime: DEFAULT_CHECK_IN_TIME,
        defaultCheckOutTime: DEFAULT_CHECK_OUT_TIME,
      }).run();
    }
  }

  for (const existing of existingUnits) {
    if (!ALLOWED_UNITS.some((allowedUnit) => allowedUnit.slug === existing.slug)) {
      db.update(units).set({ active: false }).where(eq(units.id, existing.id)).run();
    }
  }
  console.log('Private Pool Villa seeded; historical units were retained but deactivated.');
}

seed().catch(console.error);
