import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('DATABASE_URL environment variable is missing');
}
const dbPath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), dbUrl);
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const sqlite = new Database(dbPath);
const schemaPath = path.resolve(process.cwd(), 'src', 'db', 'schema.sql');
sqlite.exec(fs.readFileSync(schemaPath, 'utf8'));
const privateVilla = sqlite.prepare('SELECT id FROM units WHERE slug = ?').get('private-pool-villa') as { id: string } | undefined;
if (privateVilla) {
  sqlite.prepare('UPDATE units SET display_name = ?, active = 1 WHERE id = ?').run('Private Pool Villa', privateVilla.id);
} else {
  sqlite.prepare('INSERT INTO units (id, display_name, slug, capacity_adults, capacity_children, active, default_check_in_time, default_check_out_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    crypto.randomUUID(), 'Private Pool Villa', 'private-pool-villa', 10, 5, 1, '1:00 PM', '11:00 AM'
  );
}
sqlite.prepare("UPDATE units SET active = 0 WHERE slug != 'private-pool-villa'").run();
export const db = drizzle(sqlite, { schema });
