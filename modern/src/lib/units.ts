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
