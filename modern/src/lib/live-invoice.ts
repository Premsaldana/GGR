export type InvoicePaymentState = 'payment_due' | 'partially_paid' | 'paid' | 'cancelled';

export type LiveInvoiceRecord = {
  id: string;
  status: string;
  totalMinorUnits: number;
  advanceMinorUnits: number;
};

export type LivePaymentRecord = {
  invoiceId: string;
  amountMinorUnits: number;
  paymentStatus: string;
  reference: string | null;
};

export type LiveProofRecord = {
  invoiceId: string;
  status: string;
  verifiedAmountMinorUnits: number | null;
  paymentReference: string | null;
};

export type LiveInvoiceFinancials = {
  appliedMinorUnits: number;
  outstandingMinorUnits: number;
  paymentState: InvoicePaymentState;
};

function normalizeReference(reference: string | null): string | null {
  const normalized = reference?.trim().toLowerCase();
  return normalized || null;
}

export function calculateLiveInvoiceFinancials(
  invoice: LiveInvoiceRecord,
  payments: LivePaymentRecord[],
  proofs: LiveProofRecord[],
): LiveInvoiceFinancials {
  const completedPayments = payments.filter((payment) => (
    payment.invoiceId === invoice.id && payment.paymentStatus === 'completed'
  ));
  const completedReferences = new Set(
    completedPayments
      .map((payment) => normalizeReference(payment.reference))
      .filter((reference): reference is string => reference !== null),
  );

  const paymentTotal = completedPayments.reduce(
    (total, payment) => total + Math.max(0, payment.amountMinorUnits),
    0,
  );
  const countedReferences = new Set(completedReferences);
  const verifiedProofTotal = proofs.reduce((total, proof) => {
    if (proof.invoiceId !== invoice.id || proof.status !== 'verified') return total;
    const reference = normalizeReference(proof.paymentReference);
    if (reference) {
      if (countedReferences.has(reference)) return total;
      countedReferences.add(reference);
    }
    return total + Math.max(0, proof.verifiedAmountMinorUnits ?? 0);
  }, 0);

  const totalMinorUnits = Math.max(0, invoice.totalMinorUnits);
  const rawAppliedMinorUnits = Math.max(0, invoice.advanceMinorUnits) + paymentTotal + verifiedProofTotal;
  const appliedMinorUnits = Math.min(totalMinorUnits, rawAppliedMinorUnits);
  const outstandingMinorUnits = invoice.status === 'cancelled'
    ? 0
    : Math.max(0, totalMinorUnits - rawAppliedMinorUnits);

  let paymentState: InvoicePaymentState = 'payment_due';
  if (invoice.status === 'cancelled') paymentState = 'cancelled';
  else if (outstandingMinorUnits === 0) paymentState = 'paid';
  else if (appliedMinorUnits > 0) paymentState = 'partially_paid';

  return { appliedMinorUnits, outstandingMinorUnits, paymentState };
}

export function buildLiveInvoiceFinancials(
  invoices: LiveInvoiceRecord[],
  payments: LivePaymentRecord[],
  proofs: LiveProofRecord[],
): Map<string, LiveInvoiceFinancials> {
  const paymentsByInvoice = new Map<string, LivePaymentRecord[]>();
  const proofsByInvoice = new Map<string, LiveProofRecord[]>();

  for (const payment of payments) {
    const current = paymentsByInvoice.get(payment.invoiceId) ?? [];
    current.push(payment);
    paymentsByInvoice.set(payment.invoiceId, current);
  }
  for (const proof of proofs) {
    const current = proofsByInvoice.get(proof.invoiceId) ?? [];
    current.push(proof);
    proofsByInvoice.set(proof.invoiceId, current);
  }

  return new Map(invoices.map((invoice) => [
    invoice.id,
    calculateLiveInvoiceFinancials(
      invoice,
      paymentsByInvoice.get(invoice.id) ?? [],
      proofsByInvoice.get(invoice.id) ?? [],
    ),
  ]));
}
