import { Suspense, lazy, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout';
import { AuthProvider } from './hooks/useAuth';
import { NavigationStateProvider } from './hooks/useNavigation';
import ScrollToTop from './components/ScrollToTop';
import WhatsAppButton from './components/WhatsAppButton';
import PWAInstall from './components/PWAInstall';
import { ToastContainer } from './components/ui/Toast';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { performStartupDatabaseChecks } from './utils/database-verification';

import { LegacyQuizRedirect } from './components/quiz/LegacyQuizRedirect';
import { NavigationDebug } from './components/NavigationDebug';
import { RouteErrorBoundary, ProtectedRoute, RouteParamValidator, UrlPersistenceProvider } from './components/routing';
import { EnhancedAuthProvider } from './components/auth';
import { routeConfigs } from './config/routes';
import { routePreloader } from './utils/route-preloading';

// Import NotFoundPage directly since it's used outside the route config
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then(module => ({ default: module.NotFoundPage })));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <LoadingSpinner size="lg" />
  </div>
);



export function App() {
  // Perform startup database verification checks
  useEffect(() => {
    // Run verification in the background, don't block app startup
    performStartupDatabaseChecks().catch(error => {
      console.error('[APP] Startup verification failed:', error);
    });

    // Preload critical routes for better performance
    const criticalRoutes = routeConfigs.filter(config => 
      ['/', '/subjects', '/quiz', '/login'].includes(config.path)
    );
    routePreloader.preloadCriticalRoutes(criticalRoutes).catch(error => {
      console.warn('[APP] Route preloading failed:', error);
    });
  }, []);

  return (
    <AuthProvider>
      <NavigationStateProvider>
        <UrlPersistenceProvider autoRestore={true} validateOnMount={true}>
          <EnhancedAuthProvider
            sessionTimeoutMinutes={60}
            sessionWarningMinutes={5}
            enableCrossTabSync={true}
            enableSessionTimeout={true}
            enableSessionWarning={true}
            enableAutoRefresh={true}
          >
            <ScrollToTop />
            <WhatsAppButton />
            <PWAInstall />

            <ToastContainer />
            <NavigationDebug />
            <RouteErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Generate routes from configuration */}
              {routeConfigs.map((config) => {
                const RouteComponent = config.component;
                
                // Create the route element with proper protection and validation
                const routeElement = (
                  <ProtectedRoute
                    requireAuth={config.requireAuth}
                    requireAdmin={config.requireAdmin}
                    fallbackPath={config.fallbackPath}
                  >
                    <RouteParamValidator routeConfig={config}>
                      {config.path === '/' ? (
                        // Home page doesn't need Layout wrapper
                        <RouteComponent />
                      ) : (
                        <Layout showFooter={config.showFooter}>
                          <RouteComponent />
                        </Layout>
                      )}
                    </RouteParamValidator>
                  </ProtectedRoute>
                );

                return (
                  <Route
                    key={config.path}
                    path={config.path}
                    element={routeElement}
                  />
                );
              })}

              {/* Legacy routes - redirect to new unified system */}
              <Route path="/quiz/practice" element={<LegacyQuizRedirect mode="practice" />} />
              <Route path="/quiz/cbt" element={<LegacyQuizRedirect mode="exam" />} />

              {/* Events - placeholder routes until EventsPage is created */}
              <Route path="/events" element={<Navigate to="/" replace />} />
              <Route path="/events/:id" element={<Navigate to="/" replace />} />

              {/* Fallback - 404 Page */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </RouteErrorBoundary>
          </EnhancedAuthProvider>
        </UrlPersistenceProvider>
      </NavigationStateProvider>
    </AuthProvider>
  );
}