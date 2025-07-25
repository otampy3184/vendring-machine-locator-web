'use client';

import { useState, useRef } from 'react';
import { LocationCoordinates, MachineType, OperatingStatus, PaymentMethod } from '@/lib/types';
import { imageService } from '@/lib/services/image.service';
import { validateVendingMachine } from '@/lib/utils/validation';
import { Loading } from '@/components/ui/Loading';

interface AddMachineFormProps {
  location: LocationCoordinates;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function AddMachineForm({ location, onSubmit, onCancel }: AddMachineFormProps) {
  const [description, setDescription] = useState('');
  const [machineType, setMachineType] = useState<MachineType>(MachineType.BEVERAGE);
  const [operatingStatus, setOperatingStatus] = useState<OperatingStatus>(OperatingStatus.OPERATING);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([PaymentMethod.CASH]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!imageService.isValidImageType(file.type)) {
      setError('無効なファイル形式です。画像ファイルを選択してください。');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('ファイルサイズが大きすぎます。10MB以下のファイルを選択してください。');
      return;
    }

    setImageFile(file);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Extract EXIF location
    const exifLocation = await imageService.extractExifLocation(file);
    if (exifLocation?.coordinate) {
      // You could update the location here if needed
      console.log('EXIF location found:', exifLocation.coordinate);
    }
  };

  const handlePaymentMethodToggle = (method: PaymentMethod) => {
    setPaymentMethods((prev) => {
      if (prev.includes(method)) {
        return prev.filter((m) => m !== method);
      } else {
        return [...prev, method];
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate form data
    const machineData = {
      latitude: location.latitude,
      longitude: location.longitude,
      description,
      machineType,
      operatingStatus,
      paymentMethods
    };

    const validation = validateVendingMachine(machineData);
    if (!validation.isValid) {
      setError(validation.errors.join('\n'));
      return;
    }

    setLoading(true);
    
    try {
      // Upload image if selected
      let imageData = null;
      if (imageFile) {
        setUploadProgress(0);
        // We'll need to get the machine ID after creation to upload the image
        // For now, we'll pass the file to the parent
      }

      await onSubmit({
        ...machineData,
        imageFile
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '登録に失敗しました');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="absolute top-4 left-4 right-4 md:left-4 md:right-auto md:w-96 bg-white rounded-lg shadow-lg z-10 max-h-[calc(100vh-2rem)] overflow-y-auto">
      <form onSubmit={handleSubmit} className="p-4">
        <h3 className="text-lg font-semibold mb-4">自動販売機を追加</h3>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600 whitespace-pre-line">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              説明 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="例: ローソン前の自販機"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              種類 <span className="text-red-500">*</span>
            </label>
            <select
              value={machineType}
              onChange={(e) => setMachineType(e.target.value as MachineType)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={MachineType.BEVERAGE}>飲料</option>
              <option value={MachineType.FOOD}>食品</option>
              <option value={MachineType.ICE}>アイス</option>
              <option value={MachineType.CIGARETTE}>たばこ</option>
              <option value={MachineType.MULTIPLE}>複合機</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              稼働状態 <span className="text-red-500">*</span>
            </label>
            <select
              value={operatingStatus}
              onChange={(e) => setOperatingStatus(e.target.value as OperatingStatus)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={OperatingStatus.OPERATING}>稼働中</option>
              <option value={OperatingStatus.MAINTENANCE}>メンテナンス中</option>
              <option value={OperatingStatus.OUT_OF_ORDER}>故障中</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              支払い方法 <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {Object.values(PaymentMethod).map((method) => (
                <label key={method} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={paymentMethods.includes(method)}
                    onChange={() => handlePaymentMethodToggle(method)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm">
                    {method === PaymentMethod.CASH && '現金'}
                    {method === PaymentMethod.CARD && 'カード'}
                    {method === PaymentMethod.ELECTRONIC_MONEY && '電子マネー'}
                    {method === PaymentMethod.QR_CODE && 'QRコード'}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              写真（任意）
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              画像を選択
            </button>
            {imagePreview && (
              <div className="mt-2">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-md"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="mt-1 text-sm text-red-600 hover:text-red-800"
                >
                  画像を削除
                </button>
              </div>
            )}
          </div>

          <div className="text-sm text-gray-600">
            位置: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
          </div>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="submit"
            disabled={loading || paymentMethods.length === 0}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400"
          >
            {loading ? <Loading message="登録中..." /> : '登録'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            キャンセル
          </button>
        </div>

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}
      </form>
    </div>
  );
}