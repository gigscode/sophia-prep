import React, { createContext, useContext, ReactNode } from 'react';
import { useUniversalQuizConfig } from '../hooks/useUniversalQuizConfig';
import type { UniversalQuizConfiguration, ConfigurationStep } from '../hooks/useUniversalQuizConfig';
import type { ExamTypeRecord, QuizMode } from '../types/database';
import type { UniversalQuizModeConfig } from '../components/quiz/UniversalQuizModeSelector';

/**
 * Universal Quiz Configuration Context Interface
 */
interface UniversalQuizConfigContextType {
  // Current configuration state
  config: UniversalQuizConfiguration;
  
  // Configuration setters
  setExamType: (examType: ExamTypeRecord) => void;
  setQuizMode: (mode: QuizMode, modeConfig: UniversalQuizModeConfig) => void;
  setSelectedSubjects: (subjects: string[]) => void;
  setQuestionCount: (count: number) => void;
  setExamYear: (year: number | undefined) => void;
  
  // Mode-specific behavior management
  updateBehaviorFlags: (flags: Partial<{
    allowReviewMode: boolean;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    enableBookmarking: boolean;
  }>) => void;
  getModeSpecificBehavior: () => {
    hasTimer: boolean;
    showImmediateExplanations: boolean;
    autoSubmitOnTimeout: boolean;
    allowReviewMode: boolean;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    enableBookmarking: boolean;
  };
  
  // Flow control
  markConfigurationComplete: () => void;
  resetConfiguration: () => void;
  goToPreviousStep: () => void;
  
  // Validation and utilities
  validateConfiguration: () => { isValid: boolean; errors: string[] };
  getConfigurationSummary: () => {
    examTypeName: string;
    modeName: string;
    subjectCount: number;
    questionCount: number;
    examYear?: number;
    hasTimer: boolean;
    showImmediateExplanations: boolean;
    allowReviewMode: boolean;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    enableBookmarking: boolean;
    lastModified: number;
    version: string;
  };
  
  // Computed properties
  isExamTypeSelected: boolean;
  isModeSelected: boolean;
  areSubjectsSelected: boolean;
  isConfigurationValid: boolean;
  canProceedToNextStep: boolean;
}

/**
 * Universal Quiz Configuration Context
 */
const UniversalQuizConfigContext = createContext<UniversalQuizConfigContextType | undefined>(undefined);

/**
 * Universal Quiz Configuration Provider Props
 */
interface UniversalQuizConfigProviderProps {
  children: ReactNode;
}

/**
 * Universal Quiz Configuration Provider
 * Provides quiz configuration state and methods to child components
 */
export function UniversalQuizConfigProvider({ children }: UniversalQuizConfigProviderProps) {
  const configHook = useUniversalQuizConfig();

  return (
    <UniversalQuizConfigContext.Provider value={configHook}>
      {children}
    </UniversalQuizConfigContext.Provider>
  );
}

/**
 * Hook to use Universal Quiz Configuration Context
 * Must be used within UniversalQuizConfigProvider
 */
export function useUniversalQuizConfigContext(): UniversalQuizConfigContextType {
  const context = useContext(UniversalQuizConfigContext);
  
  if (context === undefined) {
    throw new Error('useUniversalQuizConfigContext must be used within a UniversalQuizConfigProvider');
  }
  
  return context;
}

/**
 * Higher-order component to provide quiz configuration context
 */
export function withUniversalQuizConfig<P extends object>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return function WithUniversalQuizConfigComponent(props: P) {
    return (
      <UniversalQuizConfigProvider>
        <Component {...props} />
      </UniversalQuizConfigProvider>
    );
  };
}

/**
 * Configuration step utilities
 */
export const ConfigurationStepUtils = {
  /**
   * Get human-readable step name
   */
  getStepName(step: ConfigurationStep): string {
    switch (step) {
      case 'exam-type-selection':
        return 'Select Exam Type';
      case 'mode-selection':
        return 'Select Quiz Mode';
      case 'subject-selection':
        return 'Select Subjects';
      case 'configuration':
        return 'Configure Quiz';
      case 'ready':
        return 'Ready to Start';
      default:
        return 'Unknown Step';
    }
  },

  /**
   * Get step progress percentage
   */
  getStepProgress(step: ConfigurationStep): number {
    switch (step) {
      case 'exam-type-selection':
        return 20;
      case 'mode-selection':
        return 40;
      case 'subject-selection':
        return 60;
      case 'configuration':
        return 80;
      case 'ready':
        return 100;
      default:
        return 0;
    }
  },

  /**
   * Check if step is completed
   */
  isStepCompleted(currentStep: ConfigurationStep, targetStep: ConfigurationStep): boolean {
    const steps: ConfigurationStep[] = [
      'exam-type-selection',
      'mode-selection',
      'subject-selection',
      'configuration',
      'ready'
    ];
    
    const currentIndex = steps.indexOf(currentStep);
    const targetIndex = steps.indexOf(targetStep);
    
    return currentIndex > targetIndex;
  },

  /**
   * Get next step
   */
  getNextStep(currentStep: ConfigurationStep): ConfigurationStep | null {
    switch (currentStep) {
      case 'exam-type-selection':
        return 'mode-selection';
      case 'mode-selection':
        return 'subject-selection';
      case 'subject-selection':
        return 'configuration';
      case 'configuration':
        return 'ready';
      case 'ready':
        return null;
      default:
        return null;
    }
  },

  /**
   * Get previous step
   */
  getPreviousStep(currentStep: ConfigurationStep): ConfigurationStep | null {
    switch (currentStep) {
      case 'mode-selection':
        return 'exam-type-selection';
      case 'subject-selection':
        return 'mode-selection';
      case 'configuration':
        return 'subject-selection';
      case 'ready':
        return 'configuration';
      case 'exam-type-selection':
        return null;
      default:
        return null;
    }
  }
};