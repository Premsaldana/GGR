PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS guests (
  id TEXT PRIMARY KEY NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  notes TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS units (
  id TEXT PRIMARY KEY NOT NULL,
  display_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  property_label TEXT,
  capacity_adults INTEGER,
  capacity_children INTEGER,
  active INTEGER DEFAULT 1,
  default_check_in_time TEXT,
  default_check_out_time TEXT
);
CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY NOT NULL,
  reservation_number TEXT NOT NULL UNIQUE,
  guest_id TEXT NOT NULL REFERENCES guests(id),
  unit_id TEXT NOT NULL REFERENCES units(id),
  check_in_date TEXT NOT NULL,
  check_out_date TEXT NOT NULL,
  booking_status TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  adults INTEGER NOT NULL,
  children INTEGER NOT NULL,
  security_deposit_minor_units INTEGER,
  payment_mode TEXT,
  advance_received_minor_units INTEGER,
  advance_received_at INTEGER,
  notes TEXT,
  created_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS reservation_line_items (
  id TEXT PRIMARY KEY NOT NULL,
  reservation_id TEXT NOT NULL REFERENCES reservations(id),
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_label TEXT,
  rate_minor_units INTEGER NOT NULL,
  tax_rate REAL,
  amount_minor_units INTEGER NOT NULL,
  sort_order INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY NOT NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  reservation_id TEXT NOT NULL REFERENCES reservations(id),
  version INTEGER NOT NULL,
  status TEXT NOT NULL,
  issued_at INTEGER,
  currency TEXT NOT NULL DEFAULT 'INR',
  subtotal_minor_units INTEGER NOT NULL,
  tax_minor_units INTEGER NOT NULL,
  security_deposit_minor_units INTEGER NOT NULL,
  total_minor_units INTEGER NOT NULL,
  advance_minor_units INTEGER NOT NULL,
  balance_minor_units INTEGER NOT NULL,
  amount_in_words TEXT,
  snapshot_json TEXT,
  created_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL,
  parent_invoice_id TEXT,
  finalized_at INTEGER,
  finalized_by TEXT REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS invoice_payments (
  id TEXT PRIMARY KEY NOT NULL,
  invoice_id TEXT NOT NULL REFERENCES invoices(id),
  amount_minor_units INTEGER NOT NULL,
  payment_mode TEXT NOT NULL,
  payment_status TEXT NOT NULL,
  received_at INTEGER,
  reference TEXT,
  notes TEXT,
  recorded_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS qr_payment_artifacts (
  id TEXT PRIMARY KEY NOT NULL,
  invoice_id TEXT NOT NULL REFERENCES invoices(id),
  amount_minor_units INTEGER NOT NULL,
  upi_id TEXT NOT NULL,
  payee_name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  transaction_note TEXT,
  upi_uri TEXT NOT NULL,
  qr_format TEXT NOT NULL,
  artifact_version INTEGER NOT NULL,
  created_by TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS share_links (
  id TEXT PRIMARY KEY NOT NULL,
  invoice_id TEXT NOT NULL REFERENCES invoices(id),
  token TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  created_by TEXT REFERENCES users(id)
);
CREATE TABLE IF NOT EXISTS audit_events (
  id TEXT PRIMARY KEY NOT NULL,
  actor_user_id TEXT REFERENCES users(id),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  before_json TEXT,
  after_json TEXT,
  request_id TEXT,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS auth_challenges (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL REFERENCES users(id),
  otp_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  consumed INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS payment_proofs (
  id TEXT PRIMARY KEY NOT NULL,
  invoice_id TEXT NOT NULL REFERENCES invoices(id),
  share_link_id TEXT NOT NULL REFERENCES share_links(id),
  storage_provider TEXT NOT NULL,
  storage_key TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  status TEXT NOT NULL,
  submitted_at INTEGER NOT NULL,
  reviewed_at INTEGER,
  reviewed_by TEXT REFERENCES users(id),
  admin_note TEXT,
  verified_amount_minor_units INTEGER,
  payment_mode TEXT,
  payment_reference TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
