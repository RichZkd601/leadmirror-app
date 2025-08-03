// Enhanced error handling utilities
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleApiError(error: any): never {
  console.error('API Error:', error);
  
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    throw new AppError('Problème de connexion. Vérifiez votre connexion internet.', 0);
  }
  
  // Parse error message and status
  const errorMessage = error.message || 'Une erreur inattendue s\'est produite';
  const statusMatch = errorMessage.match(/^(\d{3}):/);
  const statusCode = statusMatch ? parseInt(statusMatch[1]) : 500;
  const message = statusMatch ? errorMessage.replace(/^\d{3}:\s*/, '') : errorMessage;
  
  throw new AppError(message, statusCode);
}

export function isAuthError(error: any): boolean {
  return error instanceof AppError && (error.statusCode === 401 || error.statusCode === 403);
}

export function createSafeAsyncWrapper<T extends any[], R>(
  asyncFn: (...args: T) => Promise<R>,
  fallback?: R
) {
  return async (...args: T): Promise<R | undefined> => {
    try {
      return await asyncFn(...args);
    } catch (error) {
      console.error('Safe async wrapper caught error:', error);
      return fallback;
    }
  };
}

// Global error event listener for unhandled errors
export function setupGlobalErrorHandling() {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    event.preventDefault(); // Prevent console error
  });
  
  // Handle global errors
  window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    event.preventDefault(); // Prevent console error
  });
}