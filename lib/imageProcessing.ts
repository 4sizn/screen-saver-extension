import imageCompression from 'browser-image-compression';

/**
 * Compress an image file to optimize storage and loading performance
 * @param file - Image file to compress
 * @returns Compressed Blob ready for IndexedDB storage
 */
export async function compressImage(file: File): Promise<Blob> {
  const options = {
    maxSizeMB: 0.5, // 500KB target
    maxWidthOrHeight: 1920, // Full HD resolution
    useWebWorker: true, // Non-blocking compression
    fileType: 'image/jpeg' as const, // Universal format
    initialQuality: 0.85, // Good quality balance
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    throw new Error('Failed to compress image');
  }
}

/**
 * Validate image file type and size before processing
 * @param file - File to validate
 * @returns Validation result with error message if invalid
 */
export function validateImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  // Check MIME type
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
  ];

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type: ${file.type}. Allowed types: JPEG, PNG, WebP`,
    };
  }

  // Check file size (10MB limit before compression)
  const maxSizeBytes = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size: 10MB`,
    };
  }

  return { valid: true };
}

/**
 * Create an object URL for displaying image preview
 * @param blob - Image blob to create URL for
 * @returns Blob URL string
 */
export function createObjectURL(blob: Blob): string {
  return URL.createObjectURL(blob);
}

/**
 * Revoke an object URL to free memory
 * @param url - Blob URL to revoke
 */
export function revokeObjectURL(url: string): void {
  URL.revokeObjectURL(url);
}
