/**
 * Utility functions for handling file storage operations
 */

/**
 * Sanitizes a filename to be safe for storage by:
 * - Removing or replacing invalid characters
 * - Removing accents and diacritics
 * - Preserving the file extension
 * - Ensuring the filename is not empty
 */
export function sanitizeFilename(filename: string): string {
  // Extract the file extension
  const lastDotIndex = filename.lastIndexOf('.');
  const extension = lastDotIndex !== -1 ? filename.slice(lastDotIndex) : '';
  const nameWithoutExtension = lastDotIndex !== -1 ? filename.slice(0, lastDotIndex) : filename;
  
  // Remove accents and normalize unicode
  const normalized = nameWithoutExtension
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics
  
  // Replace invalid characters with underscores
  // Keep only alphanumeric, hyphens, underscores, and spaces
  const sanitized = normalized
    .replace(/[^a-zA-Z0-9\-\_\s]/g, '_')
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .replace(/_+/g, '_') // Replace multiple underscores with single
    .replace(/^[_|_]$/g, ''); // Remove leading/trailing underscores
  
  // Ensure we have a valid filename
  const finalName = sanitized || 'file';
  
  return finalName + extension;
}

/**
 * Generates a storage key with sanitized filename
 */
export function generateStorageKey(documentId: string, filename: string): string {
  const sanitizedFilename = sanitizeFilename(filename);
  return `${documentId}/${sanitizedFilename}`;
}
