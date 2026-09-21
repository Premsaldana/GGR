"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Calendar, Users } from "lucide-react";
import { nextIsoDate } from "@/lib/pricing-core";

export function StaySearch() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = nextIsoDate(today) || "";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const form = event.currentTarget;
    const data = new FormData(form);
    const checkIn = String(data.get("checkIn") || "");
    const checkOut = String(data.get("checkOut") || "");
    const adults = Number(data.get("adults") || 2);
    const children = Number(data.get("children") || 0);
    const rooms = Number(data.get("rooms") || 1);

    if (!checkIn || !checkOut) {
      setError("Please select check-in and check-out dates.");
      setLoading(false);
      return;
    }

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

    if (children < 0) {
      setError("Children count cannot be negative.");
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
          children: children.toString(),
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
    <div className="stay-search">
      <form onSubmit={handleSubmit} className="stay-search__form">
        <div className="stay-search__field-group">
          <Calendar className="stay-search__icon" aria-hidden="true" size={24} />
          <div className="stay-search__input-wrapper">
            <label htmlFor="search-checkin" className="stay-search__label">Select dates</label>
            <div className="stay-search__dates">
              <input 
                id="search-checkin" 
                name="checkIn" 
                type="date" 
                required 
                defaultValue={today} 
                min={today}
                className="stay-search__input stay-search__input--date"
                aria-label="Check-in date"
              />
              <span className="stay-search__separator">—</span>
              <input 
                id="search-checkout" 
                name="checkOut" 
                type="date" 
                required 
                defaultValue={tomorrow} 
                min={tomorrow}
                className="stay-search__input stay-search__input--date"
                aria-label="Check-out date"
              />
            </div>
          </div>
        </div>

        <div className="stay-search__field-group">
          <Users className="stay-search__icon" aria-hidden="true" size={24} />
          <div className="stay-search__input-wrapper">
            <label htmlFor="search-adults" className="stay-search__label">Select occupancy</label>
            <div className="stay-search__occupancy">
              <input 
                id="search-adults" 
                name="adults" 
                type="number" 
                min="1" 
                max="20" 
                defaultValue="2" 
                required 
                className="stay-search__input stay-search__input--number"
                aria-label="Adults"
              />
              <span>adults ·</span>
              <input 
                id="search-children" 
                name="children" 
                type="number" 
                min="0" 
                max="10" 
                defaultValue="0" 
                required 
                className="stay-search__input stay-search__input--number"
                aria-label="Children"
              />
              <span>children ·</span>
              <input 
                id="search-rooms" 
                name="rooms" 
                type="number" 
                min="1" 
                max="5" 
                defaultValue="1" 
                required 
                className="stay-search__input stay-search__input--number"
                aria-label="Rooms"
              />
              <span>room</span>
            </div>
          </div>
        </div>

        <button type="submit" className="button stay-search__submit" disabled={loading} style={{ backgroundColor: '#0056b3', color: 'white' }}>
          {loading ? "Searching..." : "Search"}
        </button>
      </form>
      {error && (
        <div className="stay-search__error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}
