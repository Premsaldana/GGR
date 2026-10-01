-- Phase 1: automated UPI attempt/event ledger and idempotent payment origins.
-- Run the duplicate checks below before applying the unique indexes in an existing database.
-- SELECT reference, count(*) FROM invoice_payments WHERE reference IS NOT NULL GROUP BY reference HAVING count(*) > 1;

CREATE TABLE IF NOT EXISTS public.payment_attempts (
  id text PRIMARY KEY,
  invoice_id text NOT NULL REFERENCES public.invoices(id),
  invoice_version integer NOT NULL,
  provider text NOT NULL,
  provider_ref text,
  amount_minor_units integer NOT NULL CHECK (amount_minor_units > 0),
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'created',
  upi_uri text,
  expires_at timestamptz NOT NULL,
  idempotency_key text NOT NULL UNIQUE,
  provider_payment_id text,
  paid_amount_minor_units integer,
  utr text,
  paid_at timestamptz,
  failure_code text,
  last_checked_at timestamptz,
  created_by text REFERENCES public.users(id),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS payment_attempts_provider_ref_uq ON public.payment_attempts(provider, provider_ref) WHERE provider_ref IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS payment_attempts_provider_payment_uq ON public.payment_attempts(provider, provider_payment_id) WHERE provider_payment_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS payment_attempts_one_active_uq ON public.payment_attempts(invoice_id) WHERE status IN ('created', 'pending');
CREATE INDEX IF NOT EXISTS payment_attempts_status_expiry_idx ON public.payment_attempts(status, expires_at);

CREATE TABLE IF NOT EXISTS public.payment_events (
  id text PRIMARY KEY,
  provider text NOT NULL,
  provider_event_id text NOT NULL,
  event_type text NOT NULL,
  attempt_id text REFERENCES public.payment_attempts(id),
  signature_valid boolean NOT NULL,
  payload jsonb NOT NULL,
  outcome text,
  error text,
  received_at timestamptz NOT NULL,
  processed_at timestamptz,
  UNIQUE (provider, provider_event_id)
);

ALTER TABLE public.invoice_payments ADD COLUMN IF NOT EXISTS attempt_id text REFERENCES public.payment_attempts(id);
ALTER TABLE public.invoice_payments ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';
ALTER TABLE public.invoice_payments ADD COLUMN IF NOT EXISTS provider_payment_id text;
CREATE UNIQUE INDEX IF NOT EXISTS invoice_payments_provider_payment_uq ON public.invoice_payments(provider_payment_id) WHERE provider_payment_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS invoice_payments_upi_reference_uq ON public.invoice_payments(reference) WHERE payment_mode = 'UPI' AND reference IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS payment_proofs_one_pending_uq ON public.payment_proofs(invoice_id) WHERE status = 'pending_review';
CREATE UNIQUE INDEX IF NOT EXISTS qr_artifacts_invoice_version_uq ON public.qr_payment_artifacts(invoice_id, artifact_version);
