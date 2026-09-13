import { drizzle as drizzleSqlite } from 'drizzle-orm/better-sqlite3';
import { drizzle as drizzlePostgres } from 'drizzle-orm/node-postgres';
import Database from 'better-sqlite3';
import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import * as sqliteSchema from './schema-sqlite';
import * as postgresSchema from './schema-pg';
import { assertProviderMatchesUrl, getDatabaseProvider } from './runtime';

const provider = getDatabaseProvider();
const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) throw new Error('DATABASE_URL environment variable is missing');
assertProviderMatchesUrl(provider, dbUrl);

export const databaseProvider = provider;
export let dbReady: Promise<unknown> = Promise.resolve();
export let postgresPool: Pool | undefined;

function bootstrapSQLite() {
  const dbPath = path.resolve(/*turbopackIgnore: true*/ process.cwd(), dbUrl as string);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  const sqlite = new Database(dbPath);
  sqlite.pragma('foreign_keys = ON');
  sqlite.exec(fs.readFileSync(path.resolve(process.cwd(), 'src', 'db', 'schema.sql'), 'utf8'));
  const privateVilla = sqlite.prepare('SELECT id FROM units WHERE slug = ?').get('private-pool-villa') as { id: string } | undefined;
  if (privateVilla) {
    sqlite.prepare('UPDATE units SET display_name = ?, active = 1 WHERE id = ?').run('Private Pool Villa', privateVilla.id);
  } else {
    sqlite.prepare('INSERT INTO units (id, display_name, slug, capacity_adults, capacity_children, active, default_check_in_time, default_check_out_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      crypto.randomUUID(), 'Private Pool Villa', 'private-pool-villa', 10, 5, 1, '1:00 PM', '11:00 AM'
    );
  }
  sqlite.prepare("UPDATE units SET active = 0 WHERE slug != 'private-pool-villa'").run();
  return drizzleSqlite(sqlite, { schema: sqliteSchema });
}

function bootstrapPostgres() {
  const pool = new Pool({ connectionString: dbUrl });
  postgresPool = pool;
  const schemaSql = fs.readFileSync(path.resolve(process.cwd(), 'src', 'db', 'schema-postgres.sql'), 'utf8');
  dbReady = pool.query(schemaSql).then(async () => {
    await pool.query(`INSERT INTO units (id, display_name, slug, capacity_adults, capacity_children, active, default_check_in_time, default_check_out_time)
      VALUES ($1, 'Private Pool Villa', 'private-pool-villa', 10, 5, true, '1:00 PM', '11:00 AM')
      ON CONFLICT (slug) DO UPDATE SET display_name = EXCLUDED.display_name, active = true`, [crypto.randomUUID()]);
    await pool.query("UPDATE units SET active = false WHERE slug != 'private-pool-villa'");
  }).catch((error) => console.error('PostgreSQL schema bootstrap failed:', error));
  return drizzlePostgres(pool, { schema: postgresSchema });
}

export const db = (provider === 'postgres' ? bootstrapPostgres() : bootstrapSQLite()) as ReturnType<typeof drizzleSqlite>;
