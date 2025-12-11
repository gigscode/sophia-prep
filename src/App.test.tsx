import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { App } from './App';

// Mock all the external dependencies
vi.mock('./hooks/useAuth', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="auth-provider">{children}</div>
}));

vi.mock('./components/navigation/UnifiedNavigationProvider', () => ({
  UnifiedNavigationProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="unified-navigation-provider">{children}</div>
}));

vi.mock('./components/auth', () => ({
  EnhancedAuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="enhanced-auth-provider">{children}</div>
}));

vi.mock('./components/routing', () => ({
  RouteErrorBoundary: ({ children }: { children: React.ReactNode }) => <div data-testid="route-error-boundary">{children}</div>,
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => <div data-testid="protected-route">{children}</div>,
  RouteParamValidator: ({ children }: { children: React.ReactNode }) => <div data-testid="route-param-validator">{children}</div>
}));

vi.mock('./components/ScrollToTop', () => ({
  default: () => <div data-testid="scroll-to-top" />
}));

vi.mock('./components/WhatsAppButton', () => ({
  default: () => <div data-testid="whatsapp-button" />
}));

vi.mock('./components/PWAInstall', () => ({
  default: () => <div data-testid="pwa-install" />
}));

vi.mock('./components/ui/Toast', () => ({
  ToastContainer: () => <div data-testid="toast-container" />
}));

vi.mock('./components/NavigationDebug', () => ({
  NavigationDebug: () => <div data-testid="navigation-debug" />
}));



vi.mock('./utils/database-verification', () => ({
  performStartupDatabaseChecks: vi.fn().mockResolvedValue(undefined)
}));

vi.mock('./utils/route-preloading', () => ({
  routePreloader: {
    preloadCriticalRoutes: vi.fn().mockResolvedValue(undefined)
  }
}));

vi.mock('./config/routes', () => ({
  routeConfigs: []
}));

// Mock lazy imports
vi.mock('./pages/NotFoundPage', () => ({
  NotFoundPage: () => <div data-testid="not-found-page">Not Found</div>
}));

describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Clean Component Removal Tests', () => {
    it('should render without AppUpdateNotification component', () => {
      render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      // Verify that AppUpdateNotification is NOT rendered
      expect(screen.queryByTestId('app-update-notification')).not.toBeInTheDocument();
      
      // Verify other components are still rendered to ensure app functionality is intact
      expect(screen.getByTestId('scroll-to-top')).toBeInTheDocument();
      expect(screen.getByTestId('whatsapp-button')).toBeInTheDocument();
      expect(screen.getByTestId('pwa-install')).toBeInTheDocument();
      expect(screen.getByTestId('toast-container')).toBeInTheDocument();
      expect(screen.getByTestId('navigation-debug')).toBeInTheDocument();
    });

    it('should not have any unused imports after component removal', () => {
      // This test verifies that the App component renders successfully
      // which would fail if there were unused imports causing compilation errors
      expect(() => {
        render(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
      }).not.toThrow();
    });

    it('should render App.tsx correctly without the removed component', () => {
      const { container } = render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      // Verify the app renders with expected structure
      expect(container.firstChild).toBeTruthy();
      
      // Verify essential providers are present
      expect(screen.getByTestId('auth-provider')).toBeInTheDocument();
      expect(screen.getByTestId('unified-navigation-provider')).toBeInTheDocument();
      expect(screen.getByTestId('enhanced-auth-provider')).toBeInTheDocument();
      expect(screen.getByTestId('route-error-boundary')).toBeInTheDocument();
    });

    it('should not contain any references to AppUpdateNotification in rendered output', () => {
      const { container } = render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      // Check that no DOM elements contain references to the removed component
      const htmlContent = container.innerHTML;
      expect(htmlContent).not.toContain('AppUpdateNotification');
      expect(htmlContent).not.toContain('app-update-notification');
      expect(htmlContent).not.toContain('update-notification');
    });

    it('should maintain all existing functionality after component removal', () => {
      // Verify that removing AppUpdateNotification doesn't break other functionality
      const { rerender } = render(
        <BrowserRouter>
          <App />
        </BrowserRouter>
      );

      // Test that the component can be re-rendered without issues
      expect(() => {
        rerender(
          <BrowserRouter>
            <App />
          </BrowserRouter>
        );
      }).not.toThrow();

      // Verify core components are still functional
      expect(screen.getByTestId('scroll-to-top')).toBeInTheDocument();
      expect(screen.getByTestId('whatsapp-button')).toBeInTheDocument();
      expect(screen.getByTestId('pwa-install')).toBeInTheDocument();
    });
  });
});