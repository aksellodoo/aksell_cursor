/**
 * Utility functions for handling duplicate file detection and resolution
 */

export interface DuplicateFile {
  file: File;
  existingDocument: {
    id: string;
    name: string;
    file_size: number;
    created_at: string;
    folder_name?: string;
    department_name?: string;
  };
  duplicateType: 'critical' | 'informative'; // critical = same folder, informative = different folder
}

export interface DuplicateResolution {
  file: File;
  action: 'cancel' | 'rename' | 'replace' | 'import_anyway';
}

/**
 * Generate a unique filename by adding a number suffix
 */
export function generateUniqueFileName(originalName: string, existingNames: string[]): string {
  const nameParts = originalName.split('.');
  const extension = nameParts.length > 1 ? '.' + nameParts.pop() : '';
  const baseName = nameParts.join('.');
  
  let counter = 1;
  let newName = `${baseName} (${counter})${extension}`;
  
  while (existingNames.includes(newName)) {
    counter++;
    newName = `${baseName} (${counter})${extension}`;
  }
  
  return newName;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Format date for display in Brazilian format
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}