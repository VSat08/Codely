import { MAX_FILE_SIZE, ACCEPTED_FILE_EXTENSIONS } from './constants';

/**
 * Get the file extension from a filename (lowercase, with dot).
 */
export function getFileExtension(fileName) {
  if (!fileName) return '';
  const idx = fileName.lastIndexOf('.');
  return idx >= 0 ? fileName.slice(idx).toLowerCase() : '';
}

/**
 * Validate a file — checks extension and size.
 */
export function validateFile(file) {
  const ext = getFileExtension(file.name);
  if (!ext || !ACCEPTED_FILE_EXTENSIONS.includes(ext)) {
    return { valid: false, error: `Unsupported file type: ${ext || 'unknown'}. Accepted: ${ACCEPTED_FILE_EXTENSIONS.join(', ')}` };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File too large. Max ${MAX_FILE_SIZE / (1024 * 1024)}MB.` };
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
 * Returns a Material Symbols icon name based on file extension.
 */
export function getFileIcon(fileName) {
  const ext = getFileExtension(fileName);
  const iconMap = {
    '.pdf': 'picture_as_pdf',
    '.doc': 'description', '.docx': 'description',
    '.xls': 'table_chart', '.xlsx': 'table_chart', '.csv': 'table_chart',
    '.txt': 'article', '.log': 'article',
    '.md': 'article',
    '.json': 'data_object',
    '.xml': 'code', '.html': 'code', '.css': 'code', '.scss': 'code',
    '.yaml': 'settings', '.yml': 'settings',
    '.env': 'settings', '.toml': 'settings', '.ini': 'settings', '.cfg': 'settings',
    '.zip': 'folder_zip', '.tar': 'folder_zip', '.gz': 'folder_zip',
    '.py': 'code', '.js': 'code', '.ts': 'code', '.jsx': 'code', '.tsx': 'code',
    '.java': 'code', '.c': 'code', '.cpp': 'code', '.go': 'code', '.rs': 'code',
    '.rb': 'code', '.php': 'code', '.swift': 'code', '.kt': 'code', '.dart': 'code',
    '.sh': 'terminal', '.dockerfile': 'deployed_code',
    '.sql': 'database',
  };
  return iconMap[ext] || 'draft';
}

/**
 * Format file size for display.
 */
export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
