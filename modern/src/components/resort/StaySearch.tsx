"use client";

import { FormEvent, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Calendar as CalendarIcon, Users, ChevronDown, Plus, Minus } from "lucide-react";
import { nextIsoDate } from "@/lib/pricing-core";
import { DayPicker, DateRange } from "react-day-picker";
import "react-day-picker/style.css";

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    const listener = (event: MouseEvent | TouchEvent) => {
      if (!ref.current || ref.current.contains(event.target as Node)) {
        return;
      }
      handler();
    };
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);
    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler]);
}

export function StaySearch() {
  const router = useRouter();
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = nextIsoDate(today) || "";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [soldOffDates, setSoldOffDates] = useState<Date[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(() => new Date(today));

  // State
  const [range, setRange] = useState<DateRange | undefined>(() => {
    const from = new Date(today);
    const to = new Date(tomorrow);
    return { from, to };
  });
  
  const [adults, setAdults] = useState(2);
  const [childrenCount, setChildrenCount] = useState(0);
  const rooms = 1;

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [occupancyOpen, setOccupancyOpen] = useState(false);

  const dateRef = useRef<HTMLDivElement>(null);
  const occupancyRef = useRef<HTMLDivElement>(null);

  useClickOutside(dateRef, () => setDatePickerOpen(false));
  useClickOutside(occupancyRef, () => setOccupancyOpen(false));

  useEffect(() => {
    let cancelled = false;
    const monthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const nextMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);

    Promise.all([monthKey(calendarMonth), monthKey(nextMonth)].map((month) => fetch(`/api/prices?month=${month}`)))
      .then(async (responses) => {
        const payloads = await Promise.all(responses.map((response) => response.ok ? response.json() : Promise.resolve({ availability: [] })));
        if (cancelled) return;
        const dates = payloads.flatMap((payload) => (payload.availability || [])
          .filter((entry: { status?: string }) => entry.status === "sold_off")
          .map((entry: { date: string }) => new Date(`${entry.date}T00:00:00`)));
        setRange((currentRange) => {
          const includesSoldOffDate = (date: Date | undefined) => date && dates.some((soldOffDate) => soldOffDate.toDateString() === date.toDateString());
          return includesSoldOffDate(currentRange?.from) || includesSoldOffDate(currentRange?.to) ? undefined : currentRange;
        });
        setSoldOffDates(dates);
      })
      .catch(() => {
        if (!cancelled) {
          setSoldOffDates([]);
        }
      });

    return () => { cancelled = true; };
  }, [calendarMonth]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric" }).format(date);
  };

  const isSoldOff = (date: Date) => soldOffDates.some((soldOffDate) => soldOffDate.toDateString() === date.toDateString());

  const isRangeSoldOff = (from: Date, to: Date) => {
    const cursor = new Date(from);
    cursor.setHours(12, 0, 0, 0);
    const end = new Date(to);
    end.setHours(12, 0, 0, 0);
    while (cursor <= end) {
      if (isSoldOff(cursor)) return true;
      cursor.setDate(cursor.getDate() + 1);
    }
    return false;
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    if (!range?.from || !range?.to) {
      setError("Please select check-in and check-out dates.");
      setLoading(false);
      return;
    }

    const checkIn = range.from.toISOString().slice(0, 10);
    const checkOut = range.to.toISOString().slice(0, 10);

    if (checkOut <= checkIn) {
      setError("Check-out must be after check-in.");
      setLoading(false);
      return;
    }
    if (adults < 1) {
      setError("At least 1 adult is required.");
      setLoading(false);
      return;
    }
    if (rooms !== 1) {
      setError("Goa Garden Resort is offered as one complete private resort. Please select 1 room.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/availability?checkIn=${checkIn}&checkOut=${checkOut}&rooms=${rooms}`);
      const json = await res.json();

      if (json.available) {
        const params = new URLSearchParams({
          checkIn,
          checkOut,
          adults: adults.toString(),
          children: childrenCount.toString(),
          rooms: rooms.toString()
        });
        router.push(`/stay/overview?${params.toString()}`);
      } else {
        setError(json.reason || "These dates are currently unavailable.");
        setLoading(false);
      }
    } catch {
      setError("Failed to check availability. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="stay-search-v2">
      <form onSubmit={handleSubmit} className="stay-search-v2__form">
        <div className="stay-search-v2__container">
          {/* Date Picker Trigger */}
          <div className="stay-search-v2__field-wrapper" ref={dateRef}>
            <button 
              type="button" 
              className="stay-search-v2__field"
              onClick={() => { setDatePickerOpen(!datePickerOpen); setOccupancyOpen(false); }}
            >
              <CalendarIcon className="stay-search-v2__icon" size={24} />
              <div className="stay-search-v2__field-content">
                <span className="stay-search-v2__label">Select dates</span>
                <span className="stay-search-v2__value">
                  {range?.from ? formatDate(range.from) : "Check-in"} — {range?.to ? formatDate(range.to) : "Check-out"}
                </span>
              </div>
            </button>
            
            {datePickerOpen && (
              <div className="stay-search-v2__popover stay-search-v2__popover--date">
                <div className="stay-search-v2__availability-note" role="status">
                  <span className="stay-search-v2__availability-dot" aria-hidden="true" />
                  Red dates are booked or sold out and cannot be selected.
                </div>
                <DayPicker 
                  mode="range" 
                  selected={range} 
                  onSelect={(nextRange) => {
                    if (nextRange?.from && nextRange.to && isRangeSoldOff(nextRange.from, nextRange.to)) {
                      setError("The resort is booked or sold out for part of the selected stay. Please choose different dates.");
                      return;
                    }
                    setError(null);
                    setRange(nextRange);
                  }}
                  onDayClick={(date, modifiers) => {
                    if (modifiers.soldOff || isSoldOff(date)) {
                      setError("The resort is booked or sold out on the selected date. Please choose another date.");
                    }
                  }}
                  disabled={[{ before: new Date(today) }, ...soldOffDates]}
                  modifiers={{ soldOff: soldOffDates }}
                  modifiersClassNames={{ soldOff: "stay-search-v2__sold-off" }}
                  numberOfMonths={2}
                  pagedNavigation
                  onMonthChange={setCalendarMonth}
                />
              </div>
            )}
          </div>

          {/* Occupancy Trigger */}
          <div className="stay-search-v2__field-wrapper" ref={occupancyRef}>
            <button 
              type="button" 
              className="stay-search-v2__field"
              onClick={() => { setOccupancyOpen(!occupancyOpen); setDatePickerOpen(false); }}
            >
              <Users className="stay-search-v2__icon" size={24} />
              <div className="stay-search-v2__field-content">
                <span className="stay-search-v2__label">Select occupancy</span>
                <span className="stay-search-v2__value">
                  {adults} adults · {childrenCount} children · {rooms} room
                </span>
              </div>
              <ChevronDown className="stay-search-v2__chevron" size={20} />
            </button>

            {occupancyOpen && (
              <div className="stay-search-v2__popover stay-search-v2__popover--occupancy">
                <div className="stay-search-v2__counter-row">
                  <div className="stay-search-v2__counter-label">
                    <strong>Adults</strong>
                  </div>
                  <div className="stay-search-v2__counter-controls">
                    <button type="button" onClick={() => setAdults(Math.max(1, adults - 1))} disabled={adults <= 1}>
                      <Minus size={16} />
                    </button>
                    <span>{adults}</span>
                    <button type="button" onClick={() => setAdults(Math.min(20, adults + 1))}>
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                <div className="stay-search-v2__counter-row">
                  <div className="stay-search-v2__counter-label">
                    <strong>Children</strong>
                  </div>
                  <div className="stay-search-v2__counter-controls">
                    <button type="button" onClick={() => setChildrenCount(Math.max(0, childrenCount - 1))} disabled={childrenCount <= 0}>
                      <Minus size={16} />
                    </button>
                    <span>{childrenCount}</span>
                    <button type="button" onClick={() => setChildrenCount(Math.min(10, childrenCount + 1))}>
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                <div className="stay-search-v2__counter-row">
                  <div className="stay-search-v2__counter-label">
                    <strong>Rooms</strong>
                    <small>Entire resort only</small>
                  </div>
                  <div className="stay-search-v2__counter-controls">
                    <button type="button" disabled><Minus size={16} /></button>
                    <span>1</span>
                    <button type="button" disabled><Plus size={16} /></button>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <button type="submit" className="button stay-search-v2__submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>
      {error && (
        <div className="stay-search__error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
