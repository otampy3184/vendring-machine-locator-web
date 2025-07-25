import { LocationCoordinates } from '@/lib/types';

export class LocationService {
  private readonly defaultOptions: PositionOptions = {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 0
  };

  async getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition> {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => resolve(position),
        (error) => reject(this.handlePositionError(error)),
        { ...this.defaultOptions, ...options }
      );
    });
  }

  watchPosition(
    successCallback: PositionCallback,
    errorCallback?: PositionErrorCallback,
    options?: PositionOptions
  ): number {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser');
    }

    return navigator.geolocation.watchPosition(
      successCallback,
      (error) => {
        if (errorCallback) {
          errorCallback(this.handlePositionError(error));
        }
      },
      { ...this.defaultOptions, ...options }
    );
  }

  clearWatch(watchId: number): void {
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by this browser');
    }

    navigator.geolocation.clearWatch(watchId);
  }

  calculateDistance(from: LocationCoordinates, to: LocationCoordinates): number {
    // Haversine formula to calculate distance between two points
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(to.latitude - from.latitude);
    const dLon = this.toRadians(to.longitude - from.longitude);
    const lat1 = this.toRadians(from.latitude);
    const lat2 = this.toRadians(to.latitude);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in kilometers
  }

  async checkPermission(): Promise<PermissionState | null> {
    if (!navigator.permissions) {
      return null;
    }

    try {
      const result = await navigator.permissions.query({ name: 'geolocation' });
      return result.state;
    } catch (error) {
      console.error('Failed to check location permission:', error);
      return null;
    }
  }

  isLocationAvailable(): boolean {
    return !!navigator.geolocation;
  }

  formatDistance(distanceInKm: number): string {
    if (distanceInKm < 1) {
      return `${Math.round(distanceInKm * 1000)}m`;
    }
    return `${distanceInKm.toFixed(2)}km`;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private handlePositionError(error: GeolocationPositionError): Error {
    switch (error.code) {
      case 1: // PERMISSION_DENIED
        return new Error('Location permission denied');
      case 2: // POSITION_UNAVAILABLE
        return new Error('Location unavailable');
      case 3: // TIMEOUT
        return new Error('Location request timeout');
      default:
        return new Error('Unknown location error');
    }
  }
}

// Export singleton instance
export const locationService = new LocationService();