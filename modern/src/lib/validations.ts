import { z } from 'zod';

export const emailSchema = z.string().email("Invalid email format");
export const phoneSchema = z.string().regex(/^\+?[0-9\s\-()]{7,15}$/, "Invalid phone number");
export const minorUnitsSchema = z.number().int().nonnegative("Amount must be a non-negative integer in minor units (paise)");
export const rupeesSchema = z.number().nonnegative("Amount cannot be negative");
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

export const lineItemSchema = z.object({
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  quantity: z.number().int().positive("Quantity must be greater than 0"),
  rateMinorUnits: minorUnitsSchema,
  taxRate: z.number().nonnegative("Tax rate cannot be negative").optional(),
});

export const invoiceCalculationSchema = z.object({
  lineItems: z.array(lineItemSchema),
  advanceReceivedMinorUnits: minorUnitsSchema.optional(),
  refundableSecurityDepositMinorUnits: minorUnitsSchema.optional(),
});

export const reservationFormSchema = z.object({
  unitId: z.string().min(1, 'Unit is required'),
  guestName: z.string().min(2, 'Guest name is required'),
  phone: phoneSchema.optional().or(z.literal('')),
  email: emailSchema.optional().or(z.literal('')),
  checkInDate: dateSchema,
  checkOutDate: dateSchema,
  adults: z.number().int().min(1),
  children: z.number().int().min(0),
  bookingStatus: z.enum(['pending', 'confirmed', 'cancelled']),
  paymentMode: z.enum(['UPI', 'CASH', 'BANK_TRANSFER']).optional().or(z.literal('')),
  advanceReceived: rupeesSchema.optional(),
  advanceReceivedAt: z.string().optional(),
  notes: z.string().optional(),
  
  // Pricing inputs
  accommodationRate: rupeesSchema,
  isNightlyRate: z.boolean(),
  extraPersonQuantity: z.number().int().min(0).default(0),
  extraPersonRate: rupeesSchema.default(800),
  earlyCheckIn: rupeesSchema.default(0),
  lateCheckOut: rupeesSchema.default(0),
  securityDeposit: rupeesSchema.default(5000),
  taxPercentage: z.number().min(0).max(100).default(0),
  additionalServices: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().int().min(1),
    rate: rupeesSchema,
  })).optional()
}).refine(data => {
  return new Date(data.checkInDate) < new Date(data.checkOutDate);
}, { message: "Check-out date must be after check-in date", path: ["checkOutDate"] });

export const adminLoginSchema = z.object({
  email: emailSchema,
});

export const qrGenerationSchema = z.object({
  invoiceId: z.string().uuid("Invalid invoice ID"),
  amountMinorUnits: minorUnitsSchema,
  upiId: z.string().min(5, "UPI ID is required"),
  payeeName: z.string().min(2, "Payee name is required"),
});

export const uploadProofSchema = z.object({
  file: z.any().refine(file => file instanceof File, "Must be a file").refine(file => file.size <= 5 * 1024 * 1024, "File size must be less than 5MB"),
  token: z.string().min(1, "Token is required"),
});

export const adminReviewProofSchema = z.object({
  proofId: z.string().uuid(),
  verifyAmountMinorUnits: minorUnitsSchema,
  paymentMode: z.string().min(2),
  paymentReference: z.string().optional(),
  adminNote: z.string().optional(),
});

export const rejectProofSchema = z.object({
  proofId: z.string().uuid(),
  adminNote: z.string().min(1, "Admin note is required for rejection"),
  requestResubmit: z.boolean(),
});
