import { useEffect } from 'react';

interface LazyLoadErrorFallbackProps {
  error?: Error;
  retry?: () => void;
}

/**
 * LazyLoadErrorFallback component provides error recovery for failed lazy loading
 * 
 * Features:
 * - Handles chunk loading failures (network issues, outdated builds)
 * - Provides retry mechanism for transient failures
 * - Offers navigation alternatives when retry fails
 * - Logs errors for monitoring
 * 
 * Requirements: 2.4, 3.2
 */
export function LazyLoadErrorFallback({ error, retry }: LazyLoadErrorFallbackProps) {
  useEffect(() => {
    // Log lazy loading errors
    console.error('[LazyLoad] Failed to load component:', error);
    
    // Report to monitoring service if available
    if (typeof window !== 'undefined' && (window as any).reportError) {
      (window as any).reportError(error || new Error('Lazy loading failed'));
    }
  }, [error]);

  const handleRetry = () => {
    if (retry) {
      retry();
    } else {
      // Fallback: reload the page
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      handleGoHome();
    }
  };

  // Check if this is a chunk loading error (common with code splitting)
  const isChunkError = error?.message?.includes('Loading chunk') || 
                      error?.message?.includes('ChunkLoadError') ||
                      error?.name === 'ChunkLoadError';

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isChunkError ? 'Loading Failed' : 'Component Error'}
        </h1>
        
        <p className="text-gray-600 mb-6">
          {isChunkError 
            ? 'Failed to load the page content. This might be due to a network issue or an app update.'
            : 'There was an error loading this page component. Please try again.'
          }
        </p>

        {/* Show error details in development */}
        {process.env.NODE_ENV === 'development' && error && (
          <div className="mb-6 p-4 bg-gray-100 rounded text-left text-sm">
            <p className="font-semibold text-red-600 mb-2">Error Details:</p>
            <p className="text-gray-800 font-mono text-xs break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={handleRetry}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {isChunkError ? 'Reload Page' : 'Try Again'}
          </button>
          <button
            onClick={handleGoBack}
            className="w-full py-2 px-4 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
          >
            Go Back
          </button>
          <button
            onClick={handleGoHome}
            className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
          >
            Go to Home
          </button>
        </div>

        {isChunkError && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              If this problem persists, try clearing your browser cache or check your internet connection.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}