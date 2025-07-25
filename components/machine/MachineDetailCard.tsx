'use client';

import { VendingMachine, PaymentMethod, OperatingStatus } from '@/lib/types';
import { useAuth } from '@/lib/hooks/useAuth';
import { formatDistance } from '@/lib/utils/distance';

interface MachineDetailCardProps {
  machine: VendingMachine;
  distance?: number;
  onClose: () => void;
  onDelete?: (id: string) => void;
}

function getPaymentMethodLabel(method: PaymentMethod): string {
  switch (method) {
    case PaymentMethod.CASH:
      return '現金';
    case PaymentMethod.CARD:
      return 'カード';
    case PaymentMethod.ELECTRONIC_MONEY:
      return '電子マネー';
    case PaymentMethod.QR_CODE:
      return 'QRコード';
    default:
      return method;
  }
}

function getOperatingStatusLabel(status: OperatingStatus): string {
  switch (status) {
    case OperatingStatus.OPERATING:
      return '稼働中';
    case OperatingStatus.MAINTENANCE:
      return 'メンテナンス中';
    case OperatingStatus.OUT_OF_ORDER:
      return '故障中';
    default:
      return status;
  }
}

export function MachineDetailCard({ 
  machine, 
  distance, 
  onClose, 
  onDelete 
}: MachineDetailCardProps) {
  const { user } = useAuth();

  const handleDelete = async () => {
    if (!onDelete || !user) return;
    
    if (window.confirm('この自動販売機を削除しますか？')) {
      onDelete(machine.id);
    }
  };

  return (
    <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-lg shadow-lg z-10">
      <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-semibold">{machine.description}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-gray-600">種類:</span>
            <span className="font-medium">{machine.machineType}</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-gray-600">状態:</span>
            <span className={`font-medium ${
              machine.operatingStatus === OperatingStatus.OPERATING 
                ? 'text-green-600' 
                : machine.operatingStatus === OperatingStatus.MAINTENANCE
                ? 'text-yellow-600'
                : 'text-red-600'
            }`}>
              {getOperatingStatusLabel(machine.operatingStatus)}
            </span>
          </div>

          <div className="flex items-start gap-2">
            <span className="text-gray-600">支払方法:</span>
            <div className="flex flex-wrap gap-1">
              {machine.paymentMethods.map((method) => (
                <span
                  key={method}
                  className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded"
                >
                  {getPaymentMethodLabel(method)}
                </span>
              ))}
            </div>
          </div>

          {distance !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-gray-600">距離:</span>
              <span className="font-medium">{formatDistance(distance)}</span>
            </div>
          )}

          {machine.hasImage && machine.imageURL && (
            <div className="mt-3">
              <img
                src={machine.thumbnailURL || machine.imageURL}
                alt={machine.description}
                className="w-full h-48 object-cover rounded-md cursor-pointer"
                onClick={() => window.open(machine.imageURL, '_blank')}
              />
            </div>
          )}

          <div className="pt-2 text-xs text-gray-500">
            最終更新: {new Date(machine.lastUpdated).toLocaleDateString('ja-JP')}
          </div>
        </div>

        {user && onDelete && (
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={handleDelete}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              削除
            </button>
          </div>
        )}
      </div>
    </div>
  );
}