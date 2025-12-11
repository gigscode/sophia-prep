/**
 * UnifiedNavigationProvider Tests
 * 
 * Basic tests to verify the UnifiedNavigationProvider works correctly
 * and provides the expected functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { 
  UnifiedNavigationProvider, 
  useUnifiedNavigation, 
  useNavigation, 
  useUrlPersistence 
} from './UnifiedNavigationProvider';

// Mock sessionStorage for testing
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Test component that uses the unified navigation
function TestComponent() {
  const navigation = useUnifiedNavigation();
  
  return (
    <div>
      <div data-testid="current-path">{navigation.currentPath}</div>
      <div data-testid="is-navigating">{navigation.isNavigating.toString()}</div>
      <div data-testid="is-url-valid">{navigation.isUrlValid.toString()}</div>
      <button 
        data-testid="navigate-button"
        onClick={() => navigation.navigate('/test')}
      >
        Navigate
      </button>
      <button 
        data-testid="preserve-params-button"
        onClick={() => navigation.preserveCurrentParams()}
      >
        Preserve Params
      </button>
    </div>
  );
}

// Helper function to render component with providers
function renderWithProviders(component: React.ReactElement) {
  return render(
    <BrowserRouter>
      <UnifiedNavigationProvider>
        {component}
      </UnifiedNavigationProvider>
    </BrowserRouter>
  );
}

describe('UnifiedNavigationProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  it('should provide navigation context to child components', () => {
    renderWithProviders(<TestComponent />);
    
    expect(screen.getByTestId('current-path')).toBeInTheDocument();
    expect(screen.getByTestId('is-navigating')).toBeInTheDocument();
    expect(screen.getByTestId('is-url-valid')).toBeInTheDocument();
  });

  it('should initialize with default navigation state', () => {
    renderWithProviders(<TestComponent />);
    
    expect(screen.getByTestId('is-navigating')).toHaveTextContent('false');
    expect(screen.getByTestId('is-url-valid')).toHaveTextContent('true');
  });

  it('should provide navigation methods', () => {
    renderWithProviders(<TestComponent />);
    
    const navigateButton = screen.getByTestId('navigate-button');
    const preserveParamsButton = screen.getByTestId('preserve-params-button');
    
    expect(navigateButton).toBeInTheDocument();
    expect(preserveParamsButton).toBeInTheDocument();
  });

  it('should handle navigation method calls without errors', async () => {
    renderWithProviders(<TestComponent />);
    
    const navigateButton = screen.getByTestId('navigate-button');
    const preserveParamsButton = screen.getByTestId('preserve-params-button');
    
    // These should not throw errors
    await act(async () => {
      navigateButton.click();
    });
    
    await act(async () => {
      preserveParamsButton.click();
    });
  });

  it('should throw error when useUnifiedNavigation is used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useUnifiedNavigation must be used within UnifiedNavigationProvider');
    
    consoleSpy.mockRestore();
  });
});

describe('Backward Compatibility Hooks', () => {
  it('should provide useNavigation hook with expected interface', () => {
    function LegacyTestComponent() {
      const navigation = useNavigation();
      
      return (
        <div>
          <div data-testid="legacy-current-path">{navigation.currentPath}</div>
          <div data-testid="legacy-is-navigating">{navigation.isNavigating.toString()}</div>
        </div>
      );
    }

    renderWithProviders(<LegacyTestComponent />);
    
    expect(screen.getByTestId('legacy-current-path')).toBeInTheDocument();
    expect(screen.getByTestId('legacy-is-navigating')).toBeInTheDocument();
  });

  it('should provide useUrlPersistence hook with expected interface', () => {
    function UrlPersistenceTestComponent() {
      const urlPersistence = useUrlPersistence();
      
      return (
        <div>
          <div data-testid="url-valid">{urlPersistence.isUrlValid.toString()}</div>
          <button 
            data-testid="preserve-url-button"
            onClick={() => urlPersistence.preserveCurrentUrl()}
          >
            Preserve URL
          </button>
        </div>
      );
    }

    renderWithProviders(<UrlPersistenceTestComponent />);
    
    expect(screen.getByTestId('url-valid')).toBeInTheDocument();
    expect(screen.getByTestId('preserve-url-button')).toBeInTheDocument();
  });
});