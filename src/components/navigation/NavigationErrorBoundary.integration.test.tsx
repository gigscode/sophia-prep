/**
 * NavigationErrorBoundary Integration Tests
 * 
 * Integration tests to verify NavigationErrorBoundary works correctly
 * with the actual navigation system and error scenarios.
 */

import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { NavigationErrorBoundary } from './NavigationErrorBoundary';
import { UnifiedNavigationProvider } from './UnifiedNavigationProvider';

// Mock console to avoid noise in tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

// Component that simulates navigation errors
const NavigationErrorSimulator = ({ errorType }: { errorType: string }) => {
  // Simulate different types of navigation errors
  switch (errorType) {
    case 'loop':
      throw new Error('Maximum update depth exceeded. This is likely caused by a component repeatedly calling setState inside componentWillUpdate or componentDidUpdate.');
    case 'navigation':
      throw new Error('Navigation failed: Invalid route');
    case 'validation':
      throw new Error('Invalid navigation path: /invalid/route');
    default:
      return <div>Navigation working</div>;
  }
};

describe('NavigationErrorBoundary Integration', () => {
  it('integrates with UnifiedNavigationProvider to catch navigation errors', () => {
    render(
      <BrowserRouter>
        <NavigationErrorBoundary>
          <UnifiedNavigationProvider>
            <NavigationErrorSimulator errorType="navigation" />
          </UnifiedNavigationProvider>
        </NavigationErrorBoundary>
      </BrowserRouter>
    );

    expect(screen.getByText('Navigation Error')).toBeInTheDocument();
    expect(screen.getByText(/We encountered a validation error while navigating/)).toBeInTheDocument();
  });

  it('catches loop errors in navigation context', () => {
    render(
      <BrowserRouter>
        <NavigationErrorBoundary>
          <UnifiedNavigationProvider>
            <NavigationErrorSimulator errorType="loop" />
          </UnifiedNavigationProvider>
        </NavigationErrorBoundary>
      </BrowserRouter>
    );

    expect(screen.getByText('Navigation Error')).toBeInTheDocument();
    expect(screen.getByText(/We encountered a loop error while navigating/)).toBeInTheDocument();
    expect(screen.getByText('Clear Navigation Data & Reset')).toBeInTheDocument();
  });

  it('catches validation errors in navigation context', () => {
    render(
      <BrowserRouter>
        <NavigationErrorBoundary>
          <UnifiedNavigationProvider>
            <NavigationErrorSimulator errorType="validation" />
          </UnifiedNavigationProvider>
        </NavigationErrorBoundary>
      </BrowserRouter>
    );

    expect(screen.getByText('Navigation Error')).toBeInTheDocument();
    expect(screen.getByText(/We encountered a validation error while navigating/)).toBeInTheDocument();
  });

  it('allows normal navigation when no errors occur', () => {
    render(
      <BrowserRouter>
        <NavigationErrorBoundary>
          <UnifiedNavigationProvider>
            <NavigationErrorSimulator errorType="none" />
          </UnifiedNavigationProvider>
        </NavigationErrorBoundary>
      </BrowserRouter>
    );

    expect(screen.getByText('Navigation working')).toBeInTheDocument();
    expect(screen.queryByText('Navigation Error')).not.toBeInTheDocument();
  });

  it('provides comprehensive error boundary coverage for the entire navigation system', () => {
    // Test that the error boundary wraps the entire navigation provider
    render(
      <BrowserRouter>
        <NavigationErrorBoundary
          onError={(error) => {
            expect(error.type).toBe('validation');
          }}
        >
          <UnifiedNavigationProvider>
            <div>
              <NavigationErrorSimulator errorType="navigation" />
            </div>
          </UnifiedNavigationProvider>
        </NavigationErrorBoundary>
      </BrowserRouter>
    );

    expect(screen.getByText('Navigation Error')).toBeInTheDocument();
  });
});