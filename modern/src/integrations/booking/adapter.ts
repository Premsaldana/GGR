/**
 * Booking adapter — provider-neutral interface
 * ─────────────────────────────────────────────
 * Phase 3: STUB ONLY — no provider is connected.
 *
 * The BookingCTA component uses this adapter.
 * When a provider is configured in Phase 4, replace the stub
 * in this file without touching any room, page, or layout component.
 *
 * Pattern from the implementation brief:
 *   export const bookingProvider: BookingProvider = {
 *     async createBookingRedirect() {
 *       throw new Error("Booking provider is not configured yet");
 *     },
 *   };
 */

export type BookingRequest = {
  roomSlug?: string;
  checkIn?: string;   // ISO date string YYYY-MM-DD
  checkOut?: string;  // ISO date string YYYY-MM-DD
  guests?: number;
};

export interface BookingProvider {
  /**
   * Optional: check real-time availability.
   * Only implement when a booking engine is connected.
   */
  getAvailability?(request: BookingRequest): Promise<unknown>;

  /**
   * Required: create a URL to hand the guest off to the booking engine.
   * In Phase 3 this throws — the UI falls back to the enquiry form.
   */
  createBookingRedirect(request: BookingRequest): Promise<{ url: string }>;
}

/**
 * Active booking provider.
 * Phase 3: stub — throws "not configured" so BookingCTA shows enquiry fallback.
 * Phase 4: replace with BookingJini or eZee adapter import.
 */
export const bookingProvider: BookingProvider = {
  async createBookingRedirect() {
    // TODO Phase 4: replace this stub with the configured provider.
    // import { bookingJiniProvider } from "./bookingjini";
    // export const bookingProvider = bookingJiniProvider;
    throw new Error(
      "Booking provider is not configured yet. Guest is redirected to enquiry form."
    );
  },
};

/**
 * Safe helper: attempts createBookingRedirect; returns null on failure.
 * BookingCTA uses this so the UI never crashes or shows a raw error.
 */
export async function safeBookingRedirect(
  request: BookingRequest
): Promise<{ url: string } | null> {
  try {
    return await bookingProvider.createBookingRedirect(request);
  } catch {
    return null;
  }
}
