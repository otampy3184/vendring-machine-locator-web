import { LocationService } from '@/lib/services/location.service';
import { LocationCoordinates } from '@/lib/types';

describe('LocationService', () => {
  let service: LocationService;
  let mockGeolocation: any;

  beforeEach(() => {
    // Mock geolocation API
    mockGeolocation = {
      getCurrentPosition: jest.fn(),
      watchPosition: jest.fn(),
      clearWatch: jest.fn()
    };
    
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      configurable: true
    });

    // Clear any previous mocks
    jest.clearAllMocks();
    
    service = new LocationService();
  });

  describe('getCurrentPosition', () => {
    it('should return current position successfully', async () => {
      // Arrange
      const mockPosition = {
        coords: {
          latitude: 35.6895,
          longitude: 139.6917,
          accuracy: 10,
          altitude: 45.5,
          altitudeAccuracy: 5,
          heading: null,
          speed: null
        },
        timestamp: Date.now()
      };

      mockGeolocation.getCurrentPosition.mockImplementation(
        (success: PositionCallback) => success(mockPosition)
      );

      // Act
      const result = await service.getCurrentPosition();

      // Assert
      expect(result).toEqual({
        coords: mockPosition.coords,
        timestamp: mockPosition.timestamp
      });
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        })
      );
    });

    it('should handle permission denied error', async () => {
      // Arrange
      const mockError = {
        code: 1, // PERMISSION_DENIED
        message: 'User denied Geolocation'
      };

      mockGeolocation.getCurrentPosition.mockImplementation(
        (_success: PositionCallback, error: PositionErrorCallback) => error(mockError)
      );

      // Act & Assert
      await expect(service.getCurrentPosition())
        .rejects.toThrow('Location permission denied');
    });

    it('should handle position unavailable error', async () => {
      // Arrange
      const mockError = {
        code: 2, // POSITION_UNAVAILABLE
        message: 'Position unavailable'
      };

      mockGeolocation.getCurrentPosition.mockImplementation(
        (_success: PositionCallback, error: PositionErrorCallback) => error(mockError)
      );

      // Act & Assert
      await expect(service.getCurrentPosition())
        .rejects.toThrow('Location unavailable');
    });

    it('should handle timeout error', async () => {
      // Arrange
      const mockError = {
        code: 3, // TIMEOUT
        message: 'Timeout'
      };

      mockGeolocation.getCurrentPosition.mockImplementation(
        (_success: PositionCallback, error: PositionErrorCallback) => error(mockError)
      );

      // Act & Assert
      await expect(service.getCurrentPosition())
        .rejects.toThrow('Location request timeout');
    });

    it('should handle browser not supporting geolocation', async () => {
      // Arrange
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        configurable: true
      });

      // Act & Assert
      await expect(service.getCurrentPosition())
        .rejects.toThrow('Geolocation is not supported by this browser');
    });

    it('should accept custom options', async () => {
      // Arrange
      const mockPosition = {
        coords: {
          latitude: 35.6895,
          longitude: 139.6917,
          accuracy: 10
        },
        timestamp: Date.now()
      };

      mockGeolocation.getCurrentPosition.mockImplementation(
        (success: PositionCallback) => success(mockPosition)
      );

      const customOptions = {
        enableHighAccuracy: false,
        timeout: 5000,
        maximumAge: 60000
      };

      // Act
      await service.getCurrentPosition(customOptions);

      // Assert
      expect(mockGeolocation.getCurrentPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        customOptions
      );
    });
  });

  describe('watchPosition', () => {
    it('should watch position changes', () => {
      // Arrange
      const mockCallback = jest.fn();
      const mockWatchId = 123;
      const mockPosition = {
        coords: {
          latitude: 35.6895,
          longitude: 139.6917,
          accuracy: 10
        },
        timestamp: Date.now()
      };

      mockGeolocation.watchPosition.mockImplementation(
        (success: PositionCallback) => {
          // Simulate immediate callback
          success(mockPosition);
          return mockWatchId;
        }
      );

      // Act
      const watchId = service.watchPosition(mockCallback);

      // Assert
      expect(watchId).toBe(mockWatchId);
      expect(mockCallback).toHaveBeenCalledWith(mockPosition);
      expect(mockGeolocation.watchPosition).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Function),
        expect.objectContaining({
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        })
      );
    });

    it('should handle watch errors', () => {
      // Arrange
      const mockErrorCallback = jest.fn();
      const mockError = {
        code: 1,
        message: 'Permission denied'
      };

      mockGeolocation.watchPosition.mockImplementation(
        (_success: PositionCallback, error: PositionErrorCallback) => {
          error(mockError);
          return 123;
        }
      );

      // Act
      service.watchPosition(jest.fn(), mockErrorCallback);

      // Assert
      expect(mockErrorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Location permission denied'
        })
      );
    });

    it('should handle browser not supporting geolocation', () => {
      // Arrange
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        configurable: true
      });

      // Act & Assert
      expect(() => service.watchPosition(jest.fn()))
        .toThrow('Geolocation is not supported by this browser');
    });
  });

  describe('clearWatch', () => {
    it('should clear position watch', () => {
      // Arrange
      const mockWatchId = 123;

      // Act
      service.clearWatch(mockWatchId);

      // Assert
      expect(mockGeolocation.clearWatch).toHaveBeenCalledWith(mockWatchId);
    });

    it('should handle browser not supporting geolocation', () => {
      // Arrange
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        configurable: true
      });

      // Act & Assert
      expect(() => service.clearWatch(123))
        .toThrow('Geolocation is not supported by this browser');
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates', () => {
      // Arrange
      const from: LocationCoordinates = {
        latitude: 35.6895,
        longitude: 139.6917
      };
      const to: LocationCoordinates = {
        latitude: 35.6762,
        longitude: 139.6503
      };

      // Act
      const distance = service.calculateDistance(from, to);

      // Assert
      // Distance between these points is approximately 4.02 km
      expect(distance).toBeCloseTo(4.02, 1);
    });

    it('should return 0 for same coordinates', () => {
      // Arrange
      const coordinates: LocationCoordinates = {
        latitude: 35.6895,
        longitude: 139.6917
      };

      // Act
      const distance = service.calculateDistance(coordinates, coordinates);

      // Assert
      expect(distance).toBe(0);
    });

    it('should handle antipodal points', () => {
      // Arrange
      const from: LocationCoordinates = {
        latitude: 0,
        longitude: 0
      };
      const to: LocationCoordinates = {
        latitude: 0,
        longitude: 180
      };

      // Act
      const distance = service.calculateDistance(from, to);

      // Assert
      // Half the Earth's circumference, approximately 20,015 km
      expect(distance).toBeCloseTo(20015, 0);
    });
  });

  describe('checkPermission', () => {
    it('should return permission status when available', async () => {
      // Arrange
      const mockPermissions = {
        query: jest.fn().mockResolvedValue({
          state: 'granted'
        })
      };

      Object.defineProperty(global.navigator, 'permissions', {
        value: mockPermissions,
        configurable: true
      });

      // Act
      const result = await service.checkPermission();

      // Assert
      expect(result).toBe('granted');
      expect(mockPermissions.query).toHaveBeenCalledWith({ name: 'geolocation' });
    });

    it('should return null when permissions API is not available', async () => {
      // Arrange
      Object.defineProperty(global.navigator, 'permissions', {
        value: undefined,
        configurable: true
      });

      // Act
      const result = await service.checkPermission();

      // Assert
      expect(result).toBeNull();
    });

    it('should handle permission query errors', async () => {
      // Arrange
      const mockPermissions = {
        query: jest.fn().mockRejectedValue(new Error('Permission query failed'))
      };

      Object.defineProperty(global.navigator, 'permissions', {
        value: mockPermissions,
        configurable: true
      });

      // Act
      const result = await service.checkPermission();

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('isLocationAvailable', () => {
    it('should return true when geolocation is available', () => {
      // Act
      const result = service.isLocationAvailable();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when geolocation is not available', () => {
      // Arrange
      Object.defineProperty(global.navigator, 'geolocation', {
        value: undefined,
        configurable: true
      });

      // Act
      const result = service.isLocationAvailable();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('formatDistance', () => {
    it('should format distance less than 1km in meters', () => {
      // Act
      const result = service.formatDistance(0.5);

      // Assert
      expect(result).toBe('500m');
    });

    it('should format distance greater than 1km in kilometers', () => {
      // Act
      const result = service.formatDistance(2.567);

      // Assert
      expect(result).toBe('2.57km');
    });

    it('should handle zero distance', () => {
      // Act
      const result = service.formatDistance(0);

      // Assert
      expect(result).toBe('0m');
    });

    it('should handle very small distances', () => {
      // Act
      const result = service.formatDistance(0.001);

      // Assert
      expect(result).toBe('1m');
    });
  });
});