import { MAX_IMAGE_SIZE, ACCEPTED_IMAGE_TYPES } from './constants';

/**
 * Validate an image file — checks type and size.
 */
export function validateImage(file) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return { valid: false, error: 'Unsupported format. Use PNG, JPG, GIF, or WebP.' };
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return { valid: false, error: `Image too large. Max ${MAX_IMAGE_SIZE / (1024 * 1024)}MB.` };
  }
  return { valid: true };
}

/**
 * Read a File as a base64 data URL string.
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Compress an image using Canvas if it exceeds the max size.
 * Returns a base64 data URL.
 */
export async function compressImage(file) {
  // If small enough, just convert directly
  if (file.size <= MAX_IMAGE_SIZE) {
    return fileToBase64(file);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      let { width, height } = img;

      // Scale down proportionally
      const maxDim = 1920;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Try progressively lower quality until under limit
      let quality = 0.8;
      let result = canvas.toDataURL('image/jpeg', quality);

      while (result.length > MAX_IMAGE_SIZE * 1.37 && quality > 0.1) {
        quality -= 0.1;
        result = canvas.toDataURL('image/jpeg', quality);
      }

      resolve(result);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * Handle paste event — extract image from clipboard.
 */
export function getImageFromClipboard(clipboardData) {
  if (!clipboardData || !clipboardData.items) return null;

  for (const item of clipboardData.items) {
    if (item.type.startsWith('image/')) {
      return item.getAsFile();
    }
  }
  return null;
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format timestamp to relative time.
 */
export function timeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
