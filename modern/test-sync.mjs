
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { sqliteTable, integer } from 'drizzle-orm/sqlite-core';
const sqlite = new Database(':memory:');
const db = drizzle(sqlite);
const users = sqliteTable('users', { id: integer('id').primaryKey() });
sqlite.exec('CREATE TABLE users (id INTEGER PRIMARY KEY)');
let res;
db.transaction((tx) => {
  tx.insert(users).values({id: 1}).run();
  res = tx.select().from(users).get();
});
console.log('Result:', res);

