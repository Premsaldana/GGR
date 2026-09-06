'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { createReservation } from '../(protected)/calendar/actions';
import { format, differenceInCalendarDays } from 'date-fns';
import { calculateInvoice } from '@/lib/invoice';

const formSchema = z.object({
  unitId: z.string().min(1, 'Unit is required'),
  guestName: z.string().min(2, 'Guest name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email').or(z.literal('')).optional(),
  checkInDate: z.string(),
  checkOutDate: z.string().min(1, 'Check-out is required'),
  adults: z.number().min(1),
  children: z.number().min(0),
  bookingStatus: z.enum(['pending', 'confirmed', 'cancelled']),
  paymentMode: z.enum(['UPI', 'CASH', 'BANK_TRANSFER']).optional().or(z.literal('')),
  advanceReceivedMinorUnits: z.number().min(0).optional(),
  advanceReceivedAt: z.string().optional(),
  notes: z.string().optional(),
  
  // Pricing inputs
  accommodationRateMinorUnits: z.number().min(0),
  isNightlyRate: z.boolean(),
  extraPersonQuantity: z.number().min(0).default(0),
  extraPersonRateMinorUnits: z.number().min(0).default(80000),
  earlyCheckInMinorUnits: z.number().min(0).default(0),
  lateCheckOutMinorUnits: z.number().min(0).default(0),
  securityDepositMinorUnits: z.number().min(0).default(500000),
  taxPercentage: z.number().min(0).default(0),
  additionalServices: z.array(z.object({
    description: z.string().min(1),
    quantity: z.number().min(1),
    rateMinorUnits: z.number().min(0),
  })).optional()
});

type FormData = z.infer<typeof formSchema>;

export default function ReservationForm({ 
  checkInDate, 
  units, 
  onClose, 
  onSuccess 
}: { 
  checkInDate: Date; 
  units: { id: string; displayName: string }[]; 
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [serverError, setServerError] = useState<{ message: string; type: string } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdRef, setCreatedRef] = useState('');
  const [createdId, setCreatedId] = useState('');

  const { register, control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      checkInDate: format(checkInDate, 'yyyy-MM-dd'),
      checkOutDate: format(new Date(checkInDate.getTime() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      adults: 2,
      children: 0,
      bookingStatus: 'pending',
      isNightlyRate: true,
      accommodationRateMinorUnits: 0,
      extraPersonQuantity: 0,
      extraPersonRateMinorUnits: 80000,
      earlyCheckInMinorUnits: 0,
      lateCheckOutMinorUnits: 0,
      securityDepositMinorUnits: 500000,
      taxPercentage: 0,
      additionalServices: []
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "additionalServices" });

  const onSubmit = async (data: FormData) => {
    setServerError(null);
    const payload = {
      ...data,
      paymentMode: data.paymentMode === '' ? undefined : (data.paymentMode as "UPI" | "CASH" | "BANK_TRANSFER" | undefined)
    };
    const res = await createReservation(payload);
    if ('error' in res && res.error) {
      setServerError({ message: res.error as string, type: res.type || 'ERROR' });
    } else if ('reservationNumber' in res) {
      setIsSuccess(true);
      setCreatedRef(res.reservationNumber as string);
      setCreatedId((res as any).reservationId);
    }
  };

  const formValues = watch();
  const advanceMinor = formValues.advanceReceivedMinorUnits || 0;
  
  let liveSummary = null;
  try {
    const cin = new Date(formValues.checkInDate);
    const cout = new Date(formValues.checkOutDate);
    let nights = Math.max(1, differenceInCalendarDays(cout, cin));
    if (isNaN(nights)) nights = 1;

    const generatedLineItems = [];
    const taxRate = isNaN(formValues.taxPercentage || 0) ? 0 : (formValues.taxPercentage || 0);

    const accomRate = isNaN(formValues.accommodationRateMinorUnits || 0) ? 0 : (formValues.accommodationRateMinorUnits || 0);
    if (formValues.isNightlyRate) {
      generatedLineItems.push({
        category: 'Accommodation',
        description: 'Rent',
        quantity: nights,
        rateMinorUnits: accomRate,
        taxRate
      });
    } else {
      generatedLineItems.push({
        category: 'Accommodation',
        description: 'Rent',
        quantity: 1,
        rateMinorUnits: accomRate,
        taxRate
      });
    }

    const epQty = isNaN(formValues.extraPersonQuantity || 0) ? 0 : (formValues.extraPersonQuantity || 0);
    const epRate = isNaN(formValues.extraPersonRateMinorUnits || 0) ? 0 : (formValues.extraPersonRateMinorUnits || 0);
    if (epQty > 0) {
      generatedLineItems.push({
        category: 'Additional charges',
        description: 'Extra Person',
        quantity: epQty,
        rateMinorUnits: epRate,
        taxRate
      });
    }

    const eciAmt = isNaN(formValues.earlyCheckInMinorUnits || 0) ? 0 : (formValues.earlyCheckInMinorUnits || 0);
    if (eciAmt > 0) {
      generatedLineItems.push({
        category: 'Additional charges',
        description: 'Early Check-in',
        quantity: 1,
        rateMinorUnits: eciAmt,
        taxRate
      });
    }

    const lcoAmt = isNaN(formValues.lateCheckOutMinorUnits || 0) ? 0 : (formValues.lateCheckOutMinorUnits || 0);
    if (lcoAmt > 0) {
      generatedLineItems.push({
        category: 'Additional charges',
        description: 'Late Check-out',
        quantity: 1,
        rateMinorUnits: lcoAmt,
        taxRate
      });
    }

    if (formValues.additionalServices) {
      for (const service of formValues.additionalServices) {
        const sQty = isNaN(service.quantity) ? 0 : service.quantity;
        const sRate = isNaN(service.rateMinorUnits) ? 0 : service.rateMinorUnits;
        generatedLineItems.push({
          category: 'Additional services',
          description: service.description || 'Service',
          quantity: sQty,
          rateMinorUnits: sRate,
          taxRate
        });
      }
    }

    const depositMinor = isNaN(formValues.securityDepositMinorUnits || 0) ? 0 : (formValues.securityDepositMinorUnits || 0);

    liveSummary = calculateInvoice({
      lineItems: generatedLineItems,
      advanceReceivedMinorUnits: isNaN(advanceMinor) ? 0 : advanceMinor,
      refundableSecurityDepositMinorUnits: depositMinor
    });
  } catch (e) {
    // ignore
  }

  if (isSuccess) {
    return (
      <div className="absolute inset-y-0 right-0 w-full md:w-[480px] bg-[var(--color-admin-shell)] shadow-2xl border-l border-[var(--color-admin-mist)] flex flex-col justify-center items-center p-8 z-50">
        <CheckCircle2 size={64} className="text-[var(--color-success)] mb-4" />
        <h3 className="font-[var(--font-display)] text-2xl font-semibold mb-2">Reservation Saved</h3>
        <p className="text-[var(--color-admin-sage)] mb-8 text-center">Reference: {createdRef}</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <a href={`/admin/reservations/${createdId}`} className="bg-[#233B35] text-white px-6 py-2 rounded-md text-center hover:bg-opacity-90">View Reservation</a>
          <a href={`/admin/reservations/${createdId}#invoice`} className="border border-[#233B35] text-[#233B35] px-6 py-2 rounded-md text-center hover:bg-[#F2EBE1]">Create/View Bill</a>
          <button onClick={onSuccess} className="text-gray-500 mt-4 underline hover:text-gray-700">Return to Calendar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-y-0 right-0 w-full md:w-[540px] bg-[var(--color-admin-shell)] shadow-2xl border-l border-[var(--color-admin-mist)] flex flex-col transform transition-transform z-50">
      <div className="flex justify-between items-center p-6 border-b border-[var(--color-admin-mist)]">
        <h3 className="font-[var(--font-display)] text-xl font-semibold">New Reservation</h3>
        <button onClick={onClose} className="p-2 text-[var(--color-admin-sage)] hover:text-black transition rounded-md hover:bg-[var(--color-admin-mist)]">
          <X size={20} />
        </button>
      </div>
      
      <div className="p-6 flex-1 overflow-auto bg-gray-50/50">
        <form id="reservation-form" onSubmit={handleSubmit(onSubmit as any)} className="space-y-6">
          
          {serverError && (
            <div className={`p-4 rounded-md border flex gap-3 ${serverError.type === 'CONFLICT' ? 'bg-orange-50 border-orange-200 text-orange-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
              <AlertTriangle size={20} className="shrink-0" />
              <p className="text-sm">{serverError.message}</p>
            </div>
          )}

          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-admin-sage)] border-b pb-1">Stay Details</h4>
            
            <div>
              <label className="block text-sm font-medium mb-1">Unit</label>
              <select {...register("unitId")} className="w-full px-3 py-2 border border-[var(--color-admin-mist)] rounded-md bg-white">
                <option value="">Select a unit...</option>
                {units.length === 0 && <option value="" disabled>No units configured. Add an active unit before creating a reservation.</option>}
                {units.map(u => <option key={u.id} value={u.id}>{u.displayName}</option>)}
              </select>
              {errors.unitId && <p className="text-red-500 text-xs mt-1">{errors.unitId.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Check-in</label>
                <input type="date" {...register("checkInDate")} className="w-full px-3 py-2 border border-[var(--color-admin-mist)] rounded-md bg-white" />
                {errors.checkInDate && <p className="text-red-500 text-xs mt-1">{errors.checkInDate.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Check-out</label>
                <input type="date" {...register("checkOutDate")} className="w-full px-3 py-2 border border-[var(--color-admin-mist)] rounded-md bg-white" />
                {errors.checkOutDate && <p className="text-red-500 text-xs mt-1">{errors.checkOutDate.message}</p>}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Adults</label>
                <input type="number" {...register("adults", { valueAsNumber: true })} className="w-full px-3 py-2 border border-[var(--color-admin-mist)] rounded-md bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Children</label>
                <input type="number" {...register("children", { valueAsNumber: true })} className="w-full px-3 py-2 border border-[var(--color-admin-mist)] rounded-md bg-white" />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-admin-sage)] border-b pb-1">Guest Details</h4>
            
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input type="text" {...register("guestName")} className="w-full px-3 py-2 border border-[var(--color-admin-mist)] rounded-md bg-white" placeholder="John Doe" />
              {errors.guestName && <p className="text-red-500 text-xs mt-1">{errors.guestName.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input type="tel" {...register("phone")} className="w-full px-3 py-2 border border-[var(--color-admin-mist)] rounded-md bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" {...register("email")} className="w-full px-3 py-2 border border-[var(--color-admin-mist)] rounded-md bg-white" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-admin-sage)] border-b pb-1">Demand-Based Pricing</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Accommodation Rate (paise)</label>
                <input type="number" {...register("accommodationRateMinorUnits", { valueAsNumber: true })} className="w-full px-3 py-2 border border-[var(--color-admin-mist)] rounded-md bg-white" placeholder="0" />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer text-sm">
                  <input type="checkbox" {...register("isNightlyRate")} className="rounded text-[#233B35] focus:ring-[#233B35]" />
                  <span>Multiply by Nights</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Extra Person Qty</label>
                <input type="number" {...register("extraPersonQuantity", { valueAsNumber: true })} className="w-full px-3 py-2 border border-[var(--color-admin-mist)] rounded-md bg-white" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Extra Person Rate (paise)</label>
                <input type="number" {...register("extraPersonRateMinorUnits", { valueAsNumber: true })} className="w-full px-3 py-2 border border-[var(--color-admin-mist)] rounded-md bg-white" placeholder="80000" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Early Check-in (paise)</label>
                <input type="number" {...register("earlyCheckInMinorUnits", { valueAsNumber: true })} className="w-full px-3 py-2 border border-[var(--color-admin-mist)] rounded-md bg-white" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Late Check-out (paise)</label>
                <input type="number" {...register("lateCheckOutMinorUnits", { valueAsNumber: true })} className="w-full px-3 py-2 border border-[var(--color-admin-mist)] rounded-md bg-white" placeholder="0" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Global Tax (GST %)</label>
                <input type="number" step="0.1" {...register("taxPercentage", { valueAsNumber: true })} className="w-full px-3 py-2 border border-[var(--color-admin-mist)] rounded-md bg-white" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Security Deposit (paise)</label>
                <input type="number" {...register("securityDepositMinorUnits", { valueAsNumber: true })} className="w-full px-3 py-2 border border-[var(--color-admin-mist)] rounded-md bg-white" placeholder="500000" />
              </div>
            </div>
            
            <div className="pt-2 border-t mt-2 border-[var(--color-admin-mist)]">
              <div className="flex justify-between items-center pb-2">
                <label className="block text-sm font-medium">Additional Services</label>
                <button type="button" onClick={() => append({ description: '', quantity: 1, rateMinorUnits: 0 })} className="text-xs text-[var(--color-admin-terracotta)] hover:underline flex items-center gap-1">
                  <Plus size={14} /> Add Service
                </button>
              </div>

              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start bg-white p-2 border border-[var(--color-admin-mist)] rounded-md mb-2">
                  <div className="flex-1 grid grid-cols-3 gap-2">
                    <input type="text" {...register(`additionalServices.${index}.description`)} placeholder="Description" className="w-full px-2 py-1 text-sm border rounded" />
                    <input type="number" {...register(`additionalServices.${index}.quantity`, { valueAsNumber: true })} placeholder="Qty" className="w-full px-2 py-1 text-sm border rounded" />
                    <input type="number" {...register(`additionalServices.${index}.rateMinorUnits`, { valueAsNumber: true })} placeholder="Rate (paise)" className="w-full px-2 py-1 text-sm border rounded" />
                  </div>
                  <button type="button" onClick={() => remove(index)} className="p-1 text-red-500 hover:bg-red-50 rounded mt-0.5">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {fields.length === 0 && <p className="text-xs text-[var(--color-admin-sage)] italic">No additional services.</p>}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-admin-sage)] border-b pb-1">Payment Options</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Advance Received (paise)</label>
                <input type="number" {...register("advanceReceivedMinorUnits", { valueAsNumber: true })} className="w-full px-3 py-2 border border-[var(--color-admin-mist)] rounded-md bg-white" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Advance Date</label>
                <input type="datetime-local" {...register("advanceReceivedAt")} className="w-full px-3 py-2 border border-[var(--color-admin-mist)] rounded-md bg-white" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Payment Mode</label>
                <select {...register("paymentMode")} className="w-full px-3 py-2 border border-[var(--color-admin-mist)] rounded-md bg-white">
                  <option value="">None</option>
                  <option value="UPI">UPI</option>
                  <option value="CASH">CASH</option>
                  <option value="BANK_TRANSFER">BANK TRANSFER</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Booking Status</label>
                <select {...register("bookingStatus")} className="w-full px-3 py-2 border border-[var(--color-admin-mist)] rounded-md bg-white">
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Internal Billing Notes</label>
              <textarea {...register("notes")} className="w-full px-3 py-2 border border-[var(--color-admin-mist)] rounded-md bg-white" placeholder="Notes..." rows={2} />
            </div>
          </div>

          {liveSummary && (
            <div className="bg-white border border-[var(--color-admin-mist)] p-4 rounded-md space-y-2 text-sm shadow-sm">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-admin-sage)] border-b pb-1 mb-2">Live Billing Summary</h4>
              <div className="flex justify-between"><span>Subtotal:</span> <span>₹{liveSummary.subtotalMinorUnits / 100}</span></div>
              <div className="flex justify-between"><span>Tax (GST):</span> <span>₹{liveSummary.taxMinorUnits / 100}</span></div>
              <div className="flex justify-between"><span>Security Deposit (Refundable):</span> <span>₹{liveSummary.securityDepositMinorUnits / 100}</span></div>
              <div className="flex justify-between font-bold border-t pt-1"><span>Total:</span> <span>₹{liveSummary.totalMinorUnits / 100}</span></div>
              <div className="flex justify-between text-green-700"><span>Advance Received:</span> <span>₹{liveSummary.advanceMinorUnits / 100}</span></div>
              <div className="flex justify-between text-red-700 font-bold border-t pt-1"><span>Balance Due:</span> <span>₹{liveSummary.balanceMinorUnits / 100}</span></div>
            </div>
          )}

        </form>
      </div>
      
      <div className="p-6 border-t border-[var(--color-admin-mist)] bg-white">
        <button form="reservation-form" type="submit" disabled={isSubmitting} className="w-full bg-[var(--color-admin-terracotta)] text-white py-2 rounded-md font-medium hover:bg-opacity-90 disabled:opacity-50 flex justify-center items-center gap-2">
          {isSubmitting ? <><Loader2 size={18} className="animate-spin" /> Saving...</> : 'Save Draft Reservation'}
        </button>
      </div>
    </div>
  );
}
