export interface LineItemInput {
  category: string;
  description: string;
  quantity: number;
  rateMinorUnits: number;
  taxRate?: number;
}

export interface InvoiceCalculationInput {
  lineItems: LineItemInput[];
  advanceReceivedMinorUnits?: number;
  refundableSecurityDepositMinorUnits?: number;
}

export interface InvoiceCalculationResult {
  subtotalMinorUnits: number;
  taxMinorUnits: number;
  securityDepositMinorUnits: number;
  totalMinorUnits: number;
  advanceMinorUnits: number;
  balanceMinorUnits: number;
  overpaymentMinorUnits: number;
  amountInWords: string;
}

export function toPaise(rupees: number): number {
  if (typeof rupees !== 'number' || isNaN(rupees) || !isFinite(rupees) || rupees < 0) {
    throw new Error('Invalid rupee amount');
  }
  return Math.round(rupees * 100);
}

// Simple Indian numbering system amount in words
export function convertRupeesToWords(amount: number): string {
  if (amount === 0) return 'Zero Rupees Only';
  if (amount < 0) return 'Negative Amount';

  const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const double = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const formatTens = (num: number): string => {
    if (num < 10) return single[num];
    if (num < 20) return double[num - 10];
    return (tens[Math.floor(num / 10)] + ' ' + single[num % 10]).trim();
  };

  const formatHundreds = (num: number): string => {
    if (num > 99) {
      return (single[Math.floor(num / 100)] + ' Hundred ' + formatTens(num % 100)).trim();
    }
    return formatTens(num);
  };

  let str = '';
  
  if (amount > 9999999) {
    str += formatHundreds(Math.floor(amount / 10000000)) + ' Crore ';
    amount %= 10000000;
  }
  if (amount > 99999) {
    str += formatHundreds(Math.floor(amount / 100000)) + ' Lakh ';
    amount %= 100000;
  }
  if (amount > 999) {
    str += formatHundreds(Math.floor(amount / 1000)) + ' Thousand ';
    amount %= 1000;
  }
  if (amount > 0) {
    str += formatHundreds(amount);
  }

  return str.trim() + ' Rupees Only';
}

export function calculateInvoice(input: InvoiceCalculationInput): InvoiceCalculationResult {
  let subtotalMinorUnits = 0;
  let taxMinorUnits = 0;

  for (const item of input.lineItems) {
    if (item.quantity < 0 || item.rateMinorUnits < 0) {
      throw new Error("Invalid negative values in line items");
    }
    const lineAmount = item.quantity * item.rateMinorUnits;
    subtotalMinorUnits += lineAmount;

    if (item.taxRate && item.taxRate > 0) {
      taxMinorUnits += Math.round(lineAmount * (item.taxRate / 100));
    }
  }

  const securityDepositMinorUnits = input.refundableSecurityDepositMinorUnits ?? (5000 * 100); // default 5000 INR
  const advanceMinorUnits = input.advanceReceivedMinorUnits || 0;

  // The total amount due INCLUDES the security deposit (as it needs to be collected)
  const totalMinorUnits = subtotalMinorUnits + taxMinorUnits + securityDepositMinorUnits;
  
  // Balance due cannot be negative
  const balanceMinorUnits = Math.max(0, totalMinorUnits - advanceMinorUnits);
  const overpaymentMinorUnits = Math.max(0, advanceMinorUnits - totalMinorUnits);

  return {
    subtotalMinorUnits,
    taxMinorUnits,
    securityDepositMinorUnits,
    totalMinorUnits,
    advanceMinorUnits,
    balanceMinorUnits,
    overpaymentMinorUnits,
    amountInWords: convertRupeesToWords(Math.floor(totalMinorUnits / 100)),
  };
}
