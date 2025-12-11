import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  fallbackPath?: string;
}

/**
 * ProtectedRoute component handles authentication guards for routes
 * 
 * Features:
 * - Authentication requirement enforcement
 * - Admin-only route protection
 * - Pending redirect functionality for post-login navigation
 * - Proper loading states during auth initialization
 * 
 * @param children - The component to render if access is granted
 * @param requireAuth - Whether authentication is required (default: true)
 * @param requireAdmin - Whether admin privileges are required (default: false)
 * @param fallbackPath - Path to redirect to if access is denied (default: '/login')
 */
export function ProtectedRoute({
  children,
  requireAuth = true,
  requireAdmin = false,
  fallbackPath = '/login'
}: ProtectedRouteProps) {
  const { user, loading, initialized } = useAuth();
  const location = useLocation();
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  // Store the intended destination for post-login redirect
  useEffect(() => {
    if (requireAuth && !user && initialized) {
      // Only set pending redirect if we're not already on the login page
      if (location.pathname !== fallbackPath) {
        setPendingRedirect(location.pathname + location.search);
        // Store in sessionStorage for persistence across page refreshes
        sessionStorage.setItem('pendingRedirect', location.pathname + location.search);
      }
    }
  }, [user, initialized, location.pathname, location.search, requireAuth, fallbackPath]);

  // Clear pending redirect when user successfully authenticates
  useEffect(() => {
    if (user && pendingRedirect) {
      setPendingRedirect(null);
      sessionStorage.removeItem('pendingRedirect');
    }
  }, [user, pendingRedirect]);

  // Show loading spinner while auth is initializing
  if (loading || !initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Check authentication requirement
  if (requireAuth && !user) {
    // Redirect to login with state containing the intended destination
    return (
      <Navigate 
        to={fallbackPath} 
        state={{ 
          from: location.pathname + location.search,
          message: 'Please log in to access this page'
        }} 
        replace 
      />
    );
  }

  // Check admin requirement
  if (requireAdmin && (!user || !user.isAdmin)) {
    // Show access denied page for admin-only routes
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-6">
            You do not have permission to access this page.
            {user && (
              <>
                <br />
                Current user: <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">{user.email}</span>
              </>
            )}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.history.back()}
              className="w-full py-2 px-4 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
            >
              Go Back
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Access granted - render the protected content
  return <>{children}</>;
}

/**
 * Hook to get and clear any pending redirect after successful authentication
 * Used by login components to redirect users to their intended destination
 */
export function usePendingRedirect() {
  const getPendingRedirect = (): string | null => {
    return sessionStorage.getItem('pendingRedirect');
  };

  const clearPendingRedirect = (): void => {
    sessionStorage.removeItem('pendingRedirect');
  };

  return { getPendingRedirect, clearPendingRedirect };
}