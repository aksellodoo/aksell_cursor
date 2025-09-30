// Utility function to safely extract error messages
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as any).message);
  }
  return String(error);
}

// For backward compatibility with existing code patterns
export function safeErrorMessage(error: unknown, fallback: string = 'Unknown error'): string {
  try {
    return getErrorMessage(error);
  } catch {
    return fallback;
  }
}