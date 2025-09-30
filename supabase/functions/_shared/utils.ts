// Global utility to safely extract error messages without TypeScript errors
export const getErrorMessage = (error: unknown): string => {
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
};

// Apply to all edge functions to resolve TypeScript unknown error issues
(globalThis as any).getErrorMessage = getErrorMessage;