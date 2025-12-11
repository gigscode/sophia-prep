/**
 * End-to-End Navigation Integration Tests
 * 
 * Focused integration tests for the unified navigation system.
 * Tests core navigation scenarios to ensure no infinite loops, proper URL parameter preservation,
 * browser navigation, error handling, and performance.
 * 
 * **Feature: navigation-infinite-loop-fix, Task 11.1: Perform end-to-end navigation testing**
 * **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 4.3**
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { UnifiedNavigationProvider, useUnifiedNavigation } from '../components/navigation/UnifiedNavigationProvider';
import { NavigationErrorBoundary } from '../components/navigation/NavigationErrorBoundary';

// Mock sessionStorage for testing
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

// Mock window.history for browser navigation tests
const mockHistory = {
  pushState: vi.fn(),
  replaceState: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  state: null,
  length: 1
};

// Simple test component that uses navigation
function NavigationTestComponent() {
  const navigation = useUnifiedNavigation();

  return (
    <div>
      <div data-testid="current-path">{navigation.currentPath}</div>
      <div data-testid="is-navigating">{navigation.isNavigating.toString()}</div>
      <div data-testid="navigation-error">{navigation.navigationError || 'none'}</div>
      <div data-testid="preserved-params">{JSON.stringify(navigation.preservedParams)}</div>
      <div data-testid="circuit-breaker-active">{navigation.isCircuitBreakerActive.toString()}</div>
      
      <button 
        data-testid="navigate-about"
        onClick={() => navigation.navigate('/about')}
      >
        Navigate About
      </button>
      
      <button 
        data-testid="navigate-with-params"
        onClick={() => navigation.navigate('/test?param1=value1&param2=value2')}
      >
        Navigate With Params
      </button>
      
      <button 
        data-testid="preserve-params"
        onClick={() => navigation.preserveCurrentParams(['param1', 'param2'])}
      >
        Preserve Params
      </button>
      
      <button 
        data-testid="go-back"
        onClick={() => navigation.goBack()}
      >
        Go Back
      </button>
      
      <button 
        data-testid="invalid-navigation"
        onClick={() => navigation.navigate('invalid<path>')}
      >
        Invalid Navigation
      </button>
    </div>
  );
}

// Helper function to render the navigation test
function renderNavigationTest() {
  return render(
    <BrowserRouter>
      <NavigationErrorBoundary>
        <UnifiedNavigationProvider enableDebugMode={false}>
          <NavigationTestComponent />
        </UnifiedNavigationProvider>
      </NavigationErrorBoundary>
    </BrowserRouter>
  );
}

describe('End-to-End Navigation Integration Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    vi.clearAllMocks();
    user = userEvent.setup();
    
    // Mock window properties
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true
    });
    
    Object.defineProperty(window, 'history', {
      value: mockHistory,
      writable: true
    });
    
    // Reset mocks
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  describe('Basic Navigation - Requirements 1.1, 1.3', () => {
    it('should navigate without infinite loops', async () => {
      renderNavigationTest();
      
      // Initial state
      expect(screen.getByTestId('current-path')).toHaveTextContent('/');
      expect(screen.getByTestId('is-navigating')).toHaveTextContent('false');
      
      // Navigate to about page
      await user.click(screen.getByTestId('navigate-about'));
      
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/about');
        expect(screen.getByTestId('is-navigating')).toHaveTextContent('false');
      });
      
      // Verify no navigation errors occurred
      expect(screen.getByTestId('navigation-error')).toHaveTextContent('none');
    });
  });

  describe('Initialization Performance - Requirement 1.2', () => {
    it('should initialize quickly without loops', async () => {
      const startTime = Date.now();
      
      renderNavigationTest();
      
      // Wait for initialization to complete
      await waitFor(() => {
        expect(screen.getByTestId('is-navigating')).toHaveTextContent('false');
      }, { timeout: 3000 });
      
      const endTime = Date.now();
      const initializationTime = endTime - startTime;
      
      // Should initialize within 3 seconds
      expect(initializationTime).toBeLessThan(3000);
      
      // Verify no infinite loops during initialization
      expect(screen.getByTestId('circuit-breaker-active')).toHaveTextContent('false');
      expect(screen.getByTestId('navigation-error')).toHaveTextContent('none');
    });
  });

  describe('URL Parameter Preservation - Requirements 2.1, 2.2', () => {
    it('should preserve URL parameters', async () => {
      renderNavigationTest();
      
      // Navigate to page with parameters
      await user.click(screen.getByTestId('navigate-with-params'));
      
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/test?param1=value1&param2=value2');
      });
      
      // Preserve current parameters
      await user.click(screen.getByTestId('preserve-params'));
      
      await waitFor(() => {
        const preservedParams = JSON.parse(screen.getByTestId('preserved-params').textContent || '{}');
        expect(preservedParams).toEqual({ param1: 'value1', param2: 'value2' });
      });
    });
  });

  describe('Browser Navigation - Requirement 4.3', () => {
    it('should handle browser back/forward without loops', async () => {
      renderNavigationTest();
      
      // Navigate to create history
      await user.click(screen.getByTestId('navigate-about'));
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/about');
      });
      
      // Go back
      await user.click(screen.getByTestId('go-back'));
      
      // Verify back navigation was initiated
      expect(mockHistory.back).toHaveBeenCalled();
      
      // Verify no navigation errors
      expect(screen.getByTestId('navigation-error')).toHaveTextContent('none');
      expect(screen.getByTestId('circuit-breaker-active')).toHaveTextContent('false');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid navigation gracefully', async () => {
      renderNavigationTest();
      
      // Attempt invalid navigation
      await user.click(screen.getByTestId('invalid-navigation'));
      
      await waitFor(() => {
        expect(screen.getByTestId('navigation-error')).toContain('Invalid navigation path');
      });
      
      // Verify system remains stable after error
      expect(screen.getByTestId('is-navigating')).toHaveTextContent('false');
      
      // Verify valid navigation still works after error
      await user.click(screen.getByTestId('navigate-about'));
      
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/about');
        expect(screen.getByTestId('is-navigating')).toHaveTextContent('false');
      });
    });
  });

  describe('Performance', () => {
    it('should persist state efficiently', async () => {
      renderNavigationTest();
      
      // Perform navigation that should trigger state persistence
      await user.click(screen.getByTestId('navigate-with-params'));
      
      await waitFor(() => {
        expect(screen.getByTestId('current-path')).toHaveTextContent('/test?param1=value1&param2=value2');
      });
      
      // Verify state was persisted
      expect(mockSessionStorage.setItem).toHaveBeenCalled();
      
      // Check that persistence calls are reasonable (not excessive)
      const setItemCalls = mockSessionStorage.setItem.mock.calls.length;
      expect(setItemCalls).toBeLessThan(10); // Reasonable upper bound
    });
  });
});