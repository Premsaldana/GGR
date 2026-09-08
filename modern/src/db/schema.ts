import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  role: text('role').notNull(), // 'owner_admin'
  totpSecret: text('totp_secret'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const guests = sqliteTable('guests', {
  id: text('id').primaryKey(),
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  email: text('email'),
  notes: text('notes'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const units = sqliteTable('units', {
  id: text('id').primaryKey(),
  displayName: text('display_name').notNull(),
  slug: text('slug').notNull().unique(),
  propertyLabel: text('property_label'),
  capacityAdults: integer('capacity_adults'),
  capacityChildren: integer('capacity_children'),
  active: integer('active', { mode: 'boolean' }).default(true),
  defaultCheckInTime: text('default_check_in_time'),
  defaultCheckOutTime: text('default_check_out_time'),
});

export const reservations = sqliteTable('reservations', {
  id: text('id').primaryKey(),
  reservationNumber: text('reservation_number').notNull().unique(),
  guestId: text('guest_id').notNull().references(() => guests.id),
  unitId: text('unit_id').notNull().references(() => units.id),
  checkInDate: text('check_in_date').notNull(), // YYYY-MM-DD
  checkOutDate: text('check_out_date').notNull(), // YYYY-MM-DD
  bookingStatus: text('booking_status').notNull(), // 'pending', 'confirmed', 'cancelled'
  paymentStatus: text('payment_status').notNull(), // 'not_requested', 'qr_generated', 'paid', etc.
  adults: integer('adults').notNull(),
  children: integer('children').notNull(),
  securityDepositMinorUnits: integer('security_deposit_minor_units'),
  paymentMode: text('payment_mode'), // 'UPI', 'CASH', 'BANK_TRANSFER'
  advanceReceivedMinorUnits: integer('advance_received_minor_units'),
  advanceReceivedAt: integer('advance_received_at', { mode: 'timestamp' }),
  notes: text('notes'),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

export const reservationLineItems = sqliteTable('reservation_line_items', {
  id: text('id').primaryKey(),
  reservationId: text('reservation_id').notNull().references(() => reservations.id),
  category: text('category').notNull(),
  description: text('description').notNull(),
  quantity: integer('quantity').notNull(),
  unitLabel: text('unit_label'),
  rateMinorUnits: integer('rate_minor_units').notNull(),
  taxRate: real('tax_rate'),
  amountMinorUnits: integer('amount_minor_units').notNull(),
  sortOrder: integer('sort_order').notNull(),
});

export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  reservationId: text('reservation_id').notNull().references(() => reservations.id),
  version: integer('version').notNull(),
  status: text('status').notNull(), // 'draft', 'issued', 'cancelled'
  issuedAt: integer('issued_at', { mode: 'timestamp' }),
  currency: text('currency').notNull().default('INR'),
  subtotalMinorUnits: integer('subtotal_minor_units').notNull(),
  taxMinorUnits: integer('tax_minor_units').notNull(),
  securityDepositMinorUnits: integer('security_deposit_minor_units').notNull(),
  totalMinorUnits: integer('total_minor_units').notNull(),
  advanceMinorUnits: integer('advance_minor_units').notNull(),
  balanceMinorUnits: integer('balance_minor_units').notNull(),
  amountInWords: text('amount_in_words'),
  snapshotJson: text('snapshot_json'), // Stringified JSON of invoice view
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  parentInvoiceId: text('parent_invoice_id'),
  finalizedAt: integer('finalized_at', { mode: 'timestamp' }),
  finalizedBy: text('finalized_by').references(() => users.id),
});

export const invoicePayments = sqliteTable('invoice_payments', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id').notNull().references(() => invoices.id),
  amountMinorUnits: integer('amount_minor_units').notNull(),
  paymentMode: text('payment_mode').notNull(),
  paymentStatus: text('payment_status').notNull(),
  receivedAt: integer('received_at', { mode: 'timestamp' }),
  reference: text('reference'),
  notes: text('notes'),
  recordedBy: text('recorded_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const qrPaymentArtifacts = sqliteTable('qr_payment_artifacts', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id').notNull().references(() => invoices.id),
  amountMinorUnits: integer('amount_minor_units').notNull(),
  upiId: text('upi_id').notNull(),
  payeeName: text('payee_name').notNull(),
  currency: text('currency').notNull().default('INR'),
  transactionNote: text('transaction_note'),
  upiUri: text('upi_uri').notNull(),
  qrFormat: text('qr_format').notNull(),
  artifactVersion: integer('artifact_version').notNull(),
  createdBy: text('created_by').references(() => users.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const shareLinks = sqliteTable('share_links', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id').notNull().references(() => invoices.id),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  createdBy: text('created_by').references(() => users.id),
});

export const auditEvents = sqliteTable('audit_events', {
  id: text('id').primaryKey(),
  actorUserId: text('actor_user_id').references(() => users.id),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  eventType: text('event_type').notNull(),
  beforeJson: text('before_json'),
  afterJson: text('after_json'),
  requestId: text('request_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const recoveryCodes = sqliteTable('recovery_codes', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  codeHash: text('code_hash').notNull(),
  used: integer('used', { mode: 'boolean' }).default(false),
  usedAt: integer('used_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const authChallenges = sqliteTable('auth_challenges', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  otpHash: text('otp_hash').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  attempts: integer('attempts').notNull().default(0),
  consumed: integer('consumed', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const paymentProofs = sqliteTable('payment_proofs', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id').notNull().references(() => invoices.id),
  shareLinkId: text('share_link_id').notNull().references(() => shareLinks.id),
  storageProvider: text('storage_provider').notNull(), // 'local' | 's3'
  storageKey: text('storage_key').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  status: text('status').notNull(), // 'pending_review', 'verified', 'rejected', 'resubmit_requested'
  submittedAt: integer('submitted_at', { mode: 'timestamp' }).notNull(),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  reviewedBy: text('reviewed_by').references(() => users.id),
  adminNote: text('admin_note'),
  verifiedAmountMinorUnits: integer('verified_amount_minor_units'),
  paymentMode: text('payment_mode'),
  paymentReference: text('payment_reference'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

