'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Plus, Trash2, Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { createReservation } from '../(protected)/calendar/actions';
import { format } from 'date-fns';

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
  lineItems: z.array(z.object({
    category: z.string().min(1, 'Category is required'),
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().min(1),
    rateMinorUnits: z.number().min(0),
    amountMinorUnits: z.number().min(0)
  }))
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

  const { register, control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      checkInDate: format(checkInDate, 'yyyy-MM-dd'),
      checkOutDate: format(new Date(checkInDate.getTime() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      adults: 2,
      children: 0,
      bookingStatus: 'pending',
      lineItems: []
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "lineItems" });

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
      setTimeout(() => {
        onSuccess();
      }, 2000);
    }
  };

  if (isSuccess) {
    return (
      <div className="absolute inset-y-0 right-0 w-full md:w-[480px] bg-[var(--color-admin-shell)] shadow-2xl border-l border-[var(--color-admin-mist)] flex flex-col justify-center items-center p-8 z-50">
        <CheckCircle2 size={64} className="text-[var(--color-success)] mb-4" />
        <h3 className="font-[var(--font-display)] text-2xl font-semibold mb-2">Reservation Saved</h3>
        <p className="text-[var(--color-admin-sage)] mb-6 text-center">Reference: {createdRef}</p>
        <button onClick={onSuccess} className="bg-[var(--color-admin-terracotta)] text-white px-6 py-2 rounded-md hover:bg-opacity-90">Back to Calendar</button>
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
        <form id="reservation-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
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
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-admin-sage)] border-b pb-1">Status & Payment</h4>
            
            <div>
              <label className="block text-sm font-medium mb-1">Booking Status</label>
              <select {...register("bookingStatus")} className="w-full px-3 py-2 border border-[var(--color-admin-mist)] rounded-md bg-white">
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center border-b pb-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-admin-sage)]">Draft Line Items</h4>
              <button type="button" onClick={() => append({ category: 'room', description: '', quantity: 1, rateMinorUnits: 0, amountMinorUnits: 0 })} className="text-xs text-[var(--color-admin-terracotta)] hover:underline flex items-center gap-1">
                <Plus size={14} /> Add Item
              </button>
            </div>

            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-start bg-white p-3 border border-[var(--color-admin-mist)] rounded-md">
                <div className="flex-1 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" {...register(`lineItems.${index}.category`)} placeholder="Category (e.g. room)" className="w-full px-2 py-1 text-sm border rounded" />
                    <input type="text" {...register(`lineItems.${index}.description`)} placeholder="Description" className="w-full px-2 py-1 text-sm border rounded" />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input type="number" {...register(`lineItems.${index}.quantity`, { valueAsNumber: true })} placeholder="Qty" className="w-full px-2 py-1 text-sm border rounded" />
                    <input type="number" {...register(`lineItems.${index}.rateMinorUnits`, { valueAsNumber: true })} placeholder="Rate (paise)" className="w-full px-2 py-1 text-sm border rounded" />
                    <input type="number" {...register(`lineItems.${index}.amountMinorUnits`, { valueAsNumber: true })} placeholder="Amount (paise)" className="w-full px-2 py-1 text-sm border rounded" />
                  </div>
                </div>
                <button type="button" onClick={() => remove(index)} className="p-1 text-red-500 hover:bg-red-50 rounded">
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {fields.length === 0 && <p className="text-xs text-[var(--color-admin-sage)] italic">No items. Totals will be calculated in Slice 3.</p>}
          </div>

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
