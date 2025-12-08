import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { UnifiedQuiz } from './UnifiedQuiz';
import type { QuizConfig } from '../types/quiz-config';

// Mock services
const mockGetQuestionsBySubjectSlug = vi.fn();
const mockGetSubjectsByExamType = vi.fn();
const mockGetSubjectBySlug = vi.fn();

vi.mock('../services/question-service', () => ({
  questionService: {
    getQuestionsBySubjectSlug: mockGetQuestionsBySubjectSlug
  },
  normalizeQuestions: vi.fn((questions) => questions.map((q: any) => ({
    id: q.id,
    text: q.question_text,
    options: [
      { key: 'A', text: q.option_a },
      { key: 'B', text: q.option_b },
      { key: 'C', text: q.option_c },
      { key: 'D', text: q.option_d }
    ],
    correct: q.correct_answer,
    explanation: q.explanation,
    examYear: q.exam_year,
    examType: q.exam_type
  })))
}));

vi.mock('../services/subject-service', () => ({
  subjectService: {
    getSubjectsByExamType: mockGetSubjectsByExamType,
    getSubjectBySlug: mockGetSubjectBySlug
  }
}));

vi.mock('../services/analytics-service', () => ({
  analyticsService: {
    saveQuizAttempt: vi.fn().mockResolvedValue({})
  }
}));

vi.mock('../services/timer-service', () => ({
  timerService: {
    getDuration: vi.fn().mockResolvedValue(3600),
    startTimer: vi.fn().mockReturnValue({
      id: 'timer-1',
      pause: vi.fn(),
      resume: vi.fn(),
      getRemaining: vi.fn().mockReturnValue(3600)
    }),
    stopTimer: vi.fn(),
    restoreTimer: vi.fn().mockReturnValue(null)
  }
}));

describe('UnifiedQuiz - Explanation Visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show explanations immediately in practice mode after answering', async () => {
    const practiceConfig: QuizConfig = {
      examType: 'JAMB',
      mode: 'practice',
      selectionMethod: 'subject',
      subjectSlug: 'mathematics'
    };

    render(
      <BrowserRouter>
        <UnifiedQuiz config={practiceConfig} />
      </BrowserRouter>
    );

    // Wait for questions to load
    await waitFor(() => {
      expect(screen.getByText(/Test question 1\?/i)).toBeInTheDocument();
    });

    // Initially, explanation should not be visible
    expect(screen.queryByText(/This is the explanation for question 1/i)).not.toBeInTheDocument();

    // Click an answer
    const optionA = screen.getByText(/Option A/i);
    optionA.click();

    // After answering in practice mode, explanation should be visible
    await waitFor(() => {
      expect(screen.getByText(/This is the explanation for question 1/i)).toBeInTheDocument();
    });

    // Should also show feedback
    expect(screen.getByText(/Correct!/i)).toBeInTheDocument();

    // Should show next question button
    expect(screen.getByText(/Next Question|Complete Quiz/i)).toBeInTheDocument();
  });

  it('should hide explanations during exam simulation mode', async () => {
    const examConfig: QuizConfig = {
      examType: 'JAMB',
      mode: 'exam',
      selectionMethod: 'subject',
      subjectSlug: 'mathematics'
    };

    render(
      <BrowserRouter>
        <UnifiedQuiz config={examConfig} />
      </BrowserRouter>
    );

    // Wait for questions to load
    await waitFor(() => {
      expect(screen.getByText(/Test question 1\?/i)).toBeInTheDocument();
    });

    // Click an answer
    const optionA = screen.getByText(/Option A/i);
    optionA.click();

    // In exam mode, explanation should NOT be visible
    await waitFor(() => {
      expect(screen.queryByText(/This is the explanation for question 1/i)).not.toBeInTheDocument();
    });

    // Should not show feedback either
    expect(screen.queryByText(/Correct!/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Incorrect/i)).not.toBeInTheDocument();
  });

  it('should show timer in exam mode but not in practice mode', async () => {
    const practiceConfig: QuizConfig = {
      examType: 'JAMB',
      mode: 'practice',
      selectionMethod: 'subject',
      subjectSlug: 'mathematics'
    };

    const { rerender } = render(
      <BrowserRouter>
        <UnifiedQuiz config={practiceConfig} />
      </BrowserRouter>
    );

    // Wait for questions to load
    await waitFor(() => {
      expect(screen.getByText(/Test question 1\?/i)).toBeInTheDocument();
    });

    // Practice mode should not show timer
    expect(screen.queryByRole('timer')).not.toBeInTheDocument();

    // Now test exam mode
    const examConfig: QuizConfig = {
      examType: 'JAMB',
      mode: 'exam',
      selectionMethod: 'subject',
      subjectSlug: 'mathematics'
    };

    rerender(
      <BrowserRouter>
        <UnifiedQuiz config={examConfig} />
      </BrowserRouter>
    );

    // Wait for questions to load
    await waitFor(() => {
      expect(screen.getByText(/Test question 1\?/i)).toBeInTheDocument();
    });

    // Exam mode should show timer
    await waitFor(() => {
      expect(screen.getByRole('timer')).toBeInTheDocument();
    });
  });

  it('should enable next question control in practice mode after showing feedback', async () => {
    const practiceConfig: QuizConfig = {
      examType: 'JAMB',
      mode: 'practice',
      selectionMethod: 'subject',
      subjectSlug: 'mathematics'
    };

    render(
      <BrowserRouter>
        <UnifiedQuiz config={practiceConfig} />
      </BrowserRouter>
    );

    // Wait for questions to load
    await waitFor(() => {
      expect(screen.getByText(/Test question 1\?/i)).toBeInTheDocument();
    });

    // Click an answer
    const optionA = screen.getByText(/Option A/i);
    optionA.click();

    // After answering, next question button should be visible
    await waitFor(() => {
      const nextButton = screen.getByText(/Next Question|Complete Quiz/i);
      expect(nextButton).toBeInTheDocument();
      expect(nextButton).not.toBeDisabled();
    });
  });
});
