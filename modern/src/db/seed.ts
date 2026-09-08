import { db } from './index';
import { units } from './schema';
import crypto from 'crypto';
import { ne } from 'drizzle-orm';
import { BOOKABLE_RESORT_UNIT } from '../lib/resort-inventory';

async function seed() {
  console.log('Synchronizing whole-resort inventory...');

  db.transaction((tx) => {
    tx.update(units)
      .set({ active: false })
      .where(ne(units.slug, BOOKABLE_RESORT_UNIT.slug))
      .run();

    tx.insert(units)
      .values({
        id: crypto.randomUUID(),
        ...BOOKABLE_RESORT_UNIT,
        active: true,
      })
      .onConflictDoUpdate({
        target: units.slug,
        set: {
          displayName: BOOKABLE_RESORT_UNIT.displayName,
          propertyLabel: BOOKABLE_RESORT_UNIT.propertyLabel,
          capacityAdults: BOOKABLE_RESORT_UNIT.capacityAdults,
          capacityChildren: BOOKABLE_RESORT_UNIT.capacityChildren,
          active: true,
        },
      })
      .run();
  });

  console.log('Whole-resort inventory synchronized successfully.');
}

seed().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
