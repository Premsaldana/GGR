import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('DATABASE_URL environment variable is missing');
}
const dbPath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), dbUrl);
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
