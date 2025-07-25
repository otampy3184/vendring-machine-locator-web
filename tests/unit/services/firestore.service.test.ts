import { VendingMachineService } from '@/lib/services/firestore.service';
import { 
  VendingMachine, 
  MachineType, 
  OperatingStatus, 
  PaymentMethod,
  CreateVendingMachineDto 
} from '@/lib/types';
import { db } from '@/lib/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  deleteDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  DocumentData,
  QuerySnapshot,
  DocumentSnapshot,
  Unsubscribe
} from 'firebase/firestore';

// Mock Firebase Firestore
jest.mock('@/lib/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDocs: jest.fn(),
  getDoc: jest.fn(),
  addDoc: jest.fn(),
  deleteDoc: jest.fn(),
  updateDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(),
}));

describe('VendingMachineService', () => {
  let service: VendingMachineService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    service = new VendingMachineService();
  });

  describe('getAll', () => {
    it('should fetch all vending machines', async () => {
      // Arrange
      const mockMachines: VendingMachine[] = [
        {
          id: '1',
          latitude: 35.6895,
          longitude: 139.6917,
          description: 'Test Machine 1',
          machineType: MachineType.BEVERAGE,
          operatingStatus: OperatingStatus.OPERATING,
          paymentMethods: [PaymentMethod.CASH],
          lastUpdated: new Date('2024-01-01'),
          hasImage: false
        },
        {
          id: '2',
          latitude: 35.6762,
          longitude: 139.6503,
          description: 'Test Machine 2',
          machineType: MachineType.FOOD,
          operatingStatus: OperatingStatus.OPERATING,
          paymentMethods: [PaymentMethod.CASH, PaymentMethod.CARD],
          lastUpdated: new Date('2024-01-02'),
          hasImage: true,
          imageURL: 'https://example.com/image.jpg',
          thumbnailURL: 'https://example.com/thumb.jpg'
        }
      ];

      const mockDocs = mockMachines.map(machine => ({
        id: machine.id,
        data: () => ({ ...machine, id: undefined })
      }));

      const mockQuerySnapshot = {
        docs: mockDocs
      };

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);
      (collection as jest.Mock).mockReturnValue('collection-ref');
      (query as jest.Mock).mockReturnValue('query-ref');
      (orderBy as jest.Mock).mockReturnValue('orderBy-ref');

      // Act
      const result = await service.getAll();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: '1',
        description: 'Test Machine 1',
        machineType: MachineType.BEVERAGE
      });
      expect(collection).toHaveBeenCalledWith(db, 'vending_machines');
      expect(orderBy).toHaveBeenCalledWith('lastUpdated', 'desc');
    });

    it('should filter by machine type', async () => {
      // Arrange
      const mockMachines: VendingMachine[] = [
        {
          id: '1',
          latitude: 35.6895,
          longitude: 139.6917,
          description: 'Beverage Machine',
          machineType: MachineType.BEVERAGE,
          operatingStatus: OperatingStatus.OPERATING,
          paymentMethods: [PaymentMethod.CASH],
          lastUpdated: new Date(),
          hasImage: false
        }
      ];

      const mockDocs = mockMachines.map(machine => ({
        id: machine.id,
        data: () => ({ ...machine, id: undefined })
      }));

      const mockQuerySnapshot = {
        docs: mockDocs
      };

      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);
      (collection as jest.Mock).mockReturnValue('collection-ref');
      (query as jest.Mock).mockReturnValue('query-ref');
      (orderBy as jest.Mock).mockReturnValue('orderBy-ref');
      (where as jest.Mock).mockReturnValue('where-ref');

      // Act
      const result = await service.getAll({ 
        machineType: MachineType.BEVERAGE 
      });

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].machineType).toBe(MachineType.BEVERAGE);
      expect(where).toHaveBeenCalledWith('machineType', '==', MachineType.BEVERAGE);
    });

    it('should filter by operating status', async () => {
      // Arrange
      const mockQuerySnapshot = { docs: [] };
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);
      (collection as jest.Mock).mockReturnValue('collection-ref');
      (query as jest.Mock).mockReturnValue('query-ref');
      (orderBy as jest.Mock).mockReturnValue('orderBy-ref');
      (where as jest.Mock).mockReturnValue('where-ref');

      // Act
      await service.getAll({ 
        operatingStatus: OperatingStatus.MAINTENANCE 
      });

      // Assert
      expect(where).toHaveBeenCalledWith('operatingStatus', '==', OperatingStatus.MAINTENANCE);
    });

    it('should handle empty results', async () => {
      // Arrange
      const mockQuerySnapshot = { docs: [] };
      (getDocs as jest.Mock).mockResolvedValue(mockQuerySnapshot);
      (collection as jest.Mock).mockReturnValue('collection-ref');
      (query as jest.Mock).mockReturnValue('query-ref');
      (orderBy as jest.Mock).mockReturnValue('orderBy-ref');

      // Act
      const result = await service.getAll();

      // Assert
      expect(result).toEqual([]);
    });

    it('should handle errors', async () => {
      // Arrange
      const mockError = new Error('Firestore error');
      (getDocs as jest.Mock).mockRejectedValue(mockError);
      (collection as jest.Mock).mockReturnValue('collection-ref');
      (query as jest.Mock).mockReturnValue('query-ref');
      (orderBy as jest.Mock).mockReturnValue('orderBy-ref');

      // Act & Assert
      await expect(service.getAll()).rejects.toThrow('Firestore error');
    });
  });

  describe('getById', () => {
    it('should fetch a vending machine by id', async () => {
      // Arrange
      const mockMachine: VendingMachine = {
        id: '1',
        latitude: 35.6895,
        longitude: 139.6917,
        description: 'Test Machine',
        machineType: MachineType.BEVERAGE,
        operatingStatus: OperatingStatus.OPERATING,
        paymentMethods: [PaymentMethod.CASH],
        lastUpdated: new Date(),
        hasImage: false
      };

      const mockDoc = {
        exists: () => true,
        id: mockMachine.id,
        data: () => ({ ...mockMachine, id: undefined })
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);
      (doc as jest.Mock).mockReturnValue('doc-ref');

      // Act
      const result = await service.getById('1');

      // Assert
      expect(result).toMatchObject(mockMachine);
      expect(doc).toHaveBeenCalledWith(db, 'vending_machines', '1');
    });

    it('should return null for non-existent machine', async () => {
      // Arrange
      const mockDoc = {
        exists: () => false
      };

      (getDoc as jest.Mock).mockResolvedValue(mockDoc);
      (doc as jest.Mock).mockReturnValue('doc-ref');

      // Act
      const result = await service.getById('non-existent');

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('add', () => {
    it('should add a new vending machine', async () => {
      // Arrange
      const newMachine: CreateVendingMachineDto = {
        latitude: 35.6895,
        longitude: 139.6917,
        description: 'New Machine',
        machineType: MachineType.BEVERAGE,
        operatingStatus: OperatingStatus.OPERATING,
        paymentMethods: [PaymentMethod.CASH, PaymentMethod.CARD]
      };

      const mockDocRef = { id: 'new-machine-id' };
      (addDoc as jest.Mock).mockResolvedValue(mockDocRef);
      (collection as jest.Mock).mockReturnValue('collection-ref');
      (serverTimestamp as jest.Mock).mockReturnValue('server-timestamp');

      // Act
      const result = await service.add(newMachine);

      // Assert
      expect(result).toBe('new-machine-id');
      expect(addDoc).toHaveBeenCalledWith(
        'collection-ref',
        expect.objectContaining({
          ...newMachine,
          lastUpdated: 'server-timestamp',
          hasImage: false
        })
      );
    });

    it('should validate required fields', async () => {
      // Arrange
      const invalidMachine = {
        latitude: 35.6895,
        // longitude missing
        description: 'Invalid Machine',
        machineType: MachineType.BEVERAGE,
        operatingStatus: OperatingStatus.OPERATING,
        paymentMethods: []
      } as any;

      // Act & Assert
      await expect(service.add(invalidMachine))
        .rejects.toThrow('Longitude is required');
    });

    it('should validate latitude range', async () => {
      // Arrange
      const invalidMachine: CreateVendingMachineDto = {
        latitude: 91, // Invalid latitude
        longitude: 139.6917,
        description: 'Invalid Machine',
        machineType: MachineType.BEVERAGE,
        operatingStatus: OperatingStatus.OPERATING,
        paymentMethods: [PaymentMethod.CASH]
      };

      // Act & Assert
      await expect(service.add(invalidMachine))
        .rejects.toThrow('Invalid latitude');
    });

    it('should validate longitude range', async () => {
      // Arrange
      const invalidMachine: CreateVendingMachineDto = {
        latitude: 35.6895,
        longitude: 181, // Invalid longitude
        description: 'Invalid Machine',
        machineType: MachineType.BEVERAGE,
        operatingStatus: OperatingStatus.OPERATING,
        paymentMethods: [PaymentMethod.CASH]
      };

      // Act & Assert
      await expect(service.add(invalidMachine))
        .rejects.toThrow('Invalid longitude');
    });

    it('should require at least one payment method', async () => {
      // Arrange
      const invalidMachine: CreateVendingMachineDto = {
        latitude: 35.6895,
        longitude: 139.6917,
        description: 'Invalid Machine',
        machineType: MachineType.BEVERAGE,
        operatingStatus: OperatingStatus.OPERATING,
        paymentMethods: [] // Empty payment methods
      };

      // Act & Assert
      await expect(service.add(invalidMachine))
        .rejects.toThrow('At least one payment method is required');
    });
  });

  describe('update', () => {
    it('should update a vending machine', async () => {
      // Arrange
      const updates = {
        description: 'Updated description',
        operatingStatus: OperatingStatus.MAINTENANCE
      };

      (updateDoc as jest.Mock).mockResolvedValue(undefined);
      (doc as jest.Mock).mockReturnValue('doc-ref');
      (serverTimestamp as jest.Mock).mockReturnValue('server-timestamp');

      // Act
      await service.update('machine-id', updates);

      // Assert
      expect(updateDoc).toHaveBeenCalledWith(
        'doc-ref',
        {
          ...updates,
          lastUpdated: 'server-timestamp'
        }
      );
      expect(doc).toHaveBeenCalledWith(db, 'vending_machines', 'machine-id');
    });

    it('should handle update errors', async () => {
      // Arrange
      const mockError = new Error('Update failed');
      (updateDoc as jest.Mock).mockRejectedValue(mockError);
      (doc as jest.Mock).mockReturnValue('doc-ref');

      // Act & Assert
      await expect(service.update('machine-id', {}))
        .rejects.toThrow('Update failed');
    });
  });

  describe('delete', () => {
    it('should delete a vending machine', async () => {
      // Arrange
      (deleteDoc as jest.Mock).mockResolvedValue(undefined);
      (doc as jest.Mock).mockReturnValue('doc-ref');

      // Act
      await service.delete('machine-id');

      // Assert
      expect(deleteDoc).toHaveBeenCalledWith('doc-ref');
      expect(doc).toHaveBeenCalledWith(db, 'vending_machines', 'machine-id');
    });

    it('should handle deletion errors', async () => {
      // Arrange
      const mockError = new Error('Delete failed');
      (deleteDoc as jest.Mock).mockRejectedValue(mockError);
      (doc as jest.Mock).mockReturnValue('doc-ref');

      // Act & Assert
      await expect(service.delete('machine-id'))
        .rejects.toThrow('Delete failed');
    });
  });

  describe('subscribeToChanges', () => {
    it('should subscribe to realtime updates', () => {
      // Arrange
      const mockCallback = jest.fn();
      const mockUnsubscribe = jest.fn();
      const mockSnapshot = {
        docs: [
          {
            id: '1',
            data: () => ({
              latitude: 35.6895,
              longitude: 139.6917,
              description: 'Test Machine',
              machineType: MachineType.BEVERAGE,
              operatingStatus: OperatingStatus.OPERATING,
              paymentMethods: [PaymentMethod.CASH],
              lastUpdated: new Date(),
              hasImage: false
            })
          }
        ]
      };

      (onSnapshot as jest.Mock).mockImplementation((query, callback) => {
        callback(mockSnapshot);
        return mockUnsubscribe;
      });

      (collection as jest.Mock).mockReturnValue('collection-ref');
      (query as jest.Mock).mockReturnValue('query-ref');
      (orderBy as jest.Mock).mockReturnValue('orderBy-ref');

      // Act
      const unsubscribe = service.subscribeToChanges(mockCallback);

      // Assert
      expect(mockCallback).toHaveBeenCalledWith([
        expect.objectContaining({
          id: '1',
          description: 'Test Machine'
        })
      ]);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should handle snapshot errors', () => {
      // Arrange
      const mockCallback = jest.fn();
      const mockError = new Error('Snapshot error');
      
      (onSnapshot as jest.Mock).mockImplementation((query, callback, errorCallback) => {
        errorCallback(mockError);
        return jest.fn();
      });

      (collection as jest.Mock).mockReturnValue('collection-ref');
      (query as jest.Mock).mockReturnValue('query-ref');
      (orderBy as jest.Mock).mockReturnValue('orderBy-ref');

      // Act & Assert
      expect(() => service.subscribeToChanges(mockCallback))
        .not.toThrow();
    });
  });
});