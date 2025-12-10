/**
 * Unified Quiz Configuration Types
 * 
 * This module defines the core types and interfaces for the exam modes system,
 * supporting both WAEC and JAMB examinations with practice and simulation modes.
 * 
 * Requirements: 1.1, 2.1, 2.2, 2.3
 */

import type { TimerHandle } from '../services/timer-service';

/**
 * Exam type enumeration
 */
export type ExamType = 'JAMB' | 'WAEC';

/**
 * Quiz mode enumeration
 * - practice: Untimed quiz with immediate feedback and explanations
 * - exam: Timed quiz simulating real exam conditions with delayed feedback
 */
export type QuizMode = 'practice' | 'exam';

/**
 * Selection method for quiz questions
 * - subject: Filter questions by subject
 * - year: Filter questions by specific exam year
 * - category: Filter questions by class category (Science/Arts/Commercial)
 */
export type SelectionMethod = 'subject' | 'year' | 'category';

/**
 * Class category for JAMB/WAEC exams
 */
export type ClassCategory = 'SCIENCE' | 'ARTS' | 'COMMERCIAL';

/**
 * Quiz configuration interface
 * Defines all parameters needed to configure a quiz session
 */
export interface QuizConfig {
  /** Exam type (WAEC or JAMB) */
  examType: ExamType;

  /** Quiz mode (practice or exam simulation) */
  mode: QuizMode;

  /** Method for selecting questions (by subject or year) */
  selectionMethod: SelectionMethod;

  /** Subject slug for subject-based quizzes (optional) */
  subjectSlug?: string;

  /** Exam year for year-based quizzes (optional) */
  year?: number;

  /** Class category for category-based quizzes (optional) */
  classCategory?: ClassCategory;

  /** Array of subject slugs for multi-subject quizzes (optional) */
  subjectSlugs?: string[];
}

/**
 * Quiz question interface
 * Normalized format for displaying questions in the quiz interface
 */
export interface QuizQuestion {
  /** Unique question identifier */
  id: string;

  /** Question text */
  text: string;

  /** Answer options */
  options: QuizOption[];

  /** Correct answer key (A, B, C, or D) */
  correct?: string;

  /** Explanation text (shown in practice mode or after completion) */
  explanation?: string;

  /** Exam year this question is from (optional) */
  examYear?: number;

  /** Exam type this question is for (optional) */
  examType?: ExamType;

  /** Subject slug this question belongs to (optional, for multi-subject quizzes) */
  subjectSlug?: string;

  /** Subject name this question belongs to (optional, for multi-subject quizzes) */
  subjectName?: string;
}

/**
 * Quiz option interface
 * Represents a single answer option
 */
export interface QuizOption {
  /** Option key (A, B, C, or D) */
  key: string;
  
  /** Option text */
  text: string;
}

/**
 * Quiz state interface
 * Tracks the current state of an active quiz session
 */
export interface QuizState {
  /** Array of questions in the quiz */
  questions: QuizQuestion[];
  
  /** Current question index (0-based) */
  currentIndex: number;
  
  /** User's answers mapped by question ID */
  answers: Record<string, string>;
  
  /** Time remaining in seconds (null for practice mode) */
  timeRemaining: number | null;
  
  /** Whether explanations should be shown */
  showExplanations: boolean;
  
  /** Whether the quiz has been completed */
  completed: boolean;
  
  /** Timer handle for exam mode (null for practice mode) */
  timerHandle: TimerHandle | null;
  
  /** Quiz start timestamp */
  startTime: number;
  
  /** Quiz configuration */
  config: QuizConfig;
}

/**
 * Quiz attempt data for analytics
 * Data structure for saving quiz attempts to the database
 */
export interface QuizAttemptData {
  /** Subject ID (optional) */
  subject_id?: string;
  
  /** Quiz mode identifier */
  quiz_mode: string;
  
  /** Total number of questions */
  total_questions: number;
  
  /** Number of correct answers */
  correct_answers: number;
  
  /** Time taken in seconds */
  time_taken_seconds: number;
  
  /** Exam type (optional) */
  exam_type?: ExamType;
  
  /** Exam year (optional) */
  exam_year?: number;
  
  /** Individual question responses */
  questions_data: QuestionAttemptData[];
}

/**
 * Individual question attempt data
 */
export interface QuestionAttemptData {
  /** Question ID */
  question_id: string;
  
  /** User's answer */
  user_answer?: string;
  
  /** Correct answer */
  correct_answer?: string;
  
  /** Whether the answer was correct */
  is_correct: boolean;
  
  /** Time spent on this question in seconds (optional) */
  time_spent_seconds?: number;
}

/**
 * Mode-specific configuration helpers
 */
export const QuizConfigHelpers = {
  /**
   * Check if a quiz configuration is for practice mode
   */
  isPracticeMode(config: QuizConfig): boolean {
    return config.mode === 'practice';
  },

  /**
   * Check if a quiz configuration is for exam simulation mode
   */
  isExamMode(config: QuizConfig): boolean {
    return config.mode === 'exam';
  },

  /**
   * Check if a quiz uses subject-based selection
   */
  isSubjectBased(config: QuizConfig): boolean {
    return config.selectionMethod === 'subject';
  },

  /**
   * Check if a quiz uses year-based selection
   */
  isYearBased(config: QuizConfig): boolean {
    return config.selectionMethod === 'year';
  },

  /**
   * Get a human-readable label for the quiz mode
   */
  getModeLabel(mode: QuizMode): string {
    return mode === 'practice' ? 'Practice' : 'Exam Simulation';
  },

  /**
   * Get a human-readable label for the exam type
   */
  getExamTypeLabel(examType: ExamType): string {
    return examType;
  },

  /**
   * Generate a quiz mode identifier for analytics
   * Format: {mode}-{selectionMethod}
   * Examples: "practice-subject", "exam-year"
   */
  getQuizModeIdentifier(config: QuizConfig): string {
    return `${config.mode}-${config.selectionMethod}`;
  },

  /**
   * Create a default quiz state from a configuration
   */
  createInitialState(config: QuizConfig): Omit<QuizState, 'questions'> {
    return {
      currentIndex: 0,
      answers: {},
      timeRemaining: config.mode === 'exam' ? 0 : null, // Will be set by timer service
      showExplanations: config.mode === 'practice',
      completed: false,
      timerHandle: null,
      startTime: Date.now(),
      config,
    };
  },

  /**
   * Validate a quiz configuration
   * Returns an error message if invalid, null if valid
   */
  validateConfig(config: QuizConfig): string | null {
    // Check exam type
    if (!['JAMB', 'WAEC'].includes(config.examType)) {
      return 'Invalid exam type. Must be JAMB or WAEC.';
    }

    // Check mode
    if (!['practice', 'exam'].includes(config.mode)) {
      return 'Invalid mode. Must be practice or exam.';
    }

    // Check selection method
    if (!['subject', 'year', 'category'].includes(config.selectionMethod)) {
      return 'Invalid selection method. Must be subject, year, or category.';
    }

    // Check subject-based configuration
    if (config.selectionMethod === 'subject' && !config.subjectSlug) {
      return 'Subject slug is required for subject-based quizzes.';
    }

    // Check year-based configuration
    if (config.selectionMethod === 'year' && !config.year) {
      return 'Year is required for year-based quizzes.';
    }

    // Check category-based configuration
    if (config.selectionMethod === 'category') {
      if (!config.classCategory) {
        return 'Class category is required for category-based quizzes.';
      }
      if (!['SCIENCE', 'ARTS', 'COMMERCIAL'].includes(config.classCategory)) {
        return 'Invalid class category. Must be SCIENCE, ARTS, or COMMERCIAL.';
      }
      if (!config.subjectSlugs || config.subjectSlugs.length === 0) {
        return 'Subject slugs are required for category-based quizzes.';
      }
    }

    // Validate year range if provided
    if (config.year) {
      const currentYear = new Date().getFullYear();
      if (config.year < 2000 || config.year > currentYear) {
        return `Invalid year. Must be between 2000 and ${currentYear}.`;
      }
    }

    return null;
  },

  /**
   * Create a practice mode configuration
   */
  createPracticeConfig(
    examType: ExamType,
    selectionMethod: SelectionMethod,
    options: { subjectSlug?: string; year?: number }
  ): QuizConfig {
    return {
      examType,
      mode: 'practice',
      selectionMethod,
      subjectSlug: options.subjectSlug,
      year: options.year,
    };
  },

  /**
   * Create an exam simulation mode configuration
   */
  createExamConfig(
    examType: ExamType,
    selectionMethod: SelectionMethod,
    options: { subjectSlug?: string; year?: number }
  ): QuizConfig {
    return {
      examType,
      mode: 'exam',
      selectionMethod,
      subjectSlug: options.subjectSlug,
      year: options.year,
    };
  },
};
