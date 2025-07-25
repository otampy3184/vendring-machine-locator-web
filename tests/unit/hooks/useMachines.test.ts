import { renderHook, act, waitFor } from '@testing-library/react';
import { useMachines } from '@/lib/hooks/useMachines';
import { vendingMachineService } from '@/lib/services/firestore.service';
import { VendingMachine, MachineType, OperatingStatus, PaymentMethod } from '@/lib/types';

// Mock Firebase
jest.mock('@/lib/firebase', () => ({
  auth: {},
  db: {},
  storage: {}
}));

// Mock Firestore service
jest.mock('@/lib/services/firestore.service', () => ({
  vendingMachineService: {
    subscribeToChanges: jest.fn(),
    add: jest.fn(),
    delete: jest.fn()
  }
}));

describe('useMachines Hook', () => {
  let mockMachines: VendingMachine[];
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    mockMachines = [
      {
        id: '1',
        latitude: 35.6895,
        longitude: 139.6917,
        description: 'Machine 1',
        machineType: MachineType.BEVERAGE,
        operatingStatus: OperatingStatus.OPERATING,
        paymentMethods: [PaymentMethod.CASH],
        lastUpdated: new Date(),
        hasImage: false
      },
      {
        id: '2',
        latitude: 35.6762,
        longitude: 139.6503,
        description: 'Machine 2',
        machineType: MachineType.FOOD,
        operatingStatus: OperatingStatus.MAINTENANCE,
        paymentMethods: [PaymentMethod.CARD],
        lastUpdated: new Date(),
        hasImage: true,
        imageURL: 'https://example.com/image.jpg'
      }
    ];
  });

  it('should initialize with loading state', () => {
    (vendingMachineService.subscribeToChanges as jest.Mock).mockImplementation(() => jest.fn());
    
    const { result } = renderHook(() => useMachines());
    
    expect(result.current.loading).toBe(true);
    expect(result.current.machines).toEqual([]);
    expect(result.current.error).toBeNull();
  });

  it('should load machines on mount', async () => {
    (vendingMachineService as any).subscribeToChanges.mockImplementation((callback) => {
      // Simulate async data loading
      setTimeout(() => callback(mockMachines), 0);
      return jest.fn();
    });

    const { result } = renderHook(() => useMachines());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.machines).toEqual(mockMachines);
    });
  });

  it('should filter machines by type', async () => {
    (vendingMachineService as any).subscribeToChanges.mockImplementation((callback) => {
      callback(mockMachines);
      return jest.fn();
    });

    const { result } = renderHook(() => useMachines());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setMachineTypeFilter(MachineType.BEVERAGE);
    });

    expect(result.current.filteredMachines).toHaveLength(1);
    expect(result.current.filteredMachines[0].machineType).toBe(MachineType.BEVERAGE);
  });

  it('should filter machines by operating status', async () => {
    (vendingMachineService as any).subscribeToChanges.mockImplementation((callback) => {
      callback(mockMachines);
      return jest.fn();
    });

    const { result } = renderHook(() => useMachines());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setOperatingStatusFilter(OperatingStatus.MAINTENANCE);
    });

    expect(result.current.filteredMachines).toHaveLength(1);
    expect(result.current.filteredMachines[0].operatingStatus).toBe(OperatingStatus.MAINTENANCE);
  });

  it('should apply multiple filters', async () => {
    (vendingMachineService as any).subscribeToChanges.mockImplementation((callback) => {
      callback([
        ...mockMachines,
        {
          id: '3',
          latitude: 35.7,
          longitude: 139.7,
          description: 'Machine 3',
          machineType: MachineType.BEVERAGE,
          operatingStatus: OperatingStatus.MAINTENANCE,
          paymentMethods: [PaymentMethod.CASH],
          lastUpdated: new Date(),
          hasImage: false
        }
      ]);
      return jest.fn();
    });

    const { result } = renderHook(() => useMachines());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    act(() => {
      result.current.setMachineTypeFilter(MachineType.BEVERAGE);
      result.current.setOperatingStatusFilter(OperatingStatus.MAINTENANCE);
    });

    expect(result.current.filteredMachines).toHaveLength(1);
    expect(result.current.filteredMachines[0].id).toBe('3');
  });

  it('should clear filters', async () => {
    (vendingMachineService as any).subscribeToChanges.mockImplementation((callback) => {
      callback(mockMachines);
      return jest.fn();
    });

    const { result } = renderHook(() => useMachines());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Apply filters
    act(() => {
      result.current.setMachineTypeFilter(MachineType.BEVERAGE);
    });

    expect(result.current.filteredMachines).toHaveLength(1);

    // Clear filters
    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filteredMachines).toEqual(mockMachines);
    expect(result.current.machineTypeFilter).toBeNull();
    expect(result.current.operatingStatusFilter).toBeNull();
  });

  it('should handle subscription errors', async () => {
    const mockError = new Error('Subscription failed');
    (vendingMachineService as any).subscribeToChanges.mockImplementation(() => {
      throw mockError;
    });

    const { result } = renderHook(() => useMachines());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to load vending machines');
    });
  });

  it('should cleanup subscription on unmount', () => {
    const mockUnsubscribe = jest.fn();
    (vendingMachineService as any).subscribeToChanges.mockReturnValue(mockUnsubscribe);

    const { unmount } = renderHook(() => useMachines());

    unmount();

    expect(mockUnsubscribe).toHaveBeenCalled();
  });

  it('should handle add machine', async () => {
    (vendingMachineService as any).subscribeToChanges.mockImplementation((callback) => {
      callback(mockMachines);
      return jest.fn();
    });

    const newMachine = {
      latitude: 35.7,
      longitude: 139.7,
      description: 'New Machine',
      machineType: MachineType.ICE,
      operatingStatus: OperatingStatus.OPERATING,
      paymentMethods: [PaymentMethod.CASH, PaymentMethod.CARD]
    };

    (vendingMachineService as any).add.mockResolvedValue('new-machine-id');

    const { result } = renderHook(() => useMachines());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.addMachine(newMachine);
    });

    expect((vendingMachineService as any).add).toHaveBeenCalledWith(newMachine);
  });

  it('should handle add machine errors', async () => {
    (vendingMachineService as any).subscribeToChanges.mockImplementation((callback) => {
      callback(mockMachines);
      return jest.fn();
    });

    const mockError = new Error('Add failed');
    (vendingMachineService as any).add.mockRejectedValue(mockError);

    const { result } = renderHook(() => useMachines());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newMachine = {
      latitude: 35.7,
      longitude: 139.7,
      description: 'New Machine',
      machineType: MachineType.ICE,
      operatingStatus: OperatingStatus.OPERATING,
      paymentMethods: [PaymentMethod.CASH]
    };

    await act(async () => {
      await expect(result.current.addMachine(newMachine)).rejects.toThrow('Add failed');
    });
  });

  it('should handle delete machine', async () => {
    (vendingMachineService as any).subscribeToChanges.mockImplementation((callback) => {
      callback(mockMachines);
      return jest.fn();
    });

    (vendingMachineService as any).delete.mockResolvedValue(undefined);

    const { result } = renderHook(() => useMachines());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteMachine('1');
    });

    expect((vendingMachineService as any).delete).toHaveBeenCalledWith('1');
  });

  it('should handle delete machine errors', async () => {
    (vendingMachineService as any).subscribeToChanges.mockImplementation((callback) => {
      callback(mockMachines);
      return jest.fn();
    });

    const mockError = new Error('Delete failed');
    (vendingMachineService as any).delete.mockRejectedValue(mockError);

    const { result } = renderHook(() => useMachines());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await act(async () => {
      await expect(result.current.deleteMachine('1')).rejects.toThrow('Delete failed');
    });
  });

  it('should refresh machines', async () => {
    let callbackFn: ((machines: VendingMachine[]) => void) | null = null;
    
    (vendingMachineService as any).subscribeToChanges.mockImplementation((callback) => {
      callbackFn = callback;
      callback(mockMachines);
      return jest.fn();
    });

    const { result } = renderHook(() => useMachines());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const updatedMachines = [
      ...mockMachines,
      {
        id: '3',
        latitude: 35.7,
        longitude: 139.7,
        description: 'Machine 3',
        machineType: MachineType.TOBACCO,
        operatingStatus: OperatingStatus.OPERATING,
        paymentMethods: [PaymentMethod.QR_CODE],
        lastUpdated: new Date(),
        hasImage: false
      }
    ];

    act(() => {
      if (callbackFn) {
        callbackFn(updatedMachines);
      }
    });

    expect(result.current.machines).toEqual(updatedMachines);
  });

  it('should calculate total counts', async () => {
    (vendingMachineService as any).subscribeToChanges.mockImplementation((callback) => {
      callback(mockMachines);
      return jest.fn();
    });

    const { result } = renderHook(() => useMachines());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.totalCount).toBe(2);
    expect(result.current.operatingCount).toBe(1);
    expect(result.current.maintenanceCount).toBe(1);
    expect(result.current.outOfOrderCount).toBe(0);
  });
});