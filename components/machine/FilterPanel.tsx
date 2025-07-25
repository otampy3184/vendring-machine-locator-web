'use client';

import { MachineType, OperatingStatus } from '@/lib/types';

interface FilterPanelProps {
  machineTypeFilter: MachineType | null;
  operatingStatusFilter: OperatingStatus | null;
  onMachineTypeChange: (type: MachineType | null) => void;
  onOperatingStatusChange: (status: OperatingStatus | null) => void;
  totalCount: number;
  operatingCount: number;
  maintenanceCount: number;
  outOfOrderCount: number;
}

export function FilterPanel({
  machineTypeFilter,
  operatingStatusFilter,
  onMachineTypeChange,
  onOperatingStatusChange,
  totalCount,
  operatingCount,
  maintenanceCount,
  outOfOrderCount
}: FilterPanelProps) {
  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-wrap items-center gap-4">
          {/* Machine Type Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">種類:</label>
            <select
              value={machineTypeFilter || ''}
              onChange={(e) => onMachineTypeChange(e.target.value as MachineType || null)}
              className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">すべて</option>
              <option value={MachineType.BEVERAGE}>飲料</option>
              <option value={MachineType.FOOD}>食品</option>
              <option value={MachineType.ICE}>アイス</option>
              <option value={MachineType.CIGARETTE}>たばこ</option>
              <option value={MachineType.MULTIPLE}>複合機</option>
            </select>
          </div>

          {/* Operating Status Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">状態:</label>
            <select
              value={operatingStatusFilter || ''}
              onChange={(e) => onOperatingStatusChange(e.target.value as OperatingStatus || null)}
              className="text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">すべて</option>
              <option value={OperatingStatus.OPERATING}>稼働中</option>
              <option value={OperatingStatus.MAINTENANCE}>メンテナンス中</option>
              <option value={OperatingStatus.OUT_OF_ORDER}>故障中</option>
            </select>
          </div>

          {/* Statistics */}
          <div className="flex items-center gap-4 ml-auto text-sm">
            <div>
              <span className="text-gray-600">合計:</span>
              <span className="ml-1 font-medium">{totalCount}</span>
            </div>
            <div>
              <span className="text-green-600">稼働中:</span>
              <span className="ml-1 font-medium">{operatingCount}</span>
            </div>
            <div>
              <span className="text-yellow-600">メンテナンス:</span>
              <span className="ml-1 font-medium">{maintenanceCount}</span>
            </div>
            <div>
              <span className="text-red-600">故障:</span>
              <span className="ml-1 font-medium">{outOfOrderCount}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}