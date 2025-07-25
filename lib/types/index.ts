export enum MachineType {
  BEVERAGE = '飲料',
  FOOD = '食品',
  ICE = 'アイス',
  CIGARETTE = 'たばこ',
  OTHER = 'その他'
}

export enum OperatingStatus {
  OPERATING = '営業中',
  OUT_OF_ORDER = '故障中',
  MAINTENANCE = 'メンテナンス中'
}

export enum PaymentMethod {
  CASH = '現金',
  CARD = 'カード',
  ELECTRONIC_MONEY = '電子マネー',
  QR_CODE = 'QRコード'
}

export interface VendingMachine {
  id: string;
  latitude: number;
  longitude: number;
  description: string;
  machineType: MachineType;
  operatingStatus: OperatingStatus;
  paymentMethods: PaymentMethod[];
  lastUpdated: Date;
  imageURL?: string;
  thumbnailURL?: string;
  hasImage: boolean;
  imageUploadedAt?: Date;
}

export interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface ExifLocationResult {
  coordinate: LocationCoordinates;
  altitude?: number;
  accuracy?: number;
  timestamp?: Date;
}

export interface CreateVendingMachineDto {
  latitude: number;
  longitude: number;
  description: string;
  machineType: MachineType;
  operatingStatus: OperatingStatus;
  paymentMethods: PaymentMethod[];
}

export interface UploadResult {
  imageURL: string;
  thumbnailURL: string;
}