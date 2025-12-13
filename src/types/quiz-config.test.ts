import { describe, it, expect } from 'vitest';
import {
  QuizConfigHelpers,
  type QuizConfig,
  type ExamType,
  type QuizMode,
  type SelectionMethod,
} from './quiz-config';

describe('QuizConfigHelpers', () => {
  describe('Mode detection', () => {
    it('should correctly identify practice mode', () => {
      const config: QuizConfig = {
        examType: 'JAMB',
        mode: 'practice',
        selectionMethod: 'subject',
        subjectSlug: 'mathematics',
      };

      expect(QuizConfigHelpers.isPracticeMode(config)).toBe(true);
      expect(QuizConfigHelpers.isExamMode(config)).toBe(false);
    });

    it('should correctly identify exam mode', () => {
      const config: QuizConfig = {
        examType: 'JAMB',
        mode: 'exam',
        selectionMethod: 'year',
        year: 2023,
      };

      expect(QuizConfigHelpers.isExamMode(config)).toBe(true);
      expect(QuizConfigHelpers.isPracticeMode(config)).toBe(false);
    });
  });

  describe('Selection method detection', () => {
    it('should correctly identify subject-based selection', () => {
      const config: QuizConfig = {
        examType: 'JAMB',
        mode: 'practice',
        selectionMethod: 'subject',
        subjectSlug: 'english',
      };

      expect(QuizConfigHelpers.isSubjectBased(config)).toBe(true);
      expect(QuizConfigHelpers.isYearBased(config)).toBe(false);
    });

    it('should correctly identify year-based selection', () => {
      const config: QuizConfig = {
        examType: 'JAMB',
        mode: 'exam',
        selectionMethod: 'year',
        year: 2022,
      };

      expect(QuizConfigHelpers.isYearBased(config)).toBe(true);
      expect(QuizConfigHelpers.isSubjectBased(config)).toBe(false);
    });
  });

  describe('Label generation', () => {
    it('should return correct mode labels', () => {
      expect(QuizConfigHelpers.getModeLabel('practice')).toBe('Practice');
      expect(QuizConfigHelpers.getModeLabel('exam')).toBe('Exam Simulation');
    });

    it('should return correct exam type labels', () => {
      expect(QuizConfigHelpers.getExamTypeLabel('JAMB')).toBe('JAMB');

    });

    it('should generate correct quiz mode identifiers', () => {
      const practiceSubject: QuizConfig = {
        examType: 'JAMB',
        mode: 'practice',
        selectionMethod: 'subject',
        subjectSlug: 'mathematics',
      };
      expect(QuizConfigHelpers.getQuizModeIdentifier(practiceSubject)).toBe('practice-subject');

      const examYear: QuizConfig = {
        examType: 'JAMB',
        mode: 'exam',
        selectionMethod: 'year',
        year: 2023,
      };
      expect(QuizConfigHelpers.getQuizModeIdentifier(examYear)).toBe('exam-year');
    });
  });

  describe('Initial state creation', () => {
    it('should create correct initial state for practice mode', () => {
      const config: QuizConfig = {
        examType: 'JAMB',
        mode: 'practice',
        selectionMethod: 'subject',
        subjectSlug: 'physics',
      };

      const state = QuizConfigHelpers.createInitialState(config);

      expect(state.currentIndex).toBe(0);
      expect(state.answers).toEqual({});
      expect(state.timeRemaining).toBeNull();
      expect(state.showExplanations).toBe(true);
      expect(state.completed).toBe(false);
      expect(state.timerHandle).toBeNull();
      expect(state.config).toEqual(config);
      expect(state.startTime).toBeGreaterThan(0);
    });

    it('should create correct initial state for exam mode', () => {
      const config: QuizConfig = {
        examType: 'JAMB',
        mode: 'exam',
        selectionMethod: 'year',
        year: 2023,
      };

      const state = QuizConfigHelpers.createInitialState(config);

      expect(state.currentIndex).toBe(0);
      expect(state.answers).toEqual({});
      expect(state.timeRemaining).toBe(0);
      expect(state.showExplanations).toBe(false);
      expect(state.completed).toBe(false);
      expect(state.timerHandle).toBeNull();
      expect(state.config).toEqual(config);
    });
  });

  describe('Configuration validation', () => {
    it('should validate correct configurations', () => {
      const validConfigs: QuizConfig[] = [
        {
          examType: 'JAMB',
          mode: 'practice',
          selectionMethod: 'subject',
          subjectSlug: 'mathematics',
        },
        {
          examType: 'JAMB',
          mode: 'exam',
          selectionMethod: 'year',
          year: 2023,
        },
        {
          examType: 'JAMB',
          mode: 'practice',
          selectionMethod: 'subject',
          subjectSlug: 'english',
          year: 2022,
        },
      ];

      validConfigs.forEach(config => {
        expect(QuizConfigHelpers.validateConfig(config)).toBeNull();
      });
    });

    it('should reject invalid exam types', () => {
      const config = {
        examType: 'INVALID' as ExamType,
        mode: 'practice' as QuizMode,
        selectionMethod: 'subject' as SelectionMethod,
        subjectSlug: 'mathematics',
      };

      expect(QuizConfigHelpers.validateConfig(config)).toContain('Invalid exam type');
    });

    it('should reject invalid modes', () => {
      const config = {
        examType: 'JAMB' as ExamType,
        mode: 'invalid' as QuizMode,
        selectionMethod: 'subject' as SelectionMethod,
        subjectSlug: 'mathematics',
      };

      expect(QuizConfigHelpers.validateConfig(config)).toContain('Invalid mode');
    });

    it('should reject subject-based config without subject slug', () => {
      const config: QuizConfig = {
        examType: 'JAMB',
        mode: 'practice',
        selectionMethod: 'subject',
      };

      expect(QuizConfigHelpers.validateConfig(config)).toContain('Subject slug is required');
    });

    it('should reject year-based config without year', () => {
      const config: QuizConfig = {
        examType: 'JAMB',
        mode: 'exam',
        selectionMethod: 'year',
      };

      expect(QuizConfigHelpers.validateConfig(config)).toContain('Year is required');
    });

    it('should reject invalid year ranges', () => {
      const configTooOld: QuizConfig = {
        examType: 'JAMB',
        mode: 'practice',
        selectionMethod: 'year',
        year: 1999,
      };

      expect(QuizConfigHelpers.validateConfig(configTooOld)).toContain('Invalid year');

      const configTooNew: QuizConfig = {
        examType: 'JAMB',
        mode: 'exam',
        selectionMethod: 'year',
        year: 2099,
      };

      expect(QuizConfigHelpers.validateConfig(configTooNew)).toContain('Invalid year');
    });
  });

  describe('Configuration factory methods', () => {
    it('should create practice mode configurations', () => {
      const config = QuizConfigHelpers.createPracticeConfig('JAMB', 'subject', {
        subjectSlug: 'chemistry',
      });

      expect(config.examType).toBe('JAMB');
      expect(config.mode).toBe('practice');
      expect(config.selectionMethod).toBe('subject');
      expect(config.subjectSlug).toBe('chemistry');
    });

    it('should create exam mode configurations', () => {
      const config = QuizConfigHelpers.createExamConfig('JAMB', 'year', {
        year: 2023,
      });

      expect(config.examType).toBe('JAMB');
      expect(config.mode).toBe('exam');
      expect(config.selectionMethod).toBe('year');
      expect(config.year).toBe(2023);
    });

    it('should create configurations with both subject and year', () => {
      const config = QuizConfigHelpers.createPracticeConfig('JAMB', 'subject', {
        subjectSlug: 'biology',
        year: 2022,
      });

      expect(config.subjectSlug).toBe('biology');
      expect(config.year).toBe(2022);
    });
  });
});
