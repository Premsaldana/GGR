
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
const sqlite = new Database(':memory:');
const db = drizzle(sqlite);
async function run() {
  try {
    await db.transaction(async (tx) => {
      console.log('Inside tx');
    });
    console.log('Success');
  } catch(e) {
    console.error('Error:', e.message);
  }
}
run();

