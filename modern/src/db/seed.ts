import { db } from './index';
import { units } from './schema';
import crypto from 'crypto';

async function seed() {
  console.log('Seeding units...');
  
  const existingUnits = db.select().from(units).all();
  if (existingUnits.length > 0) {
    console.log('Units already exist. Skipping seed.');
    return;
  }

  const unitsData = [
    {
      id: crypto.randomUUID(),
      displayName: '1 Bedroom Villa',
      slug: '1-bedroom-villa',
      active: true,
      capacityAdults: 2,
      capacityChildren: 1,
    },
    {
      id: crypto.randomUUID(),
      displayName: '4 Bedroom Villa',
      slug: '4-bedroom-villa',
      active: true,
      capacityAdults: 8,
      capacityChildren: 4,
    },
    {
      id: crypto.randomUUID(),
      displayName: '5 Bedroom Private Pool Villa',
      slug: '5-bedroom-villa-private-pool',
      active: true,
      capacityAdults: 10,
      capacityChildren: 5,
    }
  ];

  for (const unit of unitsData) {
    db.insert(units).values(unit).run();
  }

  console.log('Seeded successfully.');
}

seed().catch(console.error);
