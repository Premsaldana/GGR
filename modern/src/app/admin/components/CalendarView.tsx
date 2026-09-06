'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';
import Link from 'next/link';
import ReservationForm from './ReservationForm';
import { getUnits, getReservations } from '../(protected)/calendar/actions';

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const [units, setUnits] = useState<{id: string, displayName: string}[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const fetchData = async () => {
    setLoading(true);
    try {
      const startStr = format(monthStart, 'yyyy-MM-dd');
      const endStr = format(monthEnd, 'yyyy-MM-dd');
      
      const [fetchedUnits, fetchedReservations] = await Promise.all([
        getUnits(),
        getReservations(startStr, endStr)
      ]);
      setUnits(fetchedUnits);
      setReservations(fetchedReservations);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [currentDate]);

  // Derive occupied dates sets for easy lookup
  const getOccupiedDetails = (dateStr: string) => {
    return reservations.filter(res => 
      dateStr >= res.checkInDate && dateStr < res.checkOutDate
    );
  };
  
  const handleDayClick = (day: Date) => {
    setSelectedDate(day);
  };

  const handleSuccess = () => {
    setSelectedDate(null);
    fetchData();
  };

  return (
    <div className="h-full flex flex-col relative overflow-hidden">
      {/* Calendar Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium">{format(currentDate, 'MMMM yyyy')}</h3>
          {loading && <Loader2 size={16} className="animate-spin text-[var(--color-admin-sage)]" />}
        </div>
        <div className="flex gap-2">
          <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 rounded-md hover:bg-[var(--color-admin-mist)] transition">
            <ChevronLeft size={20} />
          </button>
          <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 rounded-md hover:bg-[var(--color-admin-mist)] transition">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-px mb-2 text-center text-xs font-semibold text-[var(--color-admin-sage)]">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="py-2">{d}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 gap-2">
        {/* Placeholder for days before start of month */}
        {Array.from({ length: monthStart.getDay() }).map((_, i) => (
          <div key={`empty-${i}`} className="p-2"></div>
        ))}
        
        {days.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const dayOccupants = getOccupiedDetails(dateStr);
          // Just a simple visual: if there's >= total units booked, it's fully occupied
          // But since units could be diverse, we just show "X booked"
          
          return (
            <button
              key={dateStr}
              onClick={() => handleDayClick(day)}
              className={twMerge(clsx(
                "h-full min-h-[80px] p-2 border rounded-md text-left transition relative flex flex-col hover:border-[var(--color-admin-terracotta)] hover:shadow-sm",
                isSameMonth(day, currentDate) ? "bg-white" : "bg-gray-50 opacity-50",
                dayOccupants.length > 0 ? "border-[var(--color-admin-terracotta)]/30" : "border-[var(--color-admin-mist)]"
              ))}
            >
              <span className={clsx("text-sm font-medium", isToday(day) && "text-[var(--color-admin-terracotta)]")}>
                {format(day, 'd')}
              </span>
              
              {dayOccupants.map((occ, i) => (
                <Link 
                  key={i} 
                  href={`/admin/reservations/${occ.id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-1 w-full bg-[var(--color-admin-mineral)] border border-[var(--color-admin-terracotta)]/30 text-[10px] px-1 py-0.5 rounded truncate hover:bg-[var(--color-admin-terracotta)] hover:text-white transition-colors block"
                >
                  {units.find(u => u.id === occ.unitId)?.displayName || 'Unit'} - {occ.bookingStatus}
                </Link>
              ))}
            </button>
          );
        })}
      </div>

      {/* Reservation Drawer Shell */}
      {selectedDate && (
        <ReservationForm 
          checkInDate={selectedDate} 
          units={units}
          onClose={() => setSelectedDate(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
