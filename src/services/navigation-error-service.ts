/**
 * Navigation Error Service
 * 
 * Centralized service for handling, logging, and reporting navigation errors
 * with detailed error analysis and recovery recommendations.
 * 
 * Requirements: 5.1, 5.3, 5.4, 5.5
 */

import { NavigationError } from '../utils/NavigationManager';

export interface ErrorReport {
  id: string;
  timestamp: number;
  error: NavigationError;
  context: {
    url: string;
    userAgent: string;
    sessionId: string;
    userId?: string;
    componentStack?: string;
    previousErrors: number;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  recoveryAttempts: number;
  resolved: boolean;
}

export interface ErrorAnalysis {
  errorPattern: 'isolated' | 'recurring' | 'cascading' | 'systematic';
  likelyRoot: string;
  recommendedAction: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  affectedFeatures: string[];
}

/**
 * Navigation Error Service Class
 * 
 * Provides comprehensive error handling, logging, and analysis for navigation failures
 */
export class NavigationErrorService {
  private errorHistory: ErrorReport[] = [];
  private sessionId: string;
  private maxHistorySize: number = 50;
  private errorPatterns: Map<string, number> = new Map();
  
  constructor() {
    this.sessionId = this.generateSessionId();
    this.loadErrorHistory();
  }

  /**
   * Report a navigation error with detailed context
   */
  reportError(
    error: NavigationError,
    context: {
      componentStack?: string;
      userId?: string;
      recoveryAttempts?: number;
    } = {}
  ): ErrorReport {
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      error,
      context: {
        url: window.location.href,
        userAgent: navigator.userAgent,
        sessionId: this.sessionId,
        userId: context.userId,
        componentStack: context.componentStack,
        previousErrors: this.errorHistory.length
      },
      severity: this.calculateSeverity(error),
      recoveryAttempts: context.recoveryAttempts || 0,
      resolved: false
    };

    // Add to history
    this.errorHistory.push(errorReport);
    this.trimErrorHistory();

    // Update error patterns
    this.updateErrorPatterns(error);

    // Log error with detailed information
    this.logError(errorReport);

    // Store in session storage for persistence
    this.saveErrorHistory();

    // Report to external monitoring if available
    this.reportToExternalService(errorReport);

    return errorReport;
  }

  /**
   * Mark an error as resolved
   */
  markErrorResolved(errorId: string): boolean {
    const errorReport = this.errorHistory.find(report => report.id === errorId);
    if (errorReport) {
      errorReport.resolved = true;
      this.saveErrorHistory();
      return true;
    }
    return false;
  }

  /**
   * Get error analysis and recommendations
   */
  analyzeErrors(timeWindow: number = 300000): ErrorAnalysis {
    const recentErrors = this.getRecentErrors(timeWindow);
    
    if (recentErrors.length === 0) {
      return {
        errorPattern: 'isolated',
        likelyRoot: 'No recent errors detected',
        recommendedAction: 'Continue normal operation',
        urgency: 'low',
        affectedFeatures: []
      };
    }

    const errorTypes = recentErrors.map(e => e.error.type);
    const errorMessages = recentErrors.map(e => e.error.message);
    const errorPaths = recentErrors.map(e => e.error.path).filter((path): path is string => Boolean(path));

    // Analyze error patterns
    const pattern = this.determineErrorPattern(recentErrors);
    const likelyRoot = this.identifyLikelyRoot(errorTypes, errorMessages, errorPaths);
    const recommendedAction = this.getRecommendedAction(pattern, errorTypes);
    const urgency = this.calculateUrgency(recentErrors, pattern);
    const affectedFeatures = this.identifyAffectedFeatures(errorPaths);

    return {
      errorPattern: pattern,
      likelyRoot,
      recommendedAction,
      urgency,
      affectedFeatures
    };
  }

  /**
   * Get recent error reports
   */
  getRecentErrors(timeWindow: number = 300000): ErrorReport[] {
    const cutoff = Date.now() - timeWindow;
    return this.errorHistory.filter(report => report.timestamp > cutoff);
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    totalErrors: number;
    errorsByType: Record<string, number>;
    errorsByPath: Record<string, number>;
    averageRecoveryAttempts: number;
    resolutionRate: number;
    recentErrorRate: number;
  } {
    const errorsByType: Record<string, number> = {};
    const errorsByPath: Record<string, number> = {};
    let totalRecoveryAttempts = 0;
    let resolvedErrors = 0;

    this.errorHistory.forEach(report => {
      // Count by type
      errorsByType[report.error.type] = (errorsByType[report.error.type] || 0) + 1;
      
      // Count by path
      if (report.error.path) {
        errorsByPath[report.error.path] = (errorsByPath[report.error.path] || 0) + 1;
      }
      
      // Sum recovery attempts
      totalRecoveryAttempts += report.recoveryAttempts;
      
      // Count resolved errors
      if (report.resolved) {
        resolvedErrors++;
      }
    });

    const recentErrors = this.getRecentErrors(300000); // Last 5 minutes
    const recentErrorRate = recentErrors.length / 5; // Errors per minute

    return {
      totalErrors: this.errorHistory.length,
      errorsByType,
      errorsByPath,
      averageRecoveryAttempts: this.errorHistory.length > 0 ? 
        totalRecoveryAttempts / this.errorHistory.length : 0,
      resolutionRate: this.errorHistory.length > 0 ? 
        resolvedErrors / this.errorHistory.length : 0,
      recentErrorRate
    };
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
    this.errorPatterns.clear();
    this.saveErrorHistory();
  }

  /**
   * Export error data for debugging
   */
  exportErrorData(): {
    errors: ErrorReport[];
    patterns: Record<string, number>;
    analysis: ErrorAnalysis;
    statistics: ReturnType<NavigationErrorService['getErrorStatistics']>;
  } {
    return {
      errors: [...this.errorHistory],
      patterns: Object.fromEntries(this.errorPatterns),
      analysis: this.analyzeErrors(),
      statistics: this.getErrorStatistics()
    };
  }

  // Private helper methods

  private generateSessionId(): string {
    return `nav_session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateErrorId(): string {
    return `nav_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateSeverity(error: NavigationError): ErrorReport['severity'] {
    switch (error.type) {
      case 'loop':
        return 'critical';
      case 'initialization':
        return 'high';
      case 'navigation':
        return 'medium';
      case 'validation':
        return 'low';
      case 'persistence':
        return 'low';
      default:
        return 'medium';
    }
  }

  private updateErrorPatterns(error: NavigationError): void {
    const patternKey = `${error.type}:${error.message.substring(0, 50)}`;
    this.errorPatterns.set(patternKey, (this.errorPatterns.get(patternKey) || 0) + 1);
  }

  private determineErrorPattern(errors: ErrorReport[]): ErrorAnalysis['errorPattern'] {
    if (errors.length === 1) return 'isolated';
    
    const errorTypes = errors.map(e => e.error.type);
    const uniqueTypes = new Set(errorTypes);
    
    // Check for cascading errors (different types in sequence)
    if (uniqueTypes.size > 1 && errors.length > 2) {
      return 'cascading';
    }
    
    // Check for recurring errors (same type repeated)
    if (uniqueTypes.size === 1 && errors.length > 2) {
      return 'recurring';
    }
    
    // Check for systematic errors (multiple types, high frequency)
    if (uniqueTypes.size > 2) {
      return 'systematic';
    }
    
    return 'isolated';
  }

  private identifyLikelyRoot(
    errorTypes: string[], 
    errorMessages: string[], 
    errorPaths: string[]
  ): string {
    // Analyze most common error type
    const typeCounts = errorTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostCommonType = Object.entries(typeCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    // Analyze common error messages
    const commonWords = this.extractCommonWords(errorMessages);
    
    // Analyze problematic paths
    const pathCounts = errorPaths.reduce((acc, path) => {
      acc[path] = (acc[path] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const mostProblematicPath = Object.entries(pathCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    // Generate root cause hypothesis
    if (mostCommonType === 'loop') {
      return `Infinite loop detected, likely caused by circular navigation between routes${mostProblematicPath ? ` (especially ${mostProblematicPath})` : ''}`;
    } else if (mostCommonType === 'validation') {
      return `Invalid navigation paths or parameters${mostProblematicPath ? ` (problematic path: ${mostProblematicPath})` : ''}`;
    } else if (mostCommonType === 'persistence') {
      return 'Browser storage issues or corrupted navigation state';
    } else if (commonWords.length > 0) {
      return `Navigation system issues related to: ${commonWords.slice(0, 3).join(', ')}`;
    }

    return 'Multiple navigation system failures - requires detailed investigation';
  }

  private getRecommendedAction(
    pattern: ErrorAnalysis['errorPattern'], 
    errorTypes: string[]
  ): string {
    const hasLoopErrors = errorTypes.includes('loop');
    const hasValidationErrors = errorTypes.includes('validation');
    const hasPersistenceErrors = errorTypes.includes('persistence');

    if (hasLoopErrors) {
      return 'Immediate action required: Clear navigation state, reset circuit breaker, and investigate circular dependencies';
    } else if (pattern === 'recurring') {
      return 'Investigate recurring error pattern, check for systematic issues in navigation logic';
    } else if (pattern === 'cascading') {
      return 'Address root cause to prevent error cascade, review error handling chain';
    } else if (hasValidationErrors) {
      return 'Review and fix navigation path validation, check URL parameter handling';
    } else if (hasPersistenceErrors) {
      return 'Clear browser storage, check storage quota and permissions';
    }

    return 'Monitor error patterns, consider implementing additional error boundaries';
  }

  private calculateUrgency(
    errors: ErrorReport[], 
    pattern: ErrorAnalysis['errorPattern']
  ): ErrorAnalysis['urgency'] {
    const criticalErrors = errors.filter(e => e.severity === 'critical').length;
    const highErrors = errors.filter(e => e.severity === 'high').length;
    
    if (criticalErrors > 0 || pattern === 'systematic') {
      return 'critical';
    } else if (highErrors > 1 || pattern === 'cascading') {
      return 'high';
    } else if (errors.length > 3 || pattern === 'recurring') {
      return 'medium';
    }
    
    return 'low';
  }

  private identifyAffectedFeatures(errorPaths: string[]): string[] {
    const features = new Set<string>();
    
    errorPaths.forEach(path => {
      if (path.includes('/quiz')) features.add('Quiz System');
      if (path.includes('/admin')) features.add('Admin Panel');
      if (path.includes('/profile')) features.add('User Profile');
      if (path.includes('/subjects')) features.add('Subject Navigation');
      if (path.includes('/login') || path.includes('/signup')) features.add('Authentication');
      if (path === '/') features.add('Home Page');
    });
    
    return Array.from(features);
  }

  private extractCommonWords(messages: string[]): string[] {
    const wordCounts: Record<string, number> = {};
    
    messages.forEach(message => {
      const words = message.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3 && !['error', 'failed', 'navigation'].includes(word));
      
      words.forEach(word => {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      });
    });
    
    return Object.entries(wordCounts)
      .filter(([, count]) => count > 1)
      .sort(([, a], [, b]) => b - a)
      .map(([word]) => word);
  }

  private logError(errorReport: ErrorReport): void {
    const logLevel = errorReport.severity === 'critical' ? 'error' : 
                   errorReport.severity === 'high' ? 'warn' : 'info';
    
    console[logLevel]('[NavigationErrorService] Error reported:', {
      id: errorReport.id,
      type: errorReport.error.type,
      message: errorReport.error.message,
      severity: errorReport.severity,
      url: errorReport.context.url,
      timestamp: new Date(errorReport.timestamp).toISOString()
    });
  }

  private trimErrorHistory(): void {
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(-this.maxHistorySize);
    }
  }

  private saveErrorHistory(): void {
    try {
      const dataToSave = {
        errors: this.errorHistory,
        patterns: Object.fromEntries(this.errorPatterns),
        sessionId: this.sessionId,
        timestamp: Date.now()
      };
      
      sessionStorage.setItem('nav_error_service_data', JSON.stringify(dataToSave));
    } catch (error) {
      console.warn('Failed to save error history:', error);
    }
  }

  private loadErrorHistory(): void {
    try {
      const saved = sessionStorage.getItem('nav_error_service_data');
      if (saved) {
        const data = JSON.parse(saved);
        
        // Only load if from same session or recent
        if (data.sessionId === this.sessionId || 
            (Date.now() - data.timestamp < 3600000)) { // 1 hour
          this.errorHistory = data.errors || [];
          this.errorPatterns = new Map(Object.entries(data.patterns || {}));
        }
      }
    } catch (error) {
      console.warn('Failed to load error history:', error);
    }
  }

  private reportToExternalService(errorReport: ErrorReport): void {
    // Report to external monitoring service if available
    if (typeof window !== 'undefined' && (window as any).reportError) {
      try {
        (window as any).reportError({
          type: 'navigation_error',
          report: errorReport,
          timestamp: Date.now()
        });
      } catch (error) {
        console.warn('Failed to report to external service:', error);
      }
    }
  }
}

// Singleton instance
export const navigationErrorService = new NavigationErrorService();

// Export types
export type { NavigationError };