/**
 * NavigationErrorBoundary Tests
 * 
 * Core tests for the NavigationErrorBoundary component to ensure proper error handling
 * and integration with the navigation error service.
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NavigationErrorBoundary } from './NavigationErrorBoundary';
import { navigationErrorService } from '../../services/navigation-error-service';

// Mock the navigation error service
vi.mock('../../services/navigation-error-service', () => ({
  navigationErrorService: {
    reportError: vi.fn()
  }
}));

// Test component that throws an error
const ThrowError = ({ shouldThrow = false, errorMessage = 'Test error' }) => {
  if (shouldThrow) {
    throw new Error(errorMessage);
  }
  return <div>No error</div>;
};

// Test component that throws navigation-specific errors
const ThrowNavigationError = ({ errorType = 'navigation' }) => {
  const errorMessages = {
    navigation: 'Navigation failed',
    loop: 'Maximum update depth exceeded',
    validation: 'Invalid navigation path',
    persistence: 'Storage persistence failed',
    initialization: 'Navigation initialization failed'
  };
  
  throw new Error(errorMessages[errorType as keyof typeof errorMessages]);
};

describe('NavigationErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console methods to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders children when there is no error', () => {
    render(
      <NavigationErrorBoundary>
        <ThrowError shouldThrow={false} />
      </NavigationErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('catches and displays navigation errors', () => {
    render(
      <NavigationErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Navigation failed" />
      </NavigationErrorBoundary>
    );

    expect(screen.getByText('Navigation Error')).toBeInTheDocument();
    expect(screen.getByText(/We encountered a navigation error while navigating/)).toBeInTheDocument();
  });

  it('identifies and categorizes navigation-specific errors', () => {
    render(
      <NavigationErrorBoundary>
        <ThrowNavigationError errorType="loop" />
      </NavigationErrorBoundary>
    );

    expect(screen.getByText('Navigation Error')).toBeInTheDocument();
    expect(screen.getByText(/We encountered a loop error while navigating/)).toBeInTheDocument();
  });

  it('reports errors to the navigation error service', () => {
    const mockReportError = navigationErrorService.reportError as any;
    
    render(
      <NavigationErrorBoundary>
        <ThrowNavigationError errorType="validation" />
      </NavigationErrorBoundary>
    );

    expect(mockReportError).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'validation',
        message: 'Invalid navigation path'
      }),
      expect.objectContaining({
        componentStack: expect.any(String),
        recoveryAttempts: 0
      })
    );
  });

  it('provides retry functionality', () => {
    render(
      <NavigationErrorBoundary>
        <ThrowError shouldThrow={true} />
      </NavigationErrorBoundary>
    );

    expect(screen.getByText('Navigation Error')).toBeInTheDocument();
    
    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();
    
    // Verify retry button is clickable
    fireEvent.click(retryButton);
    // After clicking retry, the error boundary should reset its state
    // but since we're still throwing an error, it will catch it again
    expect(screen.getByText('Navigation Error')).toBeInTheDocument();
  });

  it('provides navigation options (back, home)', () => {
    // Mock window.history and window.location
    const mockBack = vi.fn();
    const mockAssign = vi.fn();
    
    Object.defineProperty(window, 'history', {
      value: { back: mockBack, length: 2 },
      writable: true
    });
    
    Object.defineProperty(window, 'location', {
      value: { href: '', assign: mockAssign },
      writable: true
    });

    render(
      <NavigationErrorBoundary>
        <ThrowError shouldThrow={true} />
      </NavigationErrorBoundary>
    );

    // Test back button
    const backButton = screen.getByText('Go Back');
    fireEvent.click(backButton);
    expect(mockBack).toHaveBeenCalled();

    // Test home button
    const homeButton = screen.getByText('Go to Home');
    fireEvent.click(homeButton);
    expect(window.location.href).toBe('/');
  });

  it('shows specialized UI for loop errors', () => {
    render(
      <NavigationErrorBoundary>
        <ThrowNavigationError errorType="loop" />
      </NavigationErrorBoundary>
    );

    expect(screen.getByText('Clear Navigation Data & Reset')).toBeInTheDocument();
    expect(screen.getByText(/infinite loop and stopped to prevent browser freezing/)).toBeInTheDocument();
  });

  it('displays error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    render(
      <NavigationErrorBoundary>
        <ThrowError shouldThrow={true} errorMessage="Test navigation error" />
      </NavigationErrorBoundary>
    );

    expect(screen.getByText('Error Details:')).toBeInTheDocument();
    expect(screen.getByText(/Test navigation error/)).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });

  it('renders custom fallback when provided', () => {
    const customFallback = <div>Custom Error UI</div>;
    
    render(
      <NavigationErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </NavigationErrorBoundary>
    );

    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    expect(screen.queryByText('Navigation Error')).not.toBeInTheDocument();
  });

  it('provides error type explanations', () => {
    render(
      <NavigationErrorBoundary>
        <ThrowNavigationError errorType="validation" />
      </NavigationErrorBoundary>
    );

    expect(screen.getByText('What happened?')).toBeInTheDocument();
    expect(screen.getByText(/navigation path was invalid/)).toBeInTheDocument();
  });
});