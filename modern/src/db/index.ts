import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('DATABASE_URL environment variable is missing');
}
const dbPath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), dbUrl);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const sqlite = new Database(dbPath);
const schemaPath = path.resolve(process.cwd(), 'src', 'db', 'schema.sql');
sqlite.exec(fs.readFileSync(schemaPath, 'utf8'));
export const db = drizzle(sqlite, { schema });
