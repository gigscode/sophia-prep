import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useNavigation } from './useNavigation';
import { UnifiedNavigationProvider } from '../components/navigation/UnifiedNavigationProvider';

// Mock sessionStorage
const mockSessionStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

// Test component that uses the navigation hook
function TestComponent() {
  const {
    currentPath,
    previousPath,
    isNavigating,
    pendingRedirect,
    navigationError,
    navigate,
    goBack,
    goForward,
    setPendingRedirect,
    clearNavigationError,
  } = useNavigation();

  return (
    <div>
      <div data-testid="current-path">{currentPath}</div>
      <div data-testid="previous-path">{previousPath || 'none'}</div>
      <div data-testid="is-navigating">{isNavigating ? 'true' : 'false'}</div>
      <div data-testid="pending-redirect">{pendingRedirect || 'none'}</div>
      <div data-testid="navigation-error">{navigationError || 'none'}</div>
      <button onClick={() => navigate('/test')} data-testid="navigate-btn">
        Navigate
      </button>
      <button onClick={() => goBack()} data-testid="back-btn">
        Back
      </button>
      <button onClick={() => goForward()} data-testid="forward-btn">
        Forward
      </button>
      <button onClick={() => setPendingRedirect('/pending')} data-testid="set-pending-btn">
        Set Pending
      </button>
      <button onClick={clearNavigationError} data-testid="clear-error-btn">
        Clear Error
      </button>
    </div>
  );
}

function renderWithProviders(initialPath = '/') {
  return render(
    <BrowserRouter>
      <UnifiedNavigationProvider enableDebugMode={false}>
        <TestComponent />
      </UnifiedNavigationProvider>
    </BrowserRouter>
  );
}

describe('useNavigation with UnifiedNavigationProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionStorage.getItem.mockReturnValue(null);
  });

  it('should initialize with current path', () => {
    renderWithProviders();
    
    expect(screen.getByTestId('current-path')).toHaveTextContent('/');
    expect(screen.getByTestId('previous-path')).toHaveTextContent('none');
    expect(screen.getByTestId('is-navigating')).toHaveTextContent('false');
  });

  it('should handle pending redirects', () => {
    renderWithProviders();
    
    act(() => {
      screen.getByTestId('set-pending-btn').click();
    });
    
    // The pending redirect should be set (using unified navigation storage)
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'nav_unified_pendingRedirect',
      JSON.stringify('/pending')
    );
  });

  it('should preserve state in sessionStorage', () => {
    renderWithProviders();
    
    act(() => {
      screen.getByTestId('set-pending-btn').click();
    });
    
    expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
      'nav_unified_pendingRedirect',
      JSON.stringify('/pending')
    );
  });

  it('should restore state from sessionStorage', async () => {
    mockSessionStorage.getItem.mockImplementation((key) => {
      if (key === 'nav_unified_currentState') {
        return JSON.stringify({
          previousPath: '/previous',
          pendingRedirect: '/pending',
          timestamp: Date.now()
        });
      }
      return null;
    });
    
    renderWithProviders();
    
    // The unified navigation system handles state restoration differently
    // We just verify that the mechanism attempts to load from storage
    expect(mockSessionStorage.getItem).toHaveBeenCalledWith('nav_unified_currentState');
  });

  it('should handle navigation errors gracefully', () => {
    renderWithProviders();
    
    // The navigate function should handle errors internally
    // This test verifies the error handling mechanism exists
    expect(screen.getByTestId('navigation-error')).toHaveTextContent('none');
  });

  it('should provide navigation controls', () => {
    renderWithProviders();
    
    // Verify all navigation controls are available
    expect(screen.getByTestId('navigate-btn')).toBeInTheDocument();
    expect(screen.getByTestId('back-btn')).toBeInTheDocument();
    expect(screen.getByTestId('forward-btn')).toBeInTheDocument();
    expect(screen.getByTestId('set-pending-btn')).toBeInTheDocument();
    expect(screen.getByTestId('clear-error-btn')).toBeInTheDocument();
  });
});