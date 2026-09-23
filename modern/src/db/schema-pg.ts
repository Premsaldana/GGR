import { boolean, index, integer, pgTable, real, text, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  role: text('role').notNull(), // 'owner_admin'
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
});

export const guests = pgTable('guests', {
  id: text('id').primaryKey(),
  fullName: text('full_name').notNull(),
  phone: text('phone'),
  email: text('email'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
});

export const units = pgTable('units', {
  id: text('id').primaryKey(),
  displayName: text('display_name').notNull(),
  slug: text('slug').notNull().unique(),
  propertyLabel: text('property_label'),
  capacityAdults: integer('capacity_adults'),
  capacityChildren: integer('capacity_children'),
  active: boolean('active').default(true),
  defaultCheckInTime: text('default_check_in_time'),
  defaultCheckOutTime: text('default_check_out_time'),
});

export const roomPrices = pgTable('room_prices', {
  id: text('id').primaryKey(),
  unitId: text('unit_id').notNull().references(() => units.id),
  rateCode: text('rate_code').notNull().default('standard'),
  date: text('date').notNull(),
  amountMinorUnits: integer('amount_minor_units').notNull(),
  currency: text('currency').notNull().default('INR'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
}, (table) => ({
  unitRateDateUnique: uniqueIndex('room_prices_unit_rate_date_unique').on(table.unitId, table.rateCode, table.date),
  dateUnitIndex: index('room_prices_date_unit_idx').on(table.date, table.unitId),
}));

export const roomAvailability = pgTable('room_availability', {
  id: text('id').primaryKey(),
  unitId: text('unit_id').notNull().references(() => units.id),
  date: text('date').notNull(),
  status: text('status').notNull().default('sold_off'),
  reason: text('reason'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
}, (table) => ({
  unitDateUnique: uniqueIndex('room_availability_unit_date_unique').on(table.unitId, table.date),
  dateUnitIndex: index('room_availability_date_unit_idx').on(table.date, table.unitId),
}));

export const reservations = pgTable('reservations', {
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
  advanceReceivedAt: timestamp('advance_received_at', { withTimezone: true, mode: 'date' }),
  notes: text('notes'),
  createdBy: text('created_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
});

export const reservationLineItems = pgTable('reservation_line_items', {
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

export const invoices = pgTable('invoices', {
  id: text('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  reservationId: text('reservation_id').notNull().references(() => reservations.id),
  version: integer('version').notNull(),
  status: text('status').notNull(), // 'draft', 'issued', 'cancelled'
  issuedAt: timestamp('issued_at', { withTimezone: true, mode: 'date' }),
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
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  parentInvoiceId: text('parent_invoice_id'),
  finalizedAt: timestamp('finalized_at', { withTimezone: true, mode: 'date' }),
  finalizedBy: text('finalized_by').references(() => users.id),
});

export const invoicePayments = pgTable('invoice_payments', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id').notNull().references(() => invoices.id),
  amountMinorUnits: integer('amount_minor_units').notNull(),
  paymentMode: text('payment_mode').notNull(),
  paymentStatus: text('payment_status').notNull(),
  receivedAt: timestamp('received_at', { withTimezone: true, mode: 'date' }),
  reference: text('reference'),
  notes: text('notes'),
  recordedBy: text('recorded_by').references(() => users.id),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
});

export const qrPaymentArtifacts = pgTable('qr_payment_artifacts', {
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
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
});

export const shareLinks = pgTable('share_links', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id').notNull().references(() => invoices.id),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  createdBy: text('created_by').references(() => users.id),
});

export const auditEvents = pgTable('audit_events', {
  id: text('id').primaryKey(),
  actorUserId: text('actor_user_id').references(() => users.id),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  eventType: text('event_type').notNull(),
  beforeJson: text('before_json'),
  afterJson: text('after_json'),
  requestId: text('request_id'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
});

export const authChallenges = pgTable('auth_challenges', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  otpHash: text('otp_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
  attempts: integer('attempts').notNull().default(0),
  consumed: boolean('consumed').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
});

export const paymentProofs = pgTable('payment_proofs', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id').notNull().references(() => invoices.id),
  shareLinkId: text('share_link_id').notNull().references(() => shareLinks.id),
  storageProvider: text('storage_provider').notNull(), // 'local' | 's3'
  storageKey: text('storage_key').notNull(),
  mimeType: text('mime_type').notNull(),
  sizeBytes: integer('size_bytes').notNull(),
  status: text('status').notNull(), // 'pending_review', 'verified', 'rejected', 'resubmit_requested'
  submittedAt: timestamp('submitted_at', { withTimezone: true, mode: 'date' }).notNull(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'date' }),
  reviewedBy: text('reviewed_by').references(() => users.id),
  adminNote: text('admin_note'),
  verifiedAmountMinorUnits: integer('verified_amount_minor_units'),
  paymentMode: text('payment_mode'),
  paymentReference: text('payment_reference'),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
});

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: text('id').primaryKey(),
  endpoint: text('endpoint').notNull().unique(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull(),
});
