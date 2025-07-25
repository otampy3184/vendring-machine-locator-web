import { CreateVendingMachineDto, MachineType, OperatingStatus, PaymentMethod } from '@/lib/types';

export function validateLatitude(latitude: any): boolean {
  return typeof latitude === 'number' && 
    !isNaN(latitude) && 
    isFinite(latitude) &&
    latitude >= -90 && 
    latitude <= 90;
}

export function validateLongitude(longitude: any): boolean {
  return typeof longitude === 'number' && 
    !isNaN(longitude) && 
    isFinite(longitude) &&
    longitude >= -180 && 
    longitude <= 180;
}

export function validateCoordinates(coords: any): boolean {
  if (!coords || typeof coords !== 'object') {
    return false;
  }
  
  return validateLatitude(coords.latitude) &&
    validateLongitude(coords.longitude);
}

export function validateDescription(description: any): boolean {
  return typeof description === 'string' &&
    description.trim().length > 0 &&
    description.length <= 500;
}

export function validatePaymentMethods(paymentMethods: any): boolean {
  if (!Array.isArray(paymentMethods) || paymentMethods.length === 0) {
    return false;
  }

  const validMethods = Object.values(PaymentMethod);
  const uniqueMethods = new Set(paymentMethods);

  // Check for duplicates
  if (uniqueMethods.size !== paymentMethods.length) {
    return false;
  }

  // Check all methods are valid
  return paymentMethods.every(method => validMethods.includes(method));
}

interface ImageValidationOptions {
  maxSize?: number;
  allowedTypes?: string[];
}

export function validateImageFile(
  file: File,
  options: ImageValidationOptions = {}
): boolean {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  } = options;

  if (file.size > maxSize) {
    return false;
  }

  return allowedTypes.includes(file.type);
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateVendingMachine(data: CreateVendingMachineDto): ValidationResult {
  const errors: string[] = [];

  if (!validateLatitude(data.latitude)) {
    errors.push('Invalid latitude: must be between -90 and 90');
  }

  if (!validateLongitude(data.longitude)) {
    errors.push('Invalid longitude: must be between -180 and 180');
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.push('Description is required');
  } else if (data.description.length > 500) {
    errors.push('Description must be 500 characters or less');
  }

  if (!data.paymentMethods || data.paymentMethods.length === 0) {
    errors.push('At least one payment method is required');
  } else if (!validatePaymentMethods(data.paymentMethods)) {
    errors.push('Invalid payment methods');
  }

  const validMachineTypes = Object.values(MachineType);
  if (!validMachineTypes.includes(data.machineType)) {
    errors.push('Invalid machine type');
  }

  const validOperatingStatuses = Object.values(OperatingStatus);
  if (!validOperatingStatuses.includes(data.operatingStatus)) {
    errors.push('Invalid operating status');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function sanitizeInput(input: any): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  // Remove HTML tags and dangerous characters
  return input
    .trim()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>]/g, ''); // Remove potentially dangerous characters but keep &
}