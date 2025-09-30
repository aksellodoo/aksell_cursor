// Utility functions for automatic color generation

const colorOptions = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', 
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  '#f97316', '#6366f1', '#14b8a6', '#eab308'
];

/**
 * Generates a consistent color for a given name using hash algorithm
 * @param name - The name to generate color for
 * @returns A hex color string
 */
export const generateColorFromName = (name: string): string => {
  if (!name || name.trim() === '') {
    return colorOptions[0]; // Default color for empty names
  }

  // Simple hash function to convert string to number
  let hash = 0;
  const cleanName = name.trim().toLowerCase();
  
  for (let i = 0; i < cleanName.length; i++) {
    const char = cleanName.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Ensure positive number and map to color array index
  const index = Math.abs(hash) % colorOptions.length;
  return colorOptions[index];
};

export { colorOptions };