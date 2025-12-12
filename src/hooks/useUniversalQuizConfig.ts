import { useState, useCallback, useEffect } from 'react';
import type { ExamTypeRecord, QuizMode } from '../types/database';
import type { UniversalQuizModeConfig } from '../components/quiz/UniversalQuizModeSelector';

/**
 * Universal Quiz Configuration Interface
 * Supports both JAMB and WAEC exam types with Practice and CBT modes
 */
export interface UniversalQuizConfiguration {
  // Exam type selection
  examType: ExamTypeRecord | null;
  
  // Quiz mode selection
  mode: QuizMode | null;
  modeConfig: UniversalQuizModeConfig | null;
  
  // Subject selection (to be implemented in later tasks)
  selectedSubjects: string[];
  
  // Configuration options
  questionCount: number;
  examYear?: number; // Required for CBT mode
  
  // Mode-specific behavior flags
  hasTimer: boolean;
  showImmediateExplanations: boolean;
  autoSubmitOnTimeout: boolean;
  
  // Additional mode-specific behavior flags
  allowReviewMode: boolean; // Allow reviewing answers before submission
  shuffleQuestions: boolean; // Randomize question order
  shuffleOptions: boolean; // Randomize option order
  enableBookmarking: boolean; // Allow bookmarking questions for review
  
  // Configuration state
  isComplete: boolean;
  currentStep: ConfigurationStep;
  
  // Persistence metadata
  lastModified: number;
  version: string;
}

export type ConfigurationStep = 
  | 'exam-type-selection'
  | 'mode-selection' 
  | 'subject-selection'
  | 'configuration'
  | 'ready';

/**
 * Configuration persistence key for localStorage
 */
const STORAGE_KEY = 'universal-quiz-config';

/**
 * Migrate configuration from older versions
 */
function migrateConfiguration(oldConfig: any, targetVersion: string): UniversalQuizConfiguration {
  const migrated = { ...defaultConfig, ...oldConfig };
  
  // Add any missing fields from the new version
  if (!migrated.allowReviewMode) {
    migrated.allowReviewMode = migrated.mode === 'PRACTICE';
  }
  if (!migrated.shuffleQuestions) {
    migrated.shuffleQuestions = migrated.mode === 'CBT_EXAM';
  }
  if (!migrated.shuffleOptions) {
    migrated.shuffleOptions = migrated.mode === 'CBT_EXAM';
  }
  if (!migrated.enableBookmarking) {
    migrated.enableBookmarking = migrated.mode === 'PRACTICE';
  }
  if (!migrated.lastModified) {
    migrated.lastModified = Date.now();
  }
  
  migrated.version = targetVersion;
  
  return migrated;
}

/**
 * Default configuration state
 */
const defaultConfig: UniversalQuizConfiguration = {
  examType: null,
  mode: null,
  modeConfig: null,
  selectedSubjects: [],
  questionCount: 20,
  examYear: undefined,
  hasTimer: false,
  showImmediateExplanations: true,
  autoSubmitOnTimeout: false,
  allowReviewMode: true,
  shuffleQuestions: false,
  shuffleOptions: false,
  enableBookmarking: true,
  isComplete: false,
  currentStep: 'exam-type-selection',
  lastModified: Date.now(),
  version: '1.0.0'
};

/**
 * Universal Quiz Configuration Hook
 * Manages state for the universal quiz configuration flow
 */
export function useUniversalQuizConfig() {
  const [config, setConfig] = useState<UniversalQuizConfiguration>(defaultConfig);

  // Load configuration from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsedConfig = JSON.parse(saved);
        
        // Check version compatibility and migrate if needed
        if (parsedConfig.version !== defaultConfig.version) {
          console.info('Migrating quiz configuration from version', parsedConfig.version, 'to', defaultConfig.version);
          const migratedConfig = migrateConfiguration(parsedConfig, defaultConfig.version);
          setConfig(prev => ({ ...prev, ...migratedConfig }));
        } else {
          setConfig(prev => ({ ...prev, ...parsedConfig }));
        }
      }
    } catch (error) {
      console.warn('Failed to load quiz configuration from localStorage:', error);
      // Reset to default if parsing fails
      setConfig(defaultConfig);
    }
  }, []);

  // Save configuration to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } catch (error) {
      console.warn('Failed to save quiz configuration to localStorage:', error);
    }
  }, [config]);

  /**
   * Set the selected exam type and advance to mode selection
   */
  const setExamType = useCallback((examType: ExamTypeRecord) => {
    setConfig(prev => ({
      ...prev,
      examType,
      currentStep: 'mode-selection'
    }));
  }, []);

  /**
   * Set the selected quiz mode and configuration
   */
  const setQuizMode = useCallback((mode: QuizMode, modeConfig: UniversalQuizModeConfig) => {
    setConfig(prev => ({
      ...prev,
      mode,
      modeConfig,
      hasTimer: modeConfig.hasTimer,
      showImmediateExplanations: modeConfig.showImmediateExplanations,
      autoSubmitOnTimeout: modeConfig.autoSubmitOnTimeout,
      // Set mode-specific behavior flags
      allowReviewMode: mode === 'PRACTICE', // Practice allows review, CBT doesn't
      shuffleQuestions: mode === 'CBT_EXAM', // CBT shuffles questions for exam integrity
      shuffleOptions: mode === 'CBT_EXAM', // CBT shuffles options for exam integrity
      enableBookmarking: mode === 'PRACTICE', // Only practice mode allows bookmarking
      currentStep: 'subject-selection',
      lastModified: Date.now()
    }));
  }, []);

  /**
   * Set selected subjects (to be used in later tasks)
   */
  const setSelectedSubjects = useCallback((subjects: string[]) => {
    setConfig(prev => ({
      ...prev,
      selectedSubjects: subjects,
      currentStep: subjects.length > 0 ? 'configuration' : 'subject-selection',
      lastModified: Date.now()
    }));
  }, []);

  /**
   * Set question count with validation
   */
  const setQuestionCount = useCallback((count: number) => {
    setConfig(prev => {
      // Validate question count based on mode
      let validatedCount = count;
      if (prev.mode === 'PRACTICE') {
        validatedCount = Math.max(5, Math.min(100, count));
      } else if (prev.mode === 'CBT_EXAM') {
        validatedCount = Math.max(5, Math.min(180, count));
      }

      return {
        ...prev,
        questionCount: validatedCount,
        lastModified: Date.now()
      };
    });
  }, []);

  /**
   * Set exam year (required for CBT mode)
   */
  const setExamYear = useCallback((year: number | undefined) => {
    setConfig(prev => ({
      ...prev,
      examYear: year,
      lastModified: Date.now()
    }));
  }, []);

  /**
   * Update mode-specific behavior flags
   */
  const updateBehaviorFlags = useCallback((flags: Partial<{
    allowReviewMode: boolean;
    shuffleQuestions: boolean;
    shuffleOptions: boolean;
    enableBookmarking: boolean;
  }>) => {
    setConfig(prev => ({
      ...prev,
      ...flags,
      lastModified: Date.now()
    }));
  }, []);

  /**
   * Get mode-specific behavior configuration
   */
  const getModeSpecificBehavior = useCallback(() => {
    return {
      hasTimer: config.hasTimer,
      showImmediateExplanations: config.showImmediateExplanations,
      autoSubmitOnTimeout: config.autoSubmitOnTimeout,
      allowReviewMode: config.allowReviewMode,
      shuffleQuestions: config.shuffleQuestions,
      shuffleOptions: config.shuffleOptions,
      enableBookmarking: config.enableBookmarking
    };
  }, [config]);

  /**
   * Mark configuration as complete and ready for quiz
   */
  const markConfigurationComplete = useCallback(() => {
    setConfig(prev => ({
      ...prev,
      isComplete: true,
      currentStep: 'ready',
      lastModified: Date.now()
    }));
  }, []);

  /**
   * Reset configuration to default state
   */
  const resetConfiguration = useCallback(() => {
    const newDefaultConfig = {
      ...defaultConfig,
      lastModified: Date.now()
    };
    setConfig(newDefaultConfig);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear quiz configuration from localStorage:', error);
    }
  }, []);

  /**
   * Go back to previous step
   */
  const goToPreviousStep = useCallback(() => {
    setConfig(prev => {
      let previousStep: ConfigurationStep;
      
      switch (prev.currentStep) {
        case 'mode-selection':
          previousStep = 'exam-type-selection';
          break;
        case 'subject-selection':
          previousStep = 'mode-selection';
          break;
        case 'configuration':
          previousStep = 'subject-selection';
          break;
        case 'ready':
          previousStep = 'configuration';
          break;
        default:
          previousStep = prev.currentStep;
      }

      return {
        ...prev,
        currentStep: previousStep,
        isComplete: false,
        lastModified: Date.now()
      };
    });
  }, []);

  /**
   * Validate current configuration
   */
  const validateConfiguration = useCallback((): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!config.examType) {
      errors.push('Exam type is required');
    }

    if (!config.mode) {
      errors.push('Quiz mode is required');
    }

    if (config.selectedSubjects.length === 0) {
      errors.push('At least one subject must be selected');
    }

    // JAMB-specific validation
    if (config.examType?.slug === 'jamb') {
      if (config.selectedSubjects.length !== 4) {
        errors.push('JAMB requires exactly 4 subjects');
      }
      // Note: English requirement validation would be implemented in subject selection
    }

    // WAEC-specific validation
    if (config.examType?.slug === 'waec') {
      if (config.selectedSubjects.length < 6 || config.selectedSubjects.length > 9) {
        errors.push('WAEC requires 6-9 subjects');
      }
    }

    // CBT mode specific validation
    if (config.mode === 'CBT_EXAM' && !config.examYear) {
      errors.push('Exam year is required for CBT mode');
    }

    if (config.questionCount < 5) {
      errors.push('Minimum 5 questions required');
    }

    const maxQuestions = config.mode === 'PRACTICE' ? 100 : 180;
    if (config.questionCount > maxQuestions) {
      errors.push(`Maximum ${maxQuestions} questions allowed for ${config.mode} mode`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }, [config]);

  /**
   * Get configuration summary for display
   */
  const getConfigurationSummary = useCallback(() => {
    return {
      examTypeName: config.examType?.name || 'Not selected',
      modeName: config.mode === 'PRACTICE' ? 'Practice Mode' : 'CBT Exam Mode',
      subjectCount: config.selectedSubjects.length,
      questionCount: config.questionCount,
      examYear: config.examYear,
      hasTimer: config.hasTimer,
      showImmediateExplanations: config.showImmediateExplanations,
      allowReviewMode: config.allowReviewMode,
      shuffleQuestions: config.shuffleQuestions,
      shuffleOptions: config.shuffleOptions,
      enableBookmarking: config.enableBookmarking,
      lastModified: config.lastModified,
      version: config.version
    };
  }, [config]);

  return {
    // Current configuration state
    config,
    
    // Configuration setters
    setExamType,
    setQuizMode,
    setSelectedSubjects,
    setQuestionCount,
    setExamYear,
    
    // Mode-specific behavior management
    updateBehaviorFlags,
    getModeSpecificBehavior,
    
    // Flow control
    markConfigurationComplete,
    resetConfiguration,
    goToPreviousStep,
    
    // Validation and utilities
    validateConfiguration,
    getConfigurationSummary,
    
    // Computed properties
    isExamTypeSelected: !!config.examType,
    isModeSelected: !!config.mode,
    areSubjectsSelected: config.selectedSubjects.length > 0,
    isConfigurationValid: validateConfiguration().isValid,
    canProceedToNextStep: config.currentStep !== 'ready' && validateConfiguration().isValid
  };
}