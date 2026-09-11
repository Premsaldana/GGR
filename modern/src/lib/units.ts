export const PRIVATE_POOL_VILLA = {
  slug: 'private-pool-villa',
  displayName: 'Private Pool Villa',
  capacityAdults: 10,
  capacityChildren: 5,
} as const;

export const ALLOWED_UNITS = [PRIVATE_POOL_VILLA] as const;

export const DEFAULT_CHECK_IN_TIME = '1:00 PM';
export const DEFAULT_CHECK_OUT_TIME = '11:00 AM';

export function isAllowedUnitSlug(slug: string) {
  return slug === PRIVATE_POOL_VILLA.slug;
}

export function getCanonicalRoomType(unit: { slug: string; displayName: string }) {
  const value = `${unit.slug} ${unit.displayName}`.toLowerCase();
  if (value.includes('private-pool-villa') || value.includes('private pool villa')) return PRIVATE_POOL_VILLA.displayName;
  return null;
}

export function isAllowedUnit(unit: { slug: string; displayName: string }) {
  return getCanonicalRoomType(unit) === PRIVATE_POOL_VILLA.displayName;
}
