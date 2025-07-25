import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { storage } from '@/lib/firebase';
import { ExifLocationResult, UploadResult } from '@/lib/types';
import * as exifr from 'exifr';

interface CompressOptions {
  quality?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export class ImageService {
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly VALID_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  async uploadImage(
    file: File, 
    machineId: string, 
    onProgress?: (progress: number) => void
  ): Promise<UploadResult> {
    // Validate file size
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error('File size exceeds 10MB limit');
    }

    // Validate file type
    if (!this.isValidImageType(file.type)) {
      throw new Error('Invalid file type. Only images are allowed');
    }

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}_${file.name}`;
    const storagePath = `machines/${machineId}/${filename}`;

    // Create storage reference
    const storageRef = ref(storage, storagePath);

    // Upload original image
    if (onProgress) {
      onProgress(0);
    }
    
    const uploadResult = await uploadBytes(storageRef, file);
    
    if (onProgress) {
      onProgress(50);
    }

    // Generate and upload thumbnail
    const thumbnailBlob = await this.generateThumbnail(file);
    const thumbnailPath = `machines/${machineId}/thumb_${filename}`;
    const thumbnailRef = ref(storage, thumbnailPath);
    await uploadBytes(thumbnailRef, thumbnailBlob);

    if (onProgress) {
      onProgress(100);
    }

    // Get download URLs
    const imageURL = await getDownloadURL(uploadResult.ref);
    const thumbnailURL = await getDownloadURL(thumbnailRef);

    return {
      imageURL,
      thumbnailURL
    };
  }

  async extractExifLocation(file: File): Promise<ExifLocationResult | null> {
    try {
      // Extract GPS data
      const gpsData = await exifr.gps(file);
      
      if (!gpsData || !gpsData.latitude || !gpsData.longitude) {
        return null;
      }

      // Validate coordinates
      if (Math.abs(gpsData.latitude) > 90 || Math.abs(gpsData.longitude) > 180) {
        return null;
      }

      // Extract additional metadata
      const metadata = await exifr.parse(file, {
        pick: ['DateTimeOriginal', 'GPSAltitude']
      });

      return {
        coordinate: {
          latitude: gpsData.latitude,
          longitude: gpsData.longitude
        },
        altitude: metadata?.GPSAltitude || metadata?.altitude,
        accuracy: undefined, // EXIF doesn't typically include accuracy
        timestamp: metadata?.DateTimeOriginal || undefined
      };
    } catch (error) {
      console.error('Failed to extract EXIF location:', error);
      return null;
    }
  }

  async compressImage(file: File, options: CompressOptions = {}): Promise<Blob> {
    const {
      quality = 0.8,
      maxWidth = 1920,
      maxHeight = 1080
    } = options;

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.addEventListener('load', () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          
          if (width > height) {
            width = maxWidth;
            height = width / aspectRatio;
          } else {
            height = maxHeight;
            width = height * aspectRatio;
          }
        }

        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          file.type,
          quality
        );
      });

      img.addEventListener('error', () => {
        reject(new Error('Failed to load image'));
      });

      // Create object URL and load image
      const url = URL.createObjectURL(file);
      img.src = url;
    });
  }

  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract storage path from URL
      // Handle both Firebase Storage URLs and simple paths
      let storagePath: string;
      
      if (imageUrl.includes('storage.googleapis.com')) {
        const url = new URL(imageUrl);
        const pathMatch = url.pathname.match(/\/v0\/b\/[^\/]+\/o\/(.*?)(\?|$)/);
        
        if (!pathMatch || !pathMatch[1]) {
          throw new Error('Invalid storage URL');
        }
        
        storagePath = decodeURIComponent(pathMatch[1]);
      } else {
        // Simple path format
        storagePath = imageUrl;
      }
      
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (error) {
      if (error instanceof Error && error.message === 'Invalid storage URL') {
        throw error;
      }
      throw new Error('Failed to delete image');
    }
  }

  async generateThumbnail(file: File): Promise<Blob> {
    return this.compressImage(file, {
      maxWidth: 300,
      maxHeight: 300,
      quality: 0.7
    });
  }

  isValidImageType(type: string): boolean {
    return this.VALID_IMAGE_TYPES.includes(type);
  }
}

// Export singleton instance
export const imageService = new ImageService();