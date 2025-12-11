import { Suspense, ReactNode } from 'react';
import { RouteErrorBoundary } from './RouteErrorBoundary';
import { LazyLoadErrorFallback } from './LazyLoadErrorFallback';

interface SuspenseWithErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  errorFallback?: ReactNode;
}

/**
 * SuspenseWithErrorBoundary combines Suspense with error boundary for robust lazy loading
 * 
 * Features:
 * - Handles both loading states and loading errors
 * - Provides consistent error recovery across all lazy-loaded components
 * - Customizable fallback components
 * 
 * Requirements: 2.4, 3.2
 */
export function SuspenseWithErrorBoundary({
  children,
  fallback,
  errorFallback
}: SuspenseWithErrorBoundaryProps) {
  const defaultFallback = (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  const defaultErrorFallback = <LazyLoadErrorFallback />;

  return (
    <RouteErrorBoundary fallback={errorFallback || defaultErrorFallback}>
      <Suspense fallback={fallback || defaultFallback}>
        {children}
      </Suspense>
    </RouteErrorBoundary>
  );
}