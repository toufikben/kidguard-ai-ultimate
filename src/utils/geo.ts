import type { GeoPoint } from '@/types';

const EARTH_RADIUS_M = 6_371_000;

export function haversineMeters(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(x));
}

export function isInsideZone(
  point: GeoPoint,
  center: { lat: number; lng: number },
  radiusM: number
): boolean {
  return haversineMeters(point, center) <= radiusM + (point.accuracy || 0);
}

export function bearing(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function smoothLocation(prev: GeoPoint | null, next: GeoPoint): GeoPoint {
  if (!prev) return next;
  const alpha = 0.35;
  return {
    ...next,
    lat: prev.lat * (1 - alpha) + next.lat * alpha,
    lng: prev.lng * (1 - alpha) + next.lng * alpha,
  };
}
