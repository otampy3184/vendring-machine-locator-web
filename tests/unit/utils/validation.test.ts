import {
  validateLatitude,
  validateLongitude,
  validateCoordinates,
  validateDescription,
  validatePaymentMethods,
  validateImageFile,
  validateVendingMachine,
  sanitizeInput
} from '@/lib/utils/validation';
import { CreateVendingMachineDto, MachineType, OperatingStatus, PaymentMethod } from '@/lib/types';

describe('Validation Utilities', () => {
  describe('validateLatitude', () => {
    it('should accept valid latitudes', () => {
      expect(validateLatitude(0)).toBe(true);
      expect(validateLatitude(35.6895)).toBe(true);
      expect(validateLatitude(-35.6895)).toBe(true);
      expect(validateLatitude(90)).toBe(true);
      expect(validateLatitude(-90)).toBe(true);
    });

    it('should reject invalid latitudes', () => {
      expect(validateLatitude(91)).toBe(false);
      expect(validateLatitude(-91)).toBe(false);
      expect(validateLatitude(180)).toBe(false);
      expect(validateLatitude(NaN)).toBe(false);
      expect(validateLatitude(Infinity)).toBe(false);
      expect(validateLatitude(null as any)).toBe(false);
      expect(validateLatitude(undefined as any)).toBe(false);
      expect(validateLatitude('35.6895' as any)).toBe(false);
    });
  });

  describe('validateLongitude', () => {
    it('should accept valid longitudes', () => {
      expect(validateLongitude(0)).toBe(true);
      expect(validateLongitude(139.6917)).toBe(true);
      expect(validateLongitude(-139.6917)).toBe(true);
      expect(validateLongitude(180)).toBe(true);
      expect(validateLongitude(-180)).toBe(true);
    });

    it('should reject invalid longitudes', () => {
      expect(validateLongitude(181)).toBe(false);
      expect(validateLongitude(-181)).toBe(false);
      expect(validateLongitude(360)).toBe(false);
      expect(validateLongitude(NaN)).toBe(false);
      expect(validateLongitude(Infinity)).toBe(false);
      expect(validateLongitude(null as any)).toBe(false);
      expect(validateLongitude(undefined as any)).toBe(false);
      expect(validateLongitude('139.6917' as any)).toBe(false);
    });
  });

  describe('validateCoordinates', () => {
    it('should accept valid coordinates', () => {
      expect(validateCoordinates({ latitude: 35.6895, longitude: 139.6917 })).toBe(true);
      expect(validateCoordinates({ latitude: 0, longitude: 0 })).toBe(true);
      expect(validateCoordinates({ latitude: -90, longitude: -180 })).toBe(true);
      expect(validateCoordinates({ latitude: 90, longitude: 180 })).toBe(true);
    });

    it('should reject invalid coordinates', () => {
      expect(validateCoordinates({ latitude: 91, longitude: 139.6917 })).toBe(false);
      expect(validateCoordinates({ latitude: 35.6895, longitude: 181 })).toBe(false);
      expect(validateCoordinates({ latitude: NaN, longitude: 139.6917 })).toBe(false);
      expect(validateCoordinates({ latitude: 35.6895, longitude: NaN })).toBe(false);
      expect(validateCoordinates(null as any)).toBe(false);
      expect(validateCoordinates({} as any)).toBe(false);
    });
  });

  describe('validateDescription', () => {
    it('should accept valid descriptions', () => {
      expect(validateDescription('渋谷駅前の自動販売機')).toBe(true);
      expect(validateDescription('A')).toBe(true);
      expect(validateDescription('A'.repeat(500))).toBe(true);
    });

    it('should reject invalid descriptions', () => {
      expect(validateDescription('')).toBe(false);
      expect(validateDescription('   ')).toBe(false);
      expect(validateDescription('A'.repeat(501))).toBe(false);
      expect(validateDescription(null as any)).toBe(false);
      expect(validateDescription(undefined as any)).toBe(false);
      expect(validateDescription(123 as any)).toBe(false);
    });
  });

  describe('validatePaymentMethods', () => {
    it('should accept valid payment methods', () => {
      expect(validatePaymentMethods([PaymentMethod.CASH])).toBe(true);
      expect(validatePaymentMethods([PaymentMethod.CASH, PaymentMethod.CARD])).toBe(true);
      expect(validatePaymentMethods([
        PaymentMethod.CASH,
        PaymentMethod.CARD,
        PaymentMethod.ELECTRONIC_MONEY,
        PaymentMethod.QR_CODE
      ])).toBe(true);
    });

    it('should reject invalid payment methods', () => {
      expect(validatePaymentMethods([])).toBe(false);
      expect(validatePaymentMethods(['invalid' as any])).toBe(false);
      expect(validatePaymentMethods([PaymentMethod.CASH, 'invalid' as any])).toBe(false);
      expect(validatePaymentMethods(null as any)).toBe(false);
      expect(validatePaymentMethods(undefined as any)).toBe(false);
      expect(validatePaymentMethods('CASH' as any)).toBe(false);
    });

    it('should reject duplicate payment methods', () => {
      expect(validatePaymentMethods([PaymentMethod.CASH, PaymentMethod.CASH])).toBe(false);
    });
  });

  describe('validateImageFile', () => {
    it('should accept valid image files', () => {
      const validFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      expect(validateImageFile(validFile)).toBe(true);
      
      const pngFile = new File(['test'], 'test.png', { type: 'image/png' });
      expect(validateImageFile(pngFile)).toBe(true);
      
      const gifFile = new File(['test'], 'test.gif', { type: 'image/gif' });
      expect(validateImageFile(gifFile)).toBe(true);
      
      const webpFile = new File(['test'], 'test.webp', { type: 'image/webp' });
      expect(validateImageFile(webpFile)).toBe(true);
    });

    it('should reject files that are too large', () => {
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { 
        type: 'image/jpeg' 
      });
      expect(validateImageFile(largeFile)).toBe(false);
    });

    it('should reject non-image files', () => {
      const textFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      expect(validateImageFile(textFile)).toBe(false);
      
      const pdfFile = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      expect(validateImageFile(pdfFile)).toBe(false);
    });

    it('should accept custom size limits', () => {
      const file = new File(['x'.repeat(2 * 1024 * 1024)], 'test.jpg', { 
        type: 'image/jpeg' 
      });
      
      expect(validateImageFile(file, { maxSize: 1 * 1024 * 1024 })).toBe(false);
      expect(validateImageFile(file, { maxSize: 3 * 1024 * 1024 })).toBe(true);
    });

    it('should accept custom allowed types', () => {
      const jpegFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const pngFile = new File(['test'], 'test.png', { type: 'image/png' });
      
      const options = { allowedTypes: ['image/jpeg'] };
      expect(validateImageFile(jpegFile, options)).toBe(true);
      expect(validateImageFile(pngFile, options)).toBe(false);
    });
  });

  describe('validateVendingMachine', () => {
    const validMachine: CreateVendingMachineDto = {
      latitude: 35.6895,
      longitude: 139.6917,
      description: 'Test Machine',
      machineType: MachineType.BEVERAGE,
      operatingStatus: OperatingStatus.OPERATING,
      paymentMethods: [PaymentMethod.CASH]
    };

    it('should accept valid vending machine data', () => {
      const result = validateVendingMachine(validMachine);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should reject invalid latitude', () => {
      const result = validateVendingMachine({
        ...validMachine,
        latitude: 91
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid latitude: must be between -90 and 90');
    });

    it('should reject invalid longitude', () => {
      const result = validateVendingMachine({
        ...validMachine,
        longitude: 181
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid longitude: must be between -180 and 180');
    });

    it('should reject empty description', () => {
      const result = validateVendingMachine({
        ...validMachine,
        description: ''
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Description is required');
    });

    it('should reject description that is too long', () => {
      const result = validateVendingMachine({
        ...validMachine,
        description: 'A'.repeat(501)
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Description must be 500 characters or less');
    });

    it('should reject empty payment methods', () => {
      const result = validateVendingMachine({
        ...validMachine,
        paymentMethods: []
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('At least one payment method is required');
    });

    it('should reject invalid machine type', () => {
      const result = validateVendingMachine({
        ...validMachine,
        machineType: 'INVALID' as any
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid machine type');
    });

    it('should reject invalid operating status', () => {
      const result = validateVendingMachine({
        ...validMachine,
        operatingStatus: 'INVALID' as any
      });
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid operating status');
    });

    it('should collect multiple errors', () => {
      const result = validateVendingMachine({
        latitude: 91,
        longitude: 181,
        description: '',
        machineType: 'INVALID' as any,
        operatingStatus: 'INVALID' as any,
        paymentMethods: []
      } as any);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(3);
    });
  });

  describe('sanitizeInput', () => {
    it('should trim whitespace', () => {
      expect(sanitizeInput('  test  ')).toBe('test');
      expect(sanitizeInput('\n\ttest\n\t')).toBe('test');
    });

    it('should remove HTML tags', () => {
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('alert("xss")');
      expect(sanitizeInput('<p>Hello <b>world</b></p>')).toBe('Hello world');
      expect(sanitizeInput('Normal text')).toBe('Normal text');
    });

    it('should remove dangerous characters', () => {
      expect(sanitizeInput('test<>test')).toBe('testtest');
      expect(sanitizeInput('test&lt;script&gt;test')).toBe('test&lt;script&gt;test');
    });

    it('should handle empty and null inputs', () => {
      expect(sanitizeInput('')).toBe('');
      expect(sanitizeInput('   ')).toBe('');
      expect(sanitizeInput(null as any)).toBe('');
      expect(sanitizeInput(undefined as any)).toBe('');
    });

    it('should preserve Japanese characters', () => {
      expect(sanitizeInput('渋谷駅前の自動販売機')).toBe('渋谷駅前の自動販売機');
      expect(sanitizeInput('  渋谷駅前  ')).toBe('渋谷駅前');
    });

    it('should handle special characters safely', () => {
      expect(sanitizeInput('Test & Co.')).toBe('Test & Co.');
      expect(sanitizeInput('Price: $100')).toBe('Price: $100');
      expect(sanitizeInput('Email: test@example.com')).toBe('Email: test@example.com');
    });
  });
});