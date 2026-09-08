export const ALLOWED_UNITS = [
  { slug: '1bhk', displayName: '1BHK', capacityAdults: 2, capacityChildren: 1 },
  { slug: '4bhk', displayName: '4BHK', capacityAdults: 8, capacityChildren: 4 },
  { slug: '5bhk', displayName: '5BHK', capacityAdults: 10, capacityChildren: 5 },
] as const;

export const DEFAULT_CHECK_IN_TIME = '1:00 PM';
export const DEFAULT_CHECK_OUT_TIME = '11:00 AM';

export function isAllowedUnitSlug(slug: string) {
  return ALLOWED_UNITS.some((unit) => unit.slug === slug);
}

export function getCanonicalRoomType(unit: { slug: string; displayName: string }) {
  const value = `${unit.slug} ${unit.displayName}`.toLowerCase();
  if (value.includes('1bhk') || value.includes('1 bedroom')) return '1BHK';
  if (value.includes('4bhk') || value.includes('4 bedroom')) return '4BHK';
  if (value.includes('5bhk') || value.includes('5 bedroom')) return '5BHK';
  return null;
}

export function isAllowedUnit(unit: { slug: string; displayName: string }) {
  return getCanonicalRoomType(unit) !== null;
}
