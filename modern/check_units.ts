import { db } from './src/db';
import { units } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function check() {
  const allUnits = db.select().from(units).all();
  console.log("All Units:", allUnits);
}

check().catch(console.error);
