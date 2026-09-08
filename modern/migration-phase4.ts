import Database from 'better-sqlite3';

const db = new Database('local.sqlite');

try {
  // Add columns to invoices
  try {
    db.exec(`ALTER TABLE invoices ADD COLUMN parent_invoice_id TEXT;`);
    console.log('Added parent_invoice_id to invoices');
  } catch (e: any) {
    console.log('parent_invoice_id already exists or error:', e.message);
  }

  try {
    db.exec(`ALTER TABLE invoices ADD COLUMN finalized_at INTEGER;`);
    console.log('Added finalized_at to invoices');
  } catch (e: any) {
    console.log('finalized_at already exists or error:', e.message);
  }

  try {
    db.exec(`ALTER TABLE invoices ADD COLUMN finalized_by TEXT;`);
    console.log('Added finalized_by to invoices');
  } catch (e: any) {
    console.log('finalized_by already exists or error:', e.message);
  }

  console.log('Migration complete.');
} catch (err) {
  console.error('Migration failed:', err);
} finally {
  db.close();
}
