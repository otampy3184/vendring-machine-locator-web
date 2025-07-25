'use client';

import { useState, useEffect, useMemo } from 'react';
import { VendingMachine, CreateVendingMachineDto, MachineType, OperatingStatus } from '@/lib/types';
import { vendingMachineService } from '@/lib/services/firestore.service';

interface UseMachinesReturn {
  machines: VendingMachine[];
  filteredMachines: VendingMachine[];
  loading: boolean;
  error: string | null;
  machineTypeFilter: MachineType | null;
  operatingStatusFilter: OperatingStatus | null;
  totalCount: number;
  operatingCount: number;
  maintenanceCount: number;
  outOfOrderCount: number;
  setMachineTypeFilter: (type: MachineType | null) => void;
  setOperatingStatusFilter: (status: OperatingStatus | null) => void;
  clearFilters: () => void;
  addMachine: (machine: CreateVendingMachineDto) => Promise<void>;
  deleteMachine: (id: string) => Promise<void>;
}

export function useMachines(): UseMachinesReturn {
  const [machines, setMachines] = useState<VendingMachine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [machineTypeFilter, setMachineTypeFilter] = useState<MachineType | null>(null);
  const [operatingStatusFilter, setOperatingStatusFilter] = useState<OperatingStatus | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    try {
      unsubscribe = vendingMachineService.subscribeToChanges((machines) => {
        setMachines(machines);
        setLoading(false);
        setError(null);
      });
    } catch (err) {
      setError('Failed to load vending machines');
      setLoading(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  const filteredMachines = useMemo(() => {
    let filtered = machines;

    if (machineTypeFilter) {
      filtered = filtered.filter(m => m.machineType === machineTypeFilter);
    }

    if (operatingStatusFilter) {
      filtered = filtered.filter(m => m.operatingStatus === operatingStatusFilter);
    }

    return filtered;
  }, [machines, machineTypeFilter, operatingStatusFilter]);

  const counts = useMemo(() => {
    const operatingCount = machines.filter(m => m.operatingStatus === OperatingStatus.OPERATING).length;
    const maintenanceCount = machines.filter(m => m.operatingStatus === OperatingStatus.MAINTENANCE).length;
    const outOfOrderCount = machines.filter(m => m.operatingStatus === OperatingStatus.OUT_OF_ORDER).length;

    return {
      totalCount: machines.length,
      operatingCount,
      maintenanceCount,
      outOfOrderCount
    };
  }, [machines]);

  const clearFilters = () => {
    setMachineTypeFilter(null);
    setOperatingStatusFilter(null);
  };

  const addMachine = async (machine: CreateVendingMachineDto) => {
    await vendingMachineService.add(machine);
  };

  const deleteMachine = async (id: string) => {
    await vendingMachineService.delete(id);
  };

  return {
    machines,
    filteredMachines,
    loading,
    error,
    machineTypeFilter,
    operatingStatusFilter,
    ...counts,
    setMachineTypeFilter,
    setOperatingStatusFilter,
    clearFilters,
    addMachine,
    deleteMachine
  };
}