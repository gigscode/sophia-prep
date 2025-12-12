import { render, screen, act } from '@testing-library/react';
import { vi } from 'vitest';
import { 
  UniversalQuizConfigProvider, 
  useUniversalQuizConfigContext,
  ConfigurationStepUtils 
} from './UniversalQuizConfigContext';
import type { ExamTypeRecord } from '../types/database';

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

// Test component that uses the context
function TestComponent() {
  const {
    config,
    setExamType,
    isExamTypeSelected,
    validateConfiguration
  } = useUniversalQuizConfigContext();

  return (
    <div>
      <div data-testid="current-step">{config.currentStep}</div>
      <div data-testid="exam-type-selected">{isExamTypeSelected.toString()}</div>
      <div data-testid="validation-errors">
        {validateConfiguration().errors.join(', ')}
      </div>
      <button 
        onClick={() => setExamType(mockExamType)}
        data-testid="set-exam-type"
      >
        Set Exam Type
      </button>
    </div>
  );
}

// Test component without provider
function TestComponentWithoutProvider() {
  try {
    useUniversalQuizConfigContext();
    return <div>Should not render</div>;
  } catch (error) {
    return <div data-testid="error">{(error as Error).message}</div>;
  }
}

describe('UniversalQuizConfigContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('provides configuration context to child components', () => {
    render(
      <UniversalQuizConfigProvider>
        <TestComponent />
      </UniversalQuizConfigProvider>
    );

    expect(screen.getByTestId('current-step')).toHaveTextContent('exam-type-selection');
    expect(screen.getByTestId('exam-type-selected')).toHaveTextContent('false');
  });

  it('allows child components to update configuration', () => {
    render(
      <UniversalQuizConfigProvider>
        <TestComponent />
      </UniversalQuizConfigProvider>
    );

    act(() => {
      screen.getByTestId('set-exam-type').click();
    });

    expect(screen.getByTestId('current-step')).toHaveTextContent('mode-selection');
    expect(screen.getByTestId('exam-type-selected')).toHaveTextContent('true');
  });

  it('throws error when used outside provider', () => {
    render(<TestComponentWithoutProvider />);
    
    expect(screen.getByTestId('error')).toHaveTextContent(
      'useUniversalQuizConfigContext must be used within a UniversalQuizConfigProvider'
    );
  });

  describe('ConfigurationStepUtils', () => {
    it('returns correct step names', () => {
      expect(ConfigurationStepUtils.getStepName('exam-type-selection')).toBe('Select Exam Type');
      expect(ConfigurationStepUtils.getStepName('mode-selection')).toBe('Select Quiz Mode');
      expect(ConfigurationStepUtils.getStepName('subject-selection')).toBe('Select Subjects');
      expect(ConfigurationStepUtils.getStepName('configuration')).toBe('Configure Quiz');
      expect(ConfigurationStepUtils.getStepName('ready')).toBe('Ready to Start');
    });

    it('returns correct step progress', () => {
      expect(ConfigurationStepUtils.getStepProgress('exam-type-selection')).toBe(20);
      expect(ConfigurationStepUtils.getStepProgress('mode-selection')).toBe(40);
      expect(ConfigurationStepUtils.getStepProgress('subject-selection')).toBe(60);
      expect(ConfigurationStepUtils.getStepProgress('configuration')).toBe(80);
      expect(ConfigurationStepUtils.getStepProgress('ready')).toBe(100);
    });

    it('correctly identifies completed steps', () => {
      expect(ConfigurationStepUtils.isStepCompleted('configuration', 'exam-type-selection')).toBe(true);
      expect(ConfigurationStepUtils.isStepCompleted('mode-selection', 'configuration')).toBe(false);
      expect(ConfigurationStepUtils.isStepCompleted('ready', 'subject-selection')).toBe(true);
    });

    it('returns correct next steps', () => {
      expect(ConfigurationStepUtils.getNextStep('exam-type-selection')).toBe('mode-selection');
      expect(ConfigurationStepUtils.getNextStep('mode-selection')).toBe('subject-selection');
      expect(ConfigurationStepUtils.getNextStep('subject-selection')).toBe('configuration');
      expect(ConfigurationStepUtils.getNextStep('configuration')).toBe('ready');
      expect(ConfigurationStepUtils.getNextStep('ready')).toBeNull();
    });

    it('returns correct previous steps', () => {
      expect(ConfigurationStepUtils.getPreviousStep('mode-selection')).toBe('exam-type-selection');
      expect(ConfigurationStepUtils.getPreviousStep('subject-selection')).toBe('mode-selection');
      expect(ConfigurationStepUtils.getPreviousStep('configuration')).toBe('subject-selection');
      expect(ConfigurationStepUtils.getPreviousStep('ready')).toBe('configuration');
      expect(ConfigurationStepUtils.getPreviousStep('exam-type-selection')).toBeNull();
    });
  });
});