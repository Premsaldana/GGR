import { DEFAULT_CHECK_IN_TIME, DEFAULT_CHECK_OUT_TIME } from './units';

type ReservationLike = {
  reservationNumber: string;
  checkInDate: string;
  checkOutDate: string;
};

type UnitLike = {
  id: string;
  displayName: string;
  defaultCheckInTime?: string | null;
  defaultCheckOutTime?: string | null;
};

export function getInvoiceStayMetadata(reservation: ReservationLike, unit?: UnitLike | null) {
  return {
    reservationNumber: reservation.reservationNumber,
    unitId: unit?.id,
    unitDisplayName: unit?.displayName || 'Unit',
    checkInDate: reservation.checkInDate,
    checkOutDate: reservation.checkOutDate,
    checkInTime: unit?.defaultCheckInTime || DEFAULT_CHECK_IN_TIME,
    checkOutTime: unit?.defaultCheckOutTime || DEFAULT_CHECK_OUT_TIME,
  };
}
