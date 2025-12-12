import { renderHook, act } from '@testing-library/react';
import { vi } from 'vitest';
import { useUniversalQuizConfig } from './useUniversalQuizConfig';
import type { ExamTypeRecord } from '../types/database';
import type { UniversalQuizModeConfig } from '../components/quiz/UniversalQuizModeSelector';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

const mockExamType: ExamTypeRecord = {
  id: '1',
  name: 'JAMB',
  slug: 'jamb',
  description: 'University entrance exam',
  full_name: 'Joint Admissions and Matriculation Board',
  duration_minutes: 150,
  total_questions: 180,
  passing_score: 180,
  is_active: true,
  sort_order: 1,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z'
};

const mockPracticeModeConfig: UniversalQuizModeConfig = {
  mode: 'PRACTICE',
  examType: mockExamType,
  hasTimer: false,
  showImmediateExplanations: true,
  autoSubmitOnTimeout: false,
  description: 'Practice mode description',
  features: ['Feature 1', 'Feature 2']
};

const mockCBTModeConfig: UniversalQuizModeConfig = {
  mode: 'CBT_EXAM',
  examType: mockExamType,
  hasTimer: true,
  showImmediateExplanations: false,
  autoSubmitOnTimeout: true,
  description: 'CBT mode description',
  features: ['Feature 1', 'Feature 2']
};

describe('useUniversalQuizConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('initializes with default configuration', () => {
    const { result } = renderHook(() => useUniversalQuizConfig());
    
    expect(result.current.config.examType).toBeNull();
    expect(result.current.config.mode).toBeNull();
    expect(result.current.config.currentStep).toBe('exam-type-selection');
    expect(result.current.config.questionCount).toBe(20);
    expect(result.current.config.isComplete).toBe(false);
  });

  it('loads configuration from localStorage on mount', () => {
    const savedConfig = {
      examType: mockExamType,
      mode: 'PRACTICE',
      questionCount: 50
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedConfig));
    
    const { result } = renderHook(() => useUniversalQuizConfig());
    
    expect(result.current.config.examType).toEqual(mockExamType);
    expect(result.current.config.mode).toBe('PRACTICE');
    expect(result.current.config.questionCount).toBe(50);
  });

  it('sets exam type and advances to mode selection', () => {
    const { result } = renderHook(() => useUniversalQuizConfig());
    
    act(() => {
      result.current.setExamType(mockExamType);
    });
    
    expect(result.current.config.examType).toEqual(mockExamType);
    expect(result.current.config.currentStep).toBe('mode-selection');
    expect(result.current.isExamTypeSelected).toBe(true);
  });

  it('sets quiz mode and configuration', () => {
    const { result } = renderHook(() => useUniversalQuizConfig());
    
    act(() => {
      result.current.setQuizMode('PRACTICE', mockPracticeModeConfig);
    });
    
    expect(result.current.config.mode).toBe('PRACTICE');
    expect(result.current.config.modeConfig).toEqual(mockPracticeModeConfig);
    expect(result.current.config.hasTimer).toBe(false);
    expect(result.current.config.showImmediateExplanations).toBe(true);
    expect(result.current.config.autoSubmitOnTimeout).toBe(false);
    expect(result.current.config.currentStep).toBe('subject-selection');
    expect(result.current.isModeSelected).toBe(true);
  });

  it('sets CBT mode with correct configuration', () => {
    const { result } = renderHook(() => useUniversalQuizConfig());
    
    act(() => {
      result.current.setQuizMode('CBT_EXAM', mockCBTModeConfig);
    });
    
    expect(result.current.config.mode).toBe('CBT_EXAM');
    expect(result.current.config.hasTimer).toBe(true);
    expect(result.current.config.showImmediateExplanations).toBe(false);
    expect(result.current.config.autoSubmitOnTimeout).toBe(true);
  });

  it('sets selected subjects and advances step', () => {
    const { result } = renderHook(() => useUniversalQuizConfig());
    
    act(() => {
      result.current.setSelectedSubjects(['math', 'english', 'physics']);
    });
    
    expect(result.current.config.selectedSubjects).toEqual(['math', 'english', 'physics']);
    expect(result.current.config.currentStep).toBe('configuration');
    expect(result.current.areSubjectsSelected).toBe(true);
  });

  it('validates question count for practice mode', () => {
    const { result } = renderHook(() => useUniversalQuizConfig());
    
    act(() => {
      result.current.setQuizMode('PRACTICE', mockPracticeModeConfig);
      result.current.setQuestionCount(150); // Above practice mode limit
    });
    
    expect(result.current.config.questionCount).toBe(100); // Clamped to max
    
    act(() => {
      result.current.setQuestionCount(3); // Below minimum
    });
    
    expect(result.current.config.questionCount).toBe(5); // Clamped to min
  });

  it('validates question count for CBT mode', () => {
    const { result } = renderHook(() => useUniversalQuizConfig());
    
    act(() => {
      result.current.setQuizMode('CBT_EXAM', mockCBTModeConfig);
      result.current.setQuestionCount(200); // Above CBT mode limit
    });
    
    expect(result.current.config.questionCount).toBe(180); // Clamped to max
  });

  it('sets exam year', () => {
    const { result } = renderHook(() => useUniversalQuizConfig());
    
    act(() => {
      result.current.setExamYear(2023);
    });
    
    expect(result.current.config.examYear).toBe(2023);
  });

  it('marks configuration as complete', () => {
    const { result } = renderHook(() => useUniversalQuizConfig());
    
    act(() => {
      result.current.markConfigurationComplete();
    });
    
    expect(result.current.config.isComplete).toBe(true);
    expect(result.current.config.currentStep).toBe('ready');
  });

  it('resets configuration to default state', () => {
    const { result } = renderHook(() => useUniversalQuizConfig());
    
    // Set some configuration
    act(() => {
      result.current.setExamType(mockExamType);
      result.current.setQuizMode('PRACTICE', mockPracticeModeConfig);
      result.current.setSelectedSubjects(['math', 'english']);
    });
    
    // Reset
    act(() => {
      result.current.resetConfiguration();
    });
    
    expect(result.current.config.examType).toBeNull();
    expect(result.current.config.mode).toBeNull();
    expect(result.current.config.selectedSubjects).toEqual([]);
    expect(result.current.config.currentStep).toBe('exam-type-selection');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('universal-quiz-config');
  });

  it('goes to previous step correctly', () => {
    const { result } = renderHook(() => useUniversalQuizConfig());
    
    // Start at ready step
    act(() => {
      result.current.setExamType(mockExamType);
      result.current.setQuizMode('PRACTICE', mockPracticeModeConfig);
      result.current.setSelectedSubjects(['math']);
      result.current.markConfigurationComplete();
    });
    
    expect(result.current.config.currentStep).toBe('ready');
    
    // Go back to configuration
    act(() => {
      result.current.goToPreviousStep();
    });
    
    expect(result.current.config.currentStep).toBe('configuration');
    expect(result.current.config.isComplete).toBe(false);
  });

  it('validates JAMB configuration correctly', () => {
    const { result } = renderHook(() => useUniversalQuizConfig());
    
    act(() => {
      result.current.setExamType({ ...mockExamType, slug: 'jamb' });
      result.current.setQuizMode('CBT_EXAM', mockCBTModeConfig);
      result.current.setSelectedSubjects(['math', 'english', 'physics']); // Only 3 subjects
    });
    
    const validation = result.current.validateConfiguration();
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('JAMB requires exactly 4 subjects');
    expect(validation.errors).toContain('Exam year is required for CBT mode');
  });

  it('validates WAEC configuration correctly', () => {
    const { result } = renderHook(() => useUniversalQuizConfig());
    
    act(() => {
      result.current.setExamType({ ...mockExamType, slug: 'waec' });
      result.current.setQuizMode('PRACTICE', mockPracticeModeConfig);
      result.current.setSelectedSubjects(['math', 'english']); // Only 2 subjects
    });
    
    const validation = result.current.validateConfiguration();
    expect(validation.isValid).toBe(false);
    expect(validation.errors).toContain('WAEC requires 6-9 subjects');
  });

  it('provides configuration summary', () => {
    const { result } = renderHook(() => useUniversalQuizConfig());
    
    act(() => {
      result.current.setExamType(mockExamType);
      result.current.setQuizMode('PRACTICE', mockPracticeModeConfig);
      result.current.setSelectedSubjects(['math', 'english']);
      result.current.setQuestionCount(50);
    });
    
    const summary = result.current.getConfigurationSummary();
    expect(summary.examTypeName).toBe('JAMB');
    expect(summary.modeName).toBe('Practice Mode');
    expect(summary.subjectCount).toBe(2);
    expect(summary.questionCount).toBe(50);
    expect(summary.hasTimer).toBe(false);
    expect(summary.showImmediateExplanations).toBe(true);
    expect(summary.allowReviewMode).toBe(true);
    expect(summary.shuffleQuestions).toBe(false);
    expect(summary.shuffleOptions).toBe(false);
    expect(summary.enableBookmarking).toBe(true);
    expect(summary.version).toBe('1.0.0');
    expect(typeof summary.lastModified).toBe('number');
  });

  it('saves configuration to localStorage', () => {
    const { result } = renderHook(() => useUniversalQuizConfig());
    
    act(() => {
      result.current.setExamType(mockExamType);
    });
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'universal-quiz-config',
      expect.stringContaining('"examType"')
    );
  });

  it('updates mode-specific behavior flags', () => {
    const { result } = renderHook(() => useUniversalQuizConfig());
    
    act(() => {
      result.current.updateBehaviorFlags({
        allowReviewMode: false,
        shuffleQuestions: true,
        enableBookmarking: false
      });
    });
    
    expect(result.current.config.allowReviewMode).toBe(false);
    expect(result.current.config.shuffleQuestions).toBe(true);
    expect(result.current.config.enableBookmarking).toBe(false);
  });

  it('gets mode-specific behavior configuration', () => {
    const { result } = renderHook(() => useUniversalQuizConfig());
    
    act(() => {
      result.current.setQuizMode('CBT_EXAM', mockCBTModeConfig);
    });
    
    const behavior = result.current.getModeSpecificBehavior();
    expect(behavior.hasTimer).toBe(true);
    expect(behavior.showImmediateExplanations).toBe(false);
    expect(behavior.autoSubmitOnTimeout).toBe(true);
    expect(behavior.allowReviewMode).toBe(false);
    expect(behavior.shuffleQuestions).toBe(true);
    expect(behavior.shuffleOptions).toBe(true);
    expect(behavior.enableBookmarking).toBe(false);
  });

  it('sets mode-specific behavior flags when setting quiz mode', () => {
    const { result } = renderHook(() => useUniversalQuizConfig());
    
    // Test Practice mode behavior flags
    act(() => {
      result.current.setQuizMode('PRACTICE', mockPracticeModeConfig);
    });
    
    expect(result.current.config.allowReviewMode).toBe(true);
    expect(result.current.config.shuffleQuestions).toBe(false);
    expect(result.current.config.shuffleOptions).toBe(false);
    expect(result.current.config.enableBookmarking).toBe(true);
    
    // Test CBT mode behavior flags
    act(() => {
      result.current.setQuizMode('CBT_EXAM', mockCBTModeConfig);
    });
    
    expect(result.current.config.allowReviewMode).toBe(false);
    expect(result.current.config.shuffleQuestions).toBe(true);
    expect(result.current.config.shuffleOptions).toBe(true);
    expect(result.current.config.enableBookmarking).toBe(false);
  });

  it('updates lastModified timestamp on configuration changes', () => {
    const { result } = renderHook(() => useUniversalQuizConfig());
    const initialTimestamp = result.current.config.lastModified;
    
    act(() => {
      result.current.setExamType(mockExamType);
    });
    
    // The timestamp should be updated (either same or greater due to timing)
    expect(result.current.config.lastModified).toBeGreaterThanOrEqual(initialTimestamp);
    expect(typeof result.current.config.lastModified).toBe('number');
  });
});