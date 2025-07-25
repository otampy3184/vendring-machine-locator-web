import { ImageService } from '@/lib/services/image.service';
import { storage } from '@/lib/firebase';
import { ExifLocationResult, UploadResult } from '@/lib/types';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  StorageReference 
} from 'firebase/storage';
import * as exifr from 'exifr';

// Mock Firebase Storage
jest.mock('@/lib/firebase', () => ({
  storage: {},
}));

jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn(),
  deleteObject: jest.fn(),
}));

// Mock exifr
jest.mock('exifr', () => ({
  parse: jest.fn(),
  gps: jest.fn(),
}));

describe('ImageService', () => {
  let service: ImageService;
  
  beforeEach(() => {
    jest.clearAllMocks();
    service = new ImageService();
    
    // Mock URL.createObjectURL
    global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = jest.fn();
  });

  describe('uploadImage', () => {
    it('should upload image successfully', async () => {
      // Arrange
      const mockFile = new File(['test image'], 'test.jpg', { type: 'image/jpeg' });
      const machineId = 'test-machine-123';
      const mockImageUrl = 'https://storage.googleapis.com/test/image.jpg';
      const mockThumbnailUrl = 'https://storage.googleapis.com/test/thumbnail.jpg';
      
      const mockStorageRef = {
        name: 'test.jpg',
        fullPath: 'images/test.jpg'
      } as StorageReference;
      
      const mockUploadResult = {
        ref: mockStorageRef,
        metadata: {}
      };
      
      (ref as jest.Mock).mockReturnValue(mockStorageRef);
      (uploadBytes as jest.Mock).mockResolvedValue(mockUploadResult);
      (getDownloadURL as jest.Mock)
        .mockResolvedValueOnce(mockImageUrl)
        .mockResolvedValueOnce(mockThumbnailUrl);
      
      // Mock generateThumbnail to avoid timeout
      jest.spyOn(service, 'generateThumbnail').mockResolvedValue(new Blob(['thumb'], { type: 'image/jpeg' }));

      // Act
      const result = await service.uploadImage(mockFile, machineId);

      // Assert
      expect(result).toEqual({
        imageURL: mockImageUrl,
        thumbnailURL: mockThumbnailUrl
      });
      expect(ref).toHaveBeenCalledWith(storage, expect.stringContaining(`machines/${machineId}/`));
      expect(uploadBytes).toHaveBeenCalledWith(mockStorageRef, mockFile);
      expect(getDownloadURL).toHaveBeenCalledTimes(2);
    });

    it('should validate file size', async () => {
      // Arrange
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { 
        type: 'image/jpeg' 
      });
      
      // Act & Assert
      await expect(service.uploadImage(largeFile, 'machine-id'))
        .rejects.toThrow('File size exceeds 10MB limit');
    });

    it('should validate file type', async () => {
      // Arrange
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      // Act & Assert
      await expect(service.uploadImage(invalidFile, 'machine-id'))
        .rejects.toThrow('Invalid file type. Only images are allowed');
    });

    it('should handle upload errors', async () => {
      // Arrange
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockError = new Error('Upload failed');
      
      (ref as jest.Mock).mockReturnValue({});
      (uploadBytes as jest.Mock).mockRejectedValue(mockError);

      // Act & Assert
      await expect(service.uploadImage(mockFile, 'machine-id'))
        .rejects.toThrow('Upload failed');
    });

    it('should handle progress callback', async () => {
      // Arrange
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockProgressCallback = jest.fn();
      const mockStorageRef = {} as StorageReference;
      const mockUploadResult = { ref: mockStorageRef };
      
      (ref as jest.Mock).mockReturnValue(mockStorageRef);
      (uploadBytes as jest.Mock).mockImplementation(async () => {
        // Simulate progress updates
        mockProgressCallback(0);
        mockProgressCallback(50);
        mockProgressCallback(100);
        return mockUploadResult;
      });
      (getDownloadURL as jest.Mock).mockResolvedValue('https://example.com/image.jpg');
      
      // Mock generateThumbnail to avoid timeout
      jest.spyOn(service, 'generateThumbnail').mockResolvedValue(new Blob(['thumb'], { type: 'image/jpeg' }));

      // Act
      await service.uploadImage(mockFile, 'machine-id', mockProgressCallback);

      // Assert
      expect(mockProgressCallback).toHaveBeenCalledWith(0);
      expect(mockProgressCallback).toHaveBeenCalledWith(50);
      expect(mockProgressCallback).toHaveBeenCalledWith(100);
    });
  });

  describe('extractExifLocation', () => {
    it('should extract location from EXIF data', async () => {
      // Arrange
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockExifData = {
        latitude: 35.6895,
        longitude: 139.6917,
        altitude: 45.5,
        GPSLatitude: [35, 41, 22.2],
        GPSLongitude: [139, 41, 30.12],
        GPSAltitude: 45.5,
        DateTimeOriginal: new Date('2024-01-01T12:00:00')
      };
      
      (exifr.gps as jest.Mock).mockResolvedValue({
        latitude: 35.6895,
        longitude: 139.6917
      });
      
      (exifr.parse as jest.Mock).mockResolvedValue(mockExifData);

      // Act
      const result = await service.extractExifLocation(mockFile);

      // Assert
      expect(result).toEqual({
        coordinate: {
          latitude: 35.6895,
          longitude: 139.6917
        },
        altitude: 45.5,
        accuracy: undefined,
        timestamp: mockExifData.DateTimeOriginal
      });
    });

    it('should return null when no EXIF location data', async () => {
      // Arrange
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      (exifr.gps as jest.Mock).mockResolvedValue(null);
      (exifr.parse as jest.Mock).mockResolvedValue({});

      // Act
      const result = await service.extractExifLocation(mockFile);

      // Assert
      expect(result).toBeNull();
    });

    it('should validate latitude range', async () => {
      // Arrange
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      (exifr.gps as jest.Mock).mockResolvedValue({
        latitude: 91, // Invalid
        longitude: 139.6917
      });

      // Act
      const result = await service.extractExifLocation(mockFile);

      // Assert
      expect(result).toBeNull();
    });

    it('should validate longitude range', async () => {
      // Arrange
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      (exifr.gps as jest.Mock).mockResolvedValue({
        latitude: 35.6895,
        longitude: 181 // Invalid
      });

      // Act
      const result = await service.extractExifLocation(mockFile);

      // Assert
      expect(result).toBeNull();
    });

    it('should handle EXIF parsing errors', async () => {
      // Arrange
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockError = new Error('EXIF parsing failed');
      
      (exifr.gps as jest.Mock).mockRejectedValue(mockError);

      // Act
      const result = await service.extractExifLocation(mockFile);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('compressImage', () => {
    it('should compress image to specified quality', async () => {
      // Arrange
      const mockFile = new File(['test image data'], 'test.jpg', { type: 'image/jpeg' });
      const mockCanvas = {
        toBlob: jest.fn((callback) => {
          callback(new Blob(['compressed'], { type: 'image/jpeg' }));
        })
      };
      const mockContext = {
        drawImage: jest.fn()
      };
      
      // Mock canvas creation
      const originalCreateElement = document.createElement;
      document.createElement = jest.fn((tagName) => {
        if (tagName === 'canvas') {
          return {
            getContext: jest.fn(() => mockContext),
            toBlob: mockCanvas.toBlob,
            width: 0,
            height: 0
          } as any;
        }
        return originalCreateElement.call(document, tagName);
      });

      // Mock image loading
      global.Image = jest.fn().mockImplementation(() => ({
        onload: null,
        onerror: null,
        src: '',
        width: 1920,
        height: 1080,
        addEventListener: jest.fn((event, handler) => {
          if (event === 'load' && handler) {
            setTimeout(() => handler(), 0);
          }
        })
      })) as any;

      // Act
      const result = await service.compressImage(mockFile, { quality: 0.8 });

      // Assert
      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('image/jpeg');
      
      // Cleanup
      document.createElement = originalCreateElement;
    });

    it('should resize image if dimensions exceed maximum', async () => {
      // Arrange
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockCanvas = {
        toBlob: jest.fn((callback) => {
          callback(new Blob(['compressed'], { type: 'image/jpeg' }));
        }),
        width: 0,
        height: 0
      };
      const mockContext = {
        drawImage: jest.fn()
      };
      
      document.createElement = jest.fn(() => ({
        getContext: jest.fn(() => mockContext),
        toBlob: mockCanvas.toBlob,
        width: 0,
        height: 0
      } as any));

      global.Image = jest.fn().mockImplementation(() => ({
        onload: null,
        src: '',
        width: 4000,
        height: 3000,
        addEventListener: jest.fn((event, handler) => {
          if (event === 'load') setTimeout(() => handler(), 0);
        })
      })) as any;

      // Act
      const result = await service.compressImage(mockFile, { 
        maxWidth: 1920, 
        maxHeight: 1080 
      });

      // Assert
      expect(mockContext.drawImage).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Blob);
    });

    it('should handle image loading errors', async () => {
      // Arrange
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      global.Image = jest.fn().mockImplementation(() => ({
        onerror: null,
        src: '',
        addEventListener: jest.fn((event, handler) => {
          if (event === 'error') {
            setTimeout(() => handler(new Error('Image load failed')), 0);
          }
        })
      })) as any;

      // Act & Assert
      await expect(service.compressImage(mockFile))
        .rejects.toThrow('Failed to load image');
    });
  });

  describe('deleteImage', () => {
    it('should delete image from storage', async () => {
      // Arrange
      const imageUrl = 'https://storage.googleapis.com/v0/b/bucket/o/machines%2F123%2Fimage.jpg?alt=media';
      const mockStorageRef = {} as StorageReference;
      
      (ref as jest.Mock).mockReturnValue(mockStorageRef);
      (deleteObject as jest.Mock).mockResolvedValue(undefined);

      // Act
      await service.deleteImage(imageUrl);

      // Assert
      expect(ref).toHaveBeenCalledWith(storage, 'machines/123/image.jpg');
      expect(deleteObject).toHaveBeenCalledWith(mockStorageRef);
    });

    it('should handle invalid URLs', async () => {
      // Arrange
      const invalidUrl = 'https://storage.googleapis.com/invalid-format';

      // Act & Assert
      await expect(service.deleteImage(invalidUrl))
        .rejects.toThrow('Invalid storage URL');
    });

    it('should handle deletion errors', async () => {
      // Arrange
      const imageUrl = 'https://storage.googleapis.com/v0/b/bucket/o/image.jpg?alt=media';
      const mockError = new Error('Delete failed');
      
      (ref as jest.Mock).mockReturnValue({});
      (deleteObject as jest.Mock).mockRejectedValue(mockError);

      // Act & Assert
      await expect(service.deleteImage(imageUrl))
        .rejects.toThrow('Failed to delete image');
    });
  });

  describe('generateThumbnail', () => {
    it('should generate thumbnail from image', async () => {
      // Arrange
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const mockThumbnailBlob = new Blob(['thumbnail'], { type: 'image/jpeg' });
      
      // Mock compress method
      jest.spyOn(service, 'compressImage').mockResolvedValue(mockThumbnailBlob);

      // Act
      const result = await service.generateThumbnail(mockFile);

      // Assert
      expect(result).toBe(mockThumbnailBlob);
      expect(service.compressImage).toHaveBeenCalledWith(mockFile, {
        maxWidth: 300,
        maxHeight: 300,
        quality: 0.7
      });
    });
  });

  describe('isValidImageType', () => {
    it('should accept valid image types', () => {
      // Arrange & Act & Assert
      expect(service.isValidImageType('image/jpeg')).toBe(true);
      expect(service.isValidImageType('image/png')).toBe(true);
      expect(service.isValidImageType('image/gif')).toBe(true);
      expect(service.isValidImageType('image/webp')).toBe(true);
    });

    it('should reject invalid image types', () => {
      // Arrange & Act & Assert
      expect(service.isValidImageType('text/plain')).toBe(false);
      expect(service.isValidImageType('application/pdf')).toBe(false);
      expect(service.isValidImageType('video/mp4')).toBe(false);
    });
  });
});