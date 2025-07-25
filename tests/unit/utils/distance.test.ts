import { calculateDistance, formatDistance, sortByDistance } from '@/lib/utils/distance';
import { VendingMachine, MachineType, OperatingStatus, PaymentMethod } from '@/lib/types';

describe('Distance Utilities', () => {
  describe('calculateDistance', () => {
    it('should calculate distance between two coordinates using Haversine formula', () => {
      // Tokyo Station to Shibuya Station (approximately 6.8 km)
      const distance = calculateDistance(
        { latitude: 35.6812, longitude: 139.7671 }, // Tokyo Station
        { latitude: 35.6580, longitude: 139.7016 }  // Shibuya Station
      );
      
      expect(distance).toBeCloseTo(6.45, 1);
    });

    it('should return 0 for same coordinates', () => {
      const coords = { latitude: 35.6812, longitude: 139.7671 };
      const distance = calculateDistance(coords, coords);
      
      expect(distance).toBe(0);
    });

    it('should handle negative coordinates', () => {
      // Sydney to Rio de Janeiro (approximately 13,400 km)
      const distance = calculateDistance(
        { latitude: -33.8688, longitude: 151.2093 }, // Sydney
        { latitude: -22.9068, longitude: -43.1729 }  // Rio de Janeiro
      );
      
      expect(distance).toBeCloseTo(13521, -2);
    });

    it('should handle antipodal points', () => {
      // North Pole to South Pole (approximately 20,000 km)
      const distance = calculateDistance(
        { latitude: 90, longitude: 0 },
        { latitude: -90, longitude: 0 }
      );
      
      expect(distance).toBeCloseTo(20000, -3);
    });

    it('should handle edge cases near dateline', () => {
      // Points on opposite sides of the International Date Line
      const distance = calculateDistance(
        { latitude: 0, longitude: 179.9 },
        { latitude: 0, longitude: -179.9 }
      );
      
      // Should be very small distance, not half the Earth's circumference
      expect(distance).toBeLessThan(50);
    });
  });

  describe('formatDistance', () => {
    it('should format distances less than 1km as meters', () => {
      expect(formatDistance(0)).toBe('0m');
      expect(formatDistance(0.1)).toBe('100m');
      expect(formatDistance(0.999)).toBe('999m');
    });

    it('should format distances 1km and above as kilometers', () => {
      expect(formatDistance(1)).toBe('1.0km');
      expect(formatDistance(1.5)).toBe('1.5km');
      expect(formatDistance(10.567)).toBe('10.6km');
      expect(formatDistance(999.99)).toBe('1000.0km');
    });

    it('should handle very small distances', () => {
      expect(formatDistance(0.0001)).toBe('0m');
      expect(formatDistance(0.0005)).toBe('1m');
      expect(formatDistance(0.0009)).toBe('1m');
    });

    it('should handle negative distances as absolute values', () => {
      expect(formatDistance(-0.5)).toBe('500m');
      expect(formatDistance(-2.5)).toBe('2.5km');
    });

    it('should accept custom decimal places', () => {
      expect(formatDistance(1.2345, 0)).toBe('1km');
      expect(formatDistance(1.2345, 2)).toBe('1.23km');
      expect(formatDistance(1.2345, 3)).toBe('1.234km');
    });

    it('should accept custom units', () => {
      expect(formatDistance(0.5, 1, { meters: 'メートル', kilometers: 'キロ' })).toBe('500メートル');
      expect(formatDistance(2.5, 1, { meters: 'メートル', kilometers: 'キロ' })).toBe('2.5キロ');
    });
  });

  describe('sortByDistance', () => {
    const mockMachines: VendingMachine[] = [
      {
        id: '1',
        latitude: 35.6812,
        longitude: 139.7671,
        description: 'Machine 1',
        machineType: MachineType.BEVERAGE,
        operatingStatus: OperatingStatus.OPERATING,
        paymentMethods: [PaymentMethod.CASH],
        lastUpdated: new Date(),
        hasImage: false
      },
      {
        id: '2',
        latitude: 35.6580,
        longitude: 139.7016,
        description: 'Machine 2',
        machineType: MachineType.BEVERAGE,
        operatingStatus: OperatingStatus.OPERATING,
        paymentMethods: [PaymentMethod.CASH],
        lastUpdated: new Date(),
        hasImage: false
      },
      {
        id: '3',
        latitude: 35.6895,
        longitude: 139.6917,
        description: 'Machine 3',
        machineType: MachineType.BEVERAGE,
        operatingStatus: OperatingStatus.OPERATING,
        paymentMethods: [PaymentMethod.CASH],
        lastUpdated: new Date(),
        hasImage: false
      }
    ];

    it('should sort machines by distance from user location', () => {
      const userLocation = { latitude: 35.6812, longitude: 139.7671 }; // Same as Machine 1
      const sorted = sortByDistance(mockMachines, userLocation);
      
      expect(sorted[0].id).toBe('1'); // Closest (same location)
      expect(sorted[1].id).toBe('2'); // Actually closer than '3'
      expect(sorted[2].id).toBe('3'); // Farthest
    });

    it('should handle empty array', () => {
      const userLocation = { latitude: 35.6812, longitude: 139.7671 };
      const sorted = sortByDistance([], userLocation);
      
      expect(sorted).toEqual([]);
    });

    it('should not modify original array', () => {
      const userLocation = { latitude: 35.6812, longitude: 139.7671 };
      const originalMachines = [...mockMachines];
      
      sortByDistance(mockMachines, userLocation);
      
      expect(mockMachines).toEqual(originalMachines);
    });

    it('should include distance property in sorted results', () => {
      const userLocation = { latitude: 35.6812, longitude: 139.7671 };
      const sorted = sortByDistance(mockMachines, userLocation);
      
      sorted.forEach(machine => {
        expect(machine).toHaveProperty('distance');
        expect(typeof machine.distance).toBe('number');
        expect(machine.distance).toBeGreaterThanOrEqual(0);
      });
    });

    it('should sort correctly when all machines are equidistant', () => {
      const sameMachines = mockMachines.map(m => ({
        ...m,
        latitude: 35.6812,
        longitude: 139.7671
      }));
      
      const userLocation = { latitude: 35.7000, longitude: 139.8000 };
      const sorted = sortByDistance(sameMachines, userLocation);
      
      // All should have same distance
      const distances = sorted.map(m => m.distance);
      expect(new Set(distances).size).toBe(1);
    });
  });
});