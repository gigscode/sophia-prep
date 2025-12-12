import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { UniversalQuizModeSelector } from './UniversalQuizModeSelector';
import type { ExamTypeRecord } from '../../types/database';

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

describe('UniversalQuizModeSelector', () => {
  const mockOnModeSelected = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders quiz mode selection interface', () => {
    render(
      <UniversalQuizModeSelector 
        examType={mockExamType}
        onModeSelected={mockOnModeSelected}
      />
    );
    
    expect(screen.getByText('Select Quiz Mode')).toBeInTheDocument();
    expect(screen.getByText('Learn at your own pace')).toBeInTheDocument();
    expect(screen.getByText('Real exam simulation')).toBeInTheDocument();
  });

  it('displays exam type information in header', () => {
    render(
      <UniversalQuizModeSelector 
        examType={mockExamType}
        onModeSelected={mockOnModeSelected}
      />
    );
    
    expect(screen.getByText(/Choose your preferred quiz experience for JAMB/)).toBeInTheDocument();
  });

  it('shows practice mode features', () => {
    render(
      <UniversalQuizModeSelector 
        examType={mockExamType}
        onModeSelected={mockOnModeSelected}
      />
    );
    
    expect(screen.getByText('Unlimited time per question')).toBeInTheDocument();
    expect(screen.getByText('Immediate explanations after each answer')).toBeInTheDocument();
    expect(screen.getByText('Custom question count (5-100)')).toBeInTheDocument();
  });

  it('shows CBT exam mode features', () => {
    render(
      <UniversalQuizModeSelector 
        examType={mockExamType}
        onModeSelected={mockOnModeSelected}
      />
    );
    
    expect(screen.getByText('1-minute timer per question')).toBeInTheDocument();
    expect(screen.getByText('Explanations shown after quiz completion')).toBeInTheDocument();
    expect(screen.getByText('Question count selection (5-180)')).toBeInTheDocument();
    expect(screen.getByText('Exam year selection (2020-2024)')).toBeInTheDocument();
  });

  it('calls onModeSelected when practice mode is clicked', () => {
    render(
      <UniversalQuizModeSelector 
        examType={mockExamType}
        onModeSelected={mockOnModeSelected}
      />
    );
    
    fireEvent.click(screen.getByText('Learn at your own pace'));
    
    expect(mockOnModeSelected).toHaveBeenCalledWith('PRACTICE', expect.objectContaining({
      mode: 'PRACTICE',
      examType: mockExamType,
      hasTimer: false,
      showImmediateExplanations: true,
      autoSubmitOnTimeout: false
    }));
  });

  it('calls onModeSelected when CBT exam mode is clicked', () => {
    render(
      <UniversalQuizModeSelector 
        examType={mockExamType}
        onModeSelected={mockOnModeSelected}
      />
    );
    
    fireEvent.click(screen.getByText('Real exam simulation'));
    
    expect(mockOnModeSelected).toHaveBeenCalledWith('CBT_EXAM', expect.objectContaining({
      mode: 'CBT_EXAM',
      examType: mockExamType,
      hasTimer: true,
      showImmediateExplanations: false,
      autoSubmitOnTimeout: true
    }));
  });

  it('shows selected mode styling when selectedMode prop is provided', () => {
    render(
      <UniversalQuizModeSelector 
        examType={mockExamType}
        onModeSelected={mockOnModeSelected}
        selectedMode="PRACTICE"
      />
    );
    
    const practiceButton = screen.getByText('Learn at your own pace').closest('button');
    expect(practiceButton).toHaveClass('ring-2', 'ring-green-500', 'bg-green-50');
  });

  it('displays mode comparison table', () => {
    render(
      <UniversalQuizModeSelector 
        examType={mockExamType}
        onModeSelected={mockOnModeSelected}
      />
    );
    
    expect(screen.getByText('Mode Comparison')).toBeInTheDocument();
    expect(screen.getByText('Timer')).toBeInTheDocument();
    expect(screen.getByText('No timer')).toBeInTheDocument();
    expect(screen.getByText('1 min/question')).toBeInTheDocument();
  });

  it('shows selection confirmation when mode is selected', () => {
    render(
      <UniversalQuizModeSelector 
        examType={mockExamType}
        onModeSelected={mockOnModeSelected}
        selectedMode="CBT_EXAM"
      />
    );
    
    expect(screen.getByText('Selected:')).toBeInTheDocument();
    expect(screen.getByText(/CBT Exam Mode for JAMB/)).toBeInTheDocument();
    expect(screen.getByText(/Next, you'll select your subjects and configure your quiz settings/)).toBeInTheDocument();
  });
});