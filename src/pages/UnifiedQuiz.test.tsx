import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { UnifiedQuiz } from './UnifiedQuiz';
import type { QuizConfig } from '../types/quiz-config';
import { questionService } from '../services/question-service';
import { subjectService } from '../services/subject-service';
import type { Subject, Question } from '../integrations/supabase/types';

// Mock services
vi.mock('../services/question-service');
vi.mock('../services/subject-service');
vi.mock('../services/analytics-service');
vi.mock('../services/timer-service');

describe('UnifiedQuiz - Explanation Visibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(questionService.getQuestionsBySubjectSlug).mockResolvedValue([
      {
        id: '1',
        question_text: 'Test question 1?',
        option_a: 'Option A',
        option_b: 'Option B',
        option_c: 'Option C',
        option_d: 'Option D',
        correct_answer: 'A',
        explanation: 'This is the explanation for question 1',
        exam_type: 'JAMB',
        exam_year: 2023
      } as unknown as Question
    ]);
    vi.mocked(subjectService.getSubjectBySlug).mockResolvedValue({ id: 'subject-1', name: 'Mathematics' } as Subject);
    vi.mocked(subjectService.getSubjectsByExamType).mockResolvedValue([]);
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

/**
 * Tests for UnifiedQuiz compatibility with updated Question Service
 * Verifies Requirements: 1.3, 1.4, 7.4
 */
describe('UnifiedQuiz - Question Service Compatibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(subjectService.getSubjectBySlug).mockResolvedValue({
      id: 'subject-1',
      name: 'Mathematics',
      slug: 'mathematics'
    } as Subject);
  });

  describe('Subject-based quiz flow', () => {
    it('should load questions by subject using updated Question Service', async () => {
      // Mock questions returned by the updated service (with subject_id)
      vi.mocked(questionService.getQuestionsBySubjectSlug).mockResolvedValue([
        {
          id: 'q1',
          subject_id: 'subject-1',
          topic_id: null, // Questions can now have null topic_id
          question_text: 'What is 2 + 2?',
          option_a: '3',
          option_b: '4',
          option_c: '5',
          option_d: '6',
          correct_answer: 'B',
          explanation: 'Basic addition',
          exam_type: 'JAMB',
          exam_year: 2023,
          is_active: true
        },
        {
          id: 'q2',
          subject_id: 'subject-1',
          topic_id: 'topic-1', // Some questions may still have topics
          question_text: 'What is 3 + 3?',
          option_a: '5',
          option_b: '6',
          option_c: '7',
          option_d: '8',
          correct_answer: 'B',
          explanation: 'More addition',
          exam_type: 'JAMB',
          exam_year: 2023,
          is_active: true
        }
      ] as any);

      const config: QuizConfig = {
        examType: 'JAMB',
        mode: 'practice',
        selectionMethod: 'subject',
        subjectSlug: 'mathematics'
      };

      render(
        <BrowserRouter>
          <UnifiedQuiz config={config} />
        </BrowserRouter>
      );

      // Verify questions load successfully
      await waitFor(() => {
        expect(screen.getByText(/What is 2 \+ 2\?/i)).toBeInTheDocument();
      });

      // Verify the service was called with correct parameters
      expect(questionService.getQuestionsBySubjectSlug).toHaveBeenCalledWith(
        'mathematics',
        expect.objectContaining({
          exam_type: 'JAMB',
          limit: 60
        })
      );
    });

    it('should apply exam_year filter when provided', async () => {
      vi.mocked(questionService.getQuestionsBySubjectSlug).mockResolvedValue([
        {
          id: 'q1',
          subject_id: 'subject-1',
          topic_id: null,
          question_text: '2023 question',
          option_a: 'A',
          option_b: 'B',
          option_c: 'C',
          option_d: 'D',
          correct_answer: 'A',
          exam_type: 'JAMB',
          exam_year: 2023,
          is_active: true
        }
      ] as unknown as Question[]);

      const config: QuizConfig = {
        examType: 'JAMB',
        mode: 'practice',
        selectionMethod: 'subject',
        subjectSlug: 'mathematics',
        year: 2023
      };

      render(
        <BrowserRouter>
          <UnifiedQuiz config={config} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/2023 question/i)).toBeInTheDocument();
      });

      // Verify year filter was passed
      expect(questionService.getQuestionsBySubjectSlug).toHaveBeenCalledWith(
        'mathematics',
        expect.objectContaining({
          exam_type: 'JAMB',
          exam_year: 2023,
          limit: 60
        })
      );
    });
  });

  describe('Year-based quiz flow', () => {
    it('should load questions by year across multiple subjects', async () => {
      // Mock multiple subjects
      vi.mocked(subjectService.getSubjectsByExamType).mockResolvedValue([
        { id: 'subject-1', name: 'Mathematics', slug: 'mathematics' },
        { id: 'subject-2', name: 'English', slug: 'english' }
      ] as Subject[]);

      // Mock questions for each subject
      vi.mocked(questionService.getQuestionsBySubjectSlug)
        .mockResolvedValueOnce([
          {
            id: 'q1',
            subject_id: 'subject-1',
            topic_id: null,
            question_text: 'Math question 2023',
            option_a: 'A',
            option_b: 'B',
            option_c: 'C',
            option_d: 'D',
            correct_answer: 'A',
            exam_type: 'JAMB',
            exam_year: 2023,
            is_active: true
          }
        ] as unknown as Question[])
        .mockResolvedValueOnce([
          {
            id: 'q2',
            subject_id: 'subject-2',
            topic_id: null,
            question_text: 'English question 2023',
            option_a: 'A',
            option_b: 'B',
            option_c: 'C',
            option_d: 'D',
            correct_answer: 'B',
            exam_type: 'JAMB',
            exam_year: 2023,
            is_active: true
          }
        ] as unknown as Question[]);

      const config: QuizConfig = {
        examType: 'JAMB',
        mode: 'practice',
        selectionMethod: 'year',
        year: 2023
      };

      render(
        <BrowserRouter>
          <UnifiedQuiz config={config} />
        </BrowserRouter>
      );

      // Verify questions from both subjects load
      await waitFor(() => {
        expect(screen.getByText(/Math question 2023|English question 2023/i)).toBeInTheDocument();
      });

      // Verify service was called for each subject with year filter
      expect(questionService.getQuestionsBySubjectSlug).toHaveBeenCalledWith(
        'mathematics',
        expect.objectContaining({
          exam_type: 'JAMB',
          exam_year: 2023,
          limit: 10
        })
      );

      expect(questionService.getQuestionsBySubjectSlug).toHaveBeenCalledWith(
        'english',
        expect.objectContaining({
          exam_type: 'JAMB',
          exam_year: 2023,
          limit: 10
        })
      );
    });
  });

  describe('Error handling for empty question sets', () => {
    it('should display error message when no questions are available', async () => {
      vi.mocked(questionService.getQuestionsBySubjectSlug).mockResolvedValue([]);

      const config: QuizConfig = {
        examType: 'JAMB',
        mode: 'practice',
        selectionMethod: 'subject',
        subjectSlug: 'mathematics'
      };

      render(
        <BrowserRouter>
          <UnifiedQuiz config={config} />
        </BrowserRouter>
      );

      // Wait for error message to appear
      await waitFor(() => {
        expect(screen.getByText(/No questions available/i)).toBeInTheDocument();
      });

      // Verify navigation options are available
      expect(screen.getByText(/Back to Mode Selection/i)).toBeInTheDocument();
    });

    it('should handle service errors gracefully', async () => {
      vi.mocked(questionService.getQuestionsBySubjectSlug).mockRejectedValue(
        new Error('Database connection failed')
      );

      const config: QuizConfig = {
        examType: 'JAMB',
        mode: 'practice',
        selectionMethod: 'subject',
        subjectSlug: 'mathematics'
      };

      render(
        <BrowserRouter>
          <UnifiedQuiz config={config} />
        </BrowserRouter>
      );

      // Wait for error message
      await waitFor(() => {
        expect(screen.getByText(/Database connection failed/i)).toBeInTheDocument();
      });

      // Verify retry option is available
      expect(screen.getByText(/Retry/i)).toBeInTheDocument();
    });

    it('should show appropriate message when subject has no questions for selected year', async () => {
      vi.mocked(questionService.getQuestionsBySubjectSlug).mockResolvedValue([]);

      const config: QuizConfig = {
        examType: 'JAMB',
        mode: 'practice',
        selectionMethod: 'subject',
        subjectSlug: 'mathematics',
        year: 2020
      };

      render(
        <BrowserRouter>
          <UnifiedQuiz config={config} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/No questions available/i)).toBeInTheDocument();
      });
    });
  });

  describe('Backward compatibility', () => {
    it('should work with questions that have both subject_id and topic_id', async () => {
      vi.mocked(questionService.getQuestionsBySubjectSlug).mockResolvedValue([
        {
          id: 'q1',
          subject_id: 'subject-1',
          topic_id: 'topic-1', // Has topic
          question_text: 'Question with topic',
          option_a: 'A',
          option_b: 'B',
          option_c: 'C',
          option_d: 'D',
          correct_answer: 'A',
          exam_type: 'JAMB',
          exam_year: 2023,
          is_active: true
        }
      ] as unknown as Question[]);

      const config: QuizConfig = {
        examType: 'JAMB',
        mode: 'practice',
        selectionMethod: 'subject',
        subjectSlug: 'mathematics'
      };

      render(
        <BrowserRouter>
          <UnifiedQuiz config={config} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Question with topic/i)).toBeInTheDocument();
      });
    });

    it('should work with questions that have only subject_id (null topic_id)', async () => {
      vi.mocked(questionService.getQuestionsBySubjectSlug).mockResolvedValue([
        {
          id: 'q1',
          subject_id: 'subject-1',
          topic_id: null, // No topic
          question_text: 'Question without topic',
          option_a: 'A',
          option_b: 'B',
          option_c: 'C',
          option_d: 'D',
          correct_answer: 'A',
          exam_type: 'JAMB',
          exam_year: 2023,
          is_active: true
        }
      ] as unknown as Question[]);

      const config: QuizConfig = {
        examType: 'JAMB',
        mode: 'practice',
        selectionMethod: 'subject',
        subjectSlug: 'mathematics'
      };

      render(
        <BrowserRouter>
          <UnifiedQuiz config={config} />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Question without topic/i)).toBeInTheDocument();
      });
    });

    it('should work with mixed questions (some with topics, some without)', async () => {
      vi.mocked(questionService.getQuestionsBySubjectSlug).mockResolvedValue([
        {
          id: 'q1',
          subject_id: 'subject-1',
          topic_id: 'topic-1',
          question_text: 'With topic',
          option_a: 'A',
          option_b: 'B',
          option_c: 'C',
          option_d: 'D',
          correct_answer: 'A',
          exam_type: 'JAMB',
          exam_year: 2023,
          is_active: true
        },
        {
          id: 'q2',
          subject_id: 'subject-1',
          topic_id: null,
          question_text: 'Without topic',
          option_a: 'A',
          option_b: 'B',
          option_c: 'C',
          option_d: 'D',
          correct_answer: 'B',
          exam_type: 'JAMB',
          exam_year: 2023,
          is_active: true
        }
      ] as unknown as Question[]);

      const config: QuizConfig = {
        examType: 'JAMB',
        mode: 'practice',
        selectionMethod: 'subject',
        subjectSlug: 'mathematics'
      };

      render(
        <BrowserRouter>
          <UnifiedQuiz config={config} />
        </BrowserRouter>
      );

      // First question should be visible
      await waitFor(() => {
        expect(screen.getByText(/With topic/i)).toBeInTheDocument();
      });
    });
  });
});
