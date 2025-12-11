/**
 * Navigation Error Boundary
 * 
 * Specialized error boundary component for navigation failures that provides
 * comprehensive error handling, automatic recovery mechanisms, and detailed
 * error logging specifically for navigation-related issues.
 * 
 * Requirements: 4.5, 5.1, 5.3, 5.4, 5.5
 */

import { Component, ErrorInfo, ReactNode } from 'react';
import { NavigationError } from '../../utils/NavigationManager';
import { navigationErrorService } from '../../services/navigation-error-service';

interface NavigationErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: NavigationError) => void;
  enableAutoRecovery?: boolean;
  maxRecoveryAttempts?: number;
  recoveryDelay?: number;
}

interface NavigationErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  navigationError: NavigationError | null;
  recoveryAttempts: number;
  isRecovering: boolean;
  lastErrorTime: number;
}

/**
 * NavigationErrorBoundary component catches navigation-specific failures
 * and provides specialized recovery mechanisms for navigation issues.
 * 
 * Features:
 * - Catches navigation-specific JavaScript errors
 * - Provides specialized fallback UI for navigation failures
 * - Implements automatic error recovery with circuit breaker pattern
 * - Logs detailed navigation error information for debugging
 * - Integrates with NavigationManager for comprehensive error handling
 * - Offers multiple recovery strategies based on error type
 */
export class NavigationErrorBoundary extends Component<NavigationErrorBoundaryProps, NavigationErrorBoundaryState> {
  private recoveryTimer: NodeJS.Timeout | null = null;
  private errorReportingEnabled: boolean;

  constructor(props: NavigationErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      navigationError: null,
      recoveryAttempts: 0,
      isRecovering: false,
      lastErrorTime: 0
    };

    this.errorReportingEnabled = typeof window !== 'undefined' && 
      (window as any).reportError !== undefined;
  }

  static getDerivedStateFromError(error: Error): Partial<NavigationErrorBoundaryState> {
    // Analyze error to determine if it's navigation-related
    const navigationError = NavigationErrorBoundary.analyzeNavigationError(error);
    
    return {
      hasError: true,
      error,
      navigationError,
      lastErrorTime: Date.now()
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Enhanced error logging for navigation failures
    this.logNavigationError(error, errorInfo);
    
    // Update state with error info
    this.setState({
      errorInfo
    });

    // Report to navigation error service
    if (this.state.navigationError) {
      navigationErrorService.reportError(this.state.navigationError, {
        componentStack: errorInfo.componentStack || '',
        recoveryAttempts: this.state.recoveryAttempts
      });
    }

    // Report error to external monitoring if available
    this.reportNavigationError(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError && this.state.navigationError) {
      this.props.onError(this.state.navigationError);
    }

    // Attempt automatic recovery if enabled
    if (this.props.enableAutoRecovery && this.shouldAttemptRecovery()) {
      this.attemptAutomaticRecovery();
    }
  }

  componentWillUnmount() {
    if (this.recoveryTimer) {
      clearTimeout(this.recoveryTimer);
    }
  }

  /**
   * Analyze error to determine if it's navigation-related and classify it
   */
  private static analyzeNavigationError(error: Error): NavigationError | null {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';

    // Check for navigation-specific error patterns
    if (message.includes('navigation') || 
        message.includes('router') || 
        message.includes('history') ||
        message.includes('location') ||
        message.includes('redirect') ||
        message.includes('maximum update depth') ||
        stack.includes('navigationmanager') ||
        stack.includes('unifiednavigationprovider')) {
      
      let errorType: NavigationError['type'] = 'navigation';
      
      // Classify specific navigation error types
      if (message.includes('invalid') || message.includes('validation')) {
        errorType = 'validation';
      } else if (message.includes('loop') || message.includes('maximum update depth')) {
        errorType = 'loop';
      } else if (message.includes('persistence') || message.includes('storage')) {
        errorType = 'persistence';
      } else if (message.includes('initialization') || message.includes('init')) {
        errorType = 'initialization';
      }

      return {
        type: errorType,
        message: error.message,
        timestamp: Date.now(),
        stack: error.stack
      };
    }

    return null;
  }

  /**
   * Enhanced logging for navigation errors with detailed context
   */
  private logNavigationError(error: Error, errorInfo: ErrorInfo): void {
    const logData = {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      errorInfo: {
        componentStack: errorInfo.componentStack || ''
      },
      navigationContext: {
        currentUrl: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        recoveryAttempts: this.state.recoveryAttempts
      },
      navigationError: this.state.navigationError
    };

    // Log to console with detailed information
    console.error('[NavigationErrorBoundary] Navigation error caught:', logData);

    // Store error in session storage for debugging
    try {
      const errorHistory = JSON.parse(sessionStorage.getItem('nav_error_history') || '[]');
      errorHistory.push(logData);
      
      // Keep only last 10 errors to prevent storage bloat
      if (errorHistory.length > 10) {
        errorHistory.splice(0, errorHistory.length - 10);
      }
      
      sessionStorage.setItem('nav_error_history', JSON.stringify(errorHistory));
    } catch (storageError) {
      console.warn('Failed to store navigation error history:', storageError);
    }
  }

  /**
   * Report navigation error to external monitoring service
   */
  private reportNavigationError(error: Error, errorInfo: ErrorInfo): void {
    if (!this.errorReportingEnabled) return;

    try {
      const errorReport = {
        type: 'navigation_error',
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack
        },
        context: {
          url: window.location.href,
          userAgent: navigator.userAgent,
          componentStack: errorInfo.componentStack || '',
          navigationError: this.state.navigationError,
          recoveryAttempts: this.state.recoveryAttempts
        },
        timestamp: Date.now()
      };

      (window as any).reportError(errorReport);
    } catch (reportingError) {
      console.warn('Failed to report navigation error:', reportingError);
    }
  }

  /**
   * Determine if automatic recovery should be attempted
   */
  private shouldAttemptRecovery(): boolean {
    const maxAttempts = this.props.maxRecoveryAttempts || 3;
    const timeSinceLastError = Date.now() - this.state.lastErrorTime;
    const minTimeBetweenAttempts = 5000; // 5 seconds

    return (
      this.state.recoveryAttempts < maxAttempts &&
      timeSinceLastError > minTimeBetweenAttempts &&
      !this.state.isRecovering
    );
  }

  /**
   * Attempt automatic recovery based on error type
   */
  private attemptAutomaticRecovery(): void {
    const recoveryDelay = this.props.recoveryDelay || 2000;
    
    this.setState({ isRecovering: true });

    this.recoveryTimer = setTimeout(() => {
      try {
        // Increment recovery attempts
        this.setState(prevState => ({
          recoveryAttempts: prevState.recoveryAttempts + 1,
          isRecovering: false
        }));

        // Attempt recovery based on error type
        if (this.state.navigationError) {
          this.performRecoveryByErrorType(this.state.navigationError.type);
        } else {
          // Generic recovery - reset error state
          this.handleRetry();
        }

      } catch (recoveryError) {
        console.error('Automatic recovery failed:', recoveryError);
        this.setState({ isRecovering: false });
      }
    }, recoveryDelay);
  }

  /**
   * Perform specific recovery actions based on error type
   */
  private performRecoveryByErrorType(errorType: NavigationError['type']): void {
    switch (errorType) {
      case 'loop':
        // For loop errors, clear navigation state and reset
        this.clearNavigationStateAndReset();
        break;
      
      case 'persistence':
        // For persistence errors, clear storage and retry
        this.clearNavigationStorageAndRetry();
        break;
      
      case 'validation':
        // For validation errors, navigate to safe route
        this.navigateToSafeRoute();
        break;
      
      case 'initialization':
        // For initialization errors, reload the page
        this.reloadPage();
        break;
      
      default:
        // Generic recovery
        this.handleRetry();
        break;
    }
  }

  /**
   * Clear navigation state and reset error boundary
   */
  private clearNavigationStateAndReset(): void {
    try {
      // Clear navigation-related session storage
      const keysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key && key.startsWith('nav_')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => sessionStorage.removeItem(key));

      // Reset error state
      this.handleRetry();
    } catch (error) {
      console.error('Failed to clear navigation state:', error);
      this.navigateToSafeRoute();
    }
  }

  /**
   * Clear navigation storage and retry
   */
  private clearNavigationStorageAndRetry(): void {
    try {
      // Clear specific navigation storage items
      sessionStorage.removeItem('nav_unified_currentState');
      sessionStorage.removeItem('nav_unified_preservedParams');
      sessionStorage.removeItem('nav_unified_routeParams');
      sessionStorage.removeItem('nav_unified_pendingRedirect');

      // Reset error state
      this.handleRetry();
    } catch (error) {
      console.error('Failed to clear navigation storage:', error);
      this.navigateToSafeRoute();
    }
  }

  /**
   * Navigate to a safe route (home page)
   */
  private navigateToSafeRoute(): void {
    try {
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to navigate to safe route:', error);
      this.reloadPage();
    }
  }

  /**
   * Reload the page as last resort
   */
  private reloadPage(): void {
    try {
      window.location.reload();
    } catch (error) {
      console.error('Failed to reload page:', error);
    }
  }

  /**
   * Manual retry handler
   */
  private handleRetry = (): void => {
    // Reset error state to retry rendering
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      navigationError: null,
      isRecovering: false
    });
  };

  /**
   * Navigate to home page
   */
  private handleGoHome = (): void => {
    try {
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to navigate home:', error);
      window.location.reload();
    }
  };

  /**
   * Go back in browser history
   */
  private handleGoBack = (): void => {
    try {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        this.handleGoHome();
      }
    } catch (error) {
      console.error('Failed to go back:', error);
      this.handleGoHome();
    }
  };

  /**
   * Clear all navigation data and reset
   */
  private handleClearAndReset = (): void => {
    this.clearNavigationStateAndReset();
  };

  /**
   * Get error details for debugging
   */
  private getErrorDetails(): string {
    if (!this.state.error) return 'Unknown error';
    
    const details = [
      `Error: ${this.state.error.message}`,
      `Type: ${this.state.navigationError?.type || 'unknown'}`,
      `Recovery Attempts: ${this.state.recoveryAttempts}`,
      `URL: ${window.location.href}`
    ];

    return details.join('\n');
  }

  render() {
    if (this.state.hasError) {
      // Check if a custom fallback is provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Show recovery UI if currently recovering
      if (this.state.isRecovering) {
        return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
            <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Recovering...</h1>
              <p className="text-gray-600">
                We're attempting to recover from a navigation error. Please wait a moment.
              </p>
            </div>
          </div>
        );
      }

      // Navigation-specific error UI
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
          <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Navigation Error</h1>
            
            <p className="text-gray-600 mb-4">
              {this.state.navigationError ? 
                `We encountered a ${this.state.navigationError.type} error while navigating.` :
                'We encountered an error while navigating between pages.'
              }
            </p>

            {this.state.recoveryAttempts > 0 && (
              <p className="text-sm text-orange-600 mb-4">
                Recovery attempts: {this.state.recoveryAttempts}/{this.props.maxRecoveryAttempts || 3}
              </p>
            )}
            
            {/* Show error details in development */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-gray-100 rounded text-left text-sm">
                <p className="font-semibold text-red-600 mb-2">Error Details:</p>
                <pre className="text-gray-800 font-mono text-xs whitespace-pre-wrap break-all">
                  {this.getErrorDetails()}
                </pre>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-gray-600">Component Stack</summary>
                    <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                disabled={this.state.isRecovering}
              >
                Try Again
              </button>
              
              {this.state.navigationError?.type === 'loop' && (
                <button
                  onClick={this.handleClearAndReset}
                  className="w-full py-2 px-4 bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors"
                  disabled={this.state.isRecovering}
                >
                  Clear Navigation Data & Reset
                </button>
              )}
              
              <button
                onClick={this.handleGoBack}
                className="w-full py-2 px-4 bg-gray-900 text-white rounded hover:bg-gray-800 transition-colors"
                disabled={this.state.isRecovering}
              >
                Go Back
              </button>
              
              <button
                onClick={this.handleGoHome}
                className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                disabled={this.state.isRecovering}
              >
                Go to Home
              </button>
            </div>

            {/* Additional help text for specific error types */}
            {this.state.navigationError && (
              <div className="mt-6 p-4 bg-blue-50 rounded text-sm text-left">
                <p className="font-semibold text-blue-800 mb-2">What happened?</p>
                <p className="text-blue-700">
                  {this.getErrorTypeExplanation(this.state.navigationError.type)}
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }

  /**
   * Get user-friendly explanation for different error types
   */
  private getErrorTypeExplanation(errorType: NavigationError['type']): string {
    switch (errorType) {
      case 'loop':
        return 'The navigation system detected an infinite loop and stopped to prevent browser freezing. This usually happens when pages redirect to each other repeatedly.';
      
      case 'validation':
        return 'The navigation path was invalid or contained incorrect parameters. This might be due to a malformed URL or missing required information.';
      
      case 'persistence':
        return 'There was an issue saving or loading navigation data. This might be due to browser storage limitations or corrupted data.';
      
      case 'initialization':
        return 'The navigation system failed to initialize properly. This might be due to a temporary issue or conflicting browser extensions.';
      
      case 'navigation':
        return 'A general navigation error occurred. This might be due to network issues, browser compatibility, or temporary system problems.';
      
      default:
        return 'An unexpected error occurred during navigation. The system is designed to recover automatically, but manual intervention may be needed.';
    }
  }
}

/**
 * Higher-order component to wrap components with navigation error boundary
 */
export function withNavigationErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    fallback?: ReactNode;
    onError?: (error: NavigationError) => void;
    enableAutoRecovery?: boolean;
    maxRecoveryAttempts?: number;
    recoveryDelay?: number;
  }
) {
  return function WrappedComponent(props: P) {
    return (
      <NavigationErrorBoundary {...options}>
        <Component {...props} />
      </NavigationErrorBoundary>
    );
  };
}

export type { NavigationErrorBoundaryProps, NavigationErrorBoundaryState };