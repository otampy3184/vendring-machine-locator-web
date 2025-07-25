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
  QueryConstraint,
  Unsubscribe
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  VendingMachine, 
  CreateVendingMachineDto,
  MachineType,
  OperatingStatus
} from '@/lib/types';

interface GetAllOptions {
  machineType?: MachineType;
  operatingStatus?: OperatingStatus;
}

export class VendingMachineService {
  private readonly collectionName = 'vending_machines';

  async getAll(options?: GetAllOptions): Promise<VendingMachine[]> {
    const constraints: QueryConstraint[] = [];

    if (options?.machineType) {
      constraints.push(where('machineType', '==', options.machineType));
    }

    if (options?.operatingStatus) {
      constraints.push(where('operatingStatus', '==', options.operatingStatus));
    }

    constraints.push(orderBy('lastUpdated', 'desc'));

    const q = query(collection(db, this.collectionName), ...constraints);
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id
      } as VendingMachine;
    });
  }

  async getById(id: string): Promise<VendingMachine | null> {
    const docRef = doc(db, this.collectionName, id);
    const snapshot = await getDoc(docRef);

    if (!snapshot.exists()) {
      return null;
    }

    const data = snapshot.data();
    return {
      ...data,
      id: snapshot.id
    } as VendingMachine;
  }

  async add(machine: CreateVendingMachineDto): Promise<string> {
    // Validation
    if (!machine.longitude) {
      throw new Error('Longitude is required');
    }

    if (machine.latitude < -90 || machine.latitude > 90) {
      throw new Error('Invalid latitude');
    }

    if (machine.longitude < -180 || machine.longitude > 180) {
      throw new Error('Invalid longitude');
    }

    if (!machine.paymentMethods || machine.paymentMethods.length === 0) {
      throw new Error('At least one payment method is required');
    }

    const docRef = await addDoc(collection(db, this.collectionName), {
      ...machine,
      lastUpdated: serverTimestamp(),
      hasImage: false
    });

    return docRef.id;
  }

  async update(id: string, updates: Partial<VendingMachine>): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await updateDoc(docRef, {
      ...updates,
      lastUpdated: serverTimestamp()
    });
  }

  async delete(id: string): Promise<void> {
    const docRef = doc(db, this.collectionName, id);
    await deleteDoc(docRef);
  }

  subscribeToChanges(callback: (machines: VendingMachine[]) => void): Unsubscribe {
    const q = query(
      collection(db, this.collectionName),
      orderBy('lastUpdated', 'desc')
    );

    return onSnapshot(
      q, 
      (snapshot) => {
        const machines = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id
          } as VendingMachine;
        });
        callback(machines);
      },
      (error) => {
        console.error('Error in snapshot listener:', error);
      }
    );
  }
}

// Export singleton instance
export const vendingMachineService = new VendingMachineService();