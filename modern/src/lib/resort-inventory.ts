export const BOOKABLE_RESORT_UNIT = {
  slug: '5-bedroom-villa-private-pool',
  displayName: 'Entire 5-Bedroom Private Resort',
  propertyLabel: 'Goa Garden Resort',
  capacityAdults: 10,
  capacityChildren: 5,
} as const;

export function isBookableResortUnitSlug(slug: string): boolean {
  return slug === BOOKABLE_RESORT_UNIT.slug;
}

type DatedReservation = {
  checkInDate: string;
  checkOutDate: string;
  bookingStatus: string;
};

export function hasResortBookingConflict(
  reservations: DatedReservation[],
  checkInDate: string,
  checkOutDate: string,
): boolean {
  return reservations.some((reservation) => (
    (reservation.bookingStatus === 'pending' || reservation.bookingStatus === 'confirmed')
    && reservation.checkInDate < checkOutDate
    && reservation.checkOutDate > checkInDate
  ));
}
