import { LocationCoordinates, VendingMachine } from '@/lib/types';

export function calculateDistance(from: LocationCoordinates, to: LocationCoordinates): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(to.latitude - from.latitude);
  const dLon = toRadians(to.longitude - from.longitude);
  const lat1 = toRadians(from.latitude);
  const lat2 = toRadians(to.latitude);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function formatDistance(
  distanceInKm: number,
  decimalPlaces: number = 1,
  units?: { meters?: string; kilometers?: string }
): string {
  const absDistance = Math.abs(distanceInKm);
  const meterUnit = units?.meters || 'm';
  const kilometerUnit = units?.kilometers || 'km';

  if (absDistance < 1) {
    const meters = Math.round(absDistance * 1000);
    return `${meters}${meterUnit}`;
  }

  return `${absDistance.toFixed(decimalPlaces)}${kilometerUnit}`;
}

export function sortByDistance<T extends VendingMachine>(
  machines: T[],
  userLocation: LocationCoordinates
): (T & { distance: number })[] {
  return machines
    .map(machine => ({
      ...machine,
      distance: calculateDistance(userLocation, {
        latitude: machine.latitude,
        longitude: machine.longitude
      })
    }))
    .sort((a, b) => a.distance - b.distance);
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}