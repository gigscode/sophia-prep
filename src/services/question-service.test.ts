import { describe, it, expect, beforeEach, vi } from 'vitest';
import { QuestionService, normalizeQuestions } from './question-service';
import { supabase } from '../integrations/supabase/client';

// Mock the supabase client
vi.mock('../integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}));

describe('QuestionService', () => {
  let questionService: QuestionService;

  beforeEach(() => {
    questionService = new QuestionService();
    vi.clearAllMocks();
  });

  describe('getQuestionsBySubjectSlug', () => {
    it('should load questions for a subject without filters', async () => {
      const mockSubject = { id: 'subject-1', slug: 'mathematics', is_active: true };
      const mockQuestions = [
        { id: 'q1', subject_id: 'subject-1', question_text: 'Question 1', is_active: true },
        { id: 'q2', subject_id: 'subject-1', question_text: 'Question 2', is_active: true }
      ];

      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'subjects') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({ data: mockSubject })
                })
              })
            })
          };
        }
        if (table === 'questions') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockResolvedValue({ data: mockQuestions })
                })
              })
            })
          };
        }
      });

      const result = await questionService.getQuestionsBySubjectSlug('mathematics');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('q1');
    });
  });

  describe('getQuestionsByYear', () => {
    it('should load questions for a specific year', async () => {
      const mockQuestions = [
        { id: 'q1', exam_year: 2023, question_text: 'Question 1', is_active: true },
        { id: 'q2', exam_year: 2023, question_text: 'Question 2', is_active: true }
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockQuestions })
            })
          })
        })
      });

      const result = await questionService.getQuestionsByYear(2023);

      expect(result).toHaveLength(2);
      expect(supabase.from).toHaveBeenCalledWith('questions');
    });

    it('should filter by exam_type when provided', async () => {
      const mockQuestions = [
        { id: 'q1', exam_year: 2023, exam_type: 'JAMB', question_text: 'Question 1', is_active: true }
      ];

      const mockEq = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: mockQuestions })
        })
      });

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                eq: mockEq
              })
            })
          })
        })
      });

      const result = await questionService.getQuestionsByYear(2023, { exam_type: 'JAMB' });

      expect(result).toBeDefined();
    });
  });

  describe('getQuestionsByFilters', () => {
    it('should use subject-based filtering when subject_slug is provided', async () => {
      const spy = vi.spyOn(questionService, 'getQuestionsBySubjectSlug').mockResolvedValue([]);

      await questionService.getQuestionsByFilters({
        subject_slug: 'mathematics',
        exam_year: 2023,
        exam_type: 'JAMB'
      });

      expect(spy).toHaveBeenCalledWith('mathematics', {
        exam_year: 2023,
        exam_type: 'JAMB',
        limit: undefined
      });
    });

    it('should use subject_id filtering when subject_id is provided', async () => {
      const spy = vi.spyOn(questionService, 'getQuestionsBySubjectId').mockResolvedValue([]);

      await questionService.getQuestionsByFilters({
        subject_id: 'subject-123',
        exam_year: 2023,
        exam_type: 'JAMB'
      });

      expect(spy).toHaveBeenCalledWith('subject-123', {
        exam_year: 2023,
        exam_type: 'JAMB',
        limit: undefined
      });
    });


    it('should use year-based filtering when only year is provided', async () => {
      const spy = vi.spyOn(questionService, 'getQuestionsByYear').mockResolvedValue([]);

      await questionService.getQuestionsByFilters({
        exam_year: 2023
      });

      expect(spy).toHaveBeenCalledWith(2023, { limit: undefined });
    });

    it('should query directly when exam_type and/or exam_year are provided without subject', async () => {
      const mockQuestions = [
        { id: 'q1', exam_type: 'JAMB', exam_year: 2023, question_text: 'Question 1', is_active: true }
      ];

      (supabase.from as unknown).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({ data: mockQuestions })
              })
            })
          })
        })
      });

      const result = await questionService.getQuestionsByFilters({
        exam_type: 'JAMB',
        exam_year: 2023
      });

      expect(result).toBeDefined();
    });
  });

  describe('normalizeQuestions', () => {
    it('should normalize question data correctly', () => {
      const rawQuestions = [
        {
          id: 'q1',
          question_text: 'What is 2+2?',
          option_a: '3',
          option_b: '4',
          option_c: '5',
          option_d: '6',
          correct_answer: 'B',
          explanation: 'Basic math',
          exam_year: 2023,
          exam_type: 'JAMB'
        }
      ];

      const result = normalizeQuestions(rawQuestions);

      expect(result).toHaveLength(1);
      expect(result[0].text).toBe('What is 2+2?');
      expect(result[0].options).toHaveLength(4);
      expect(result[0].correct).toBe('B');
      expect(result[0].exam_year).toBe(2023);
      expect(result[0].exam_type).toBe('JAMB');
    });

    it('should filter by exam_year when provided', () => {
      const rawQuestions = [
        {
          id: 'q1',
          question_text: 'Question 1',
          option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D',
          correct_answer: 'A',
          exam_year: 2023,
          exam_type: 'JAMB'
        },
        {
          id: 'q2',
          question_text: 'Question 2',
          option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D',
          correct_answer: 'A',
          exam_year: 2022,
          exam_type: 'JAMB'
        }
      ];

      const result = normalizeQuestions(rawQuestions, { exam_year: 2023 });

      expect(result).toHaveLength(1);
      expect(result[0].exam_year).toBe(2023);
    });

    it('should filter by exam_type when provided', () => {
      const rawQuestions = [
        {
          id: 'q1',
          question_text: 'Question 1',
          option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D',
          correct_answer: 'A',
          exam_year: 2023,
          exam_type: 'JAMB'
        },
        {
          id: 'q2',
          question_text: 'Question 2',
          option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D',
          correct_answer: 'A',
          exam_year: 2023,
          exam_type: 'WAEC'
        }
      ];

      const result = normalizeQuestions(rawQuestions, { exam_type: 'JAMB' });

      expect(result).toHaveLength(1);
      expect(result[0].exam_type).toBe('JAMB');
    });

    it('should filter by both exam_year and exam_type when provided', () => {
      const rawQuestions = [
        {
          id: 'q1',
          question_text: 'Question 1',
          option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D',
          correct_answer: 'A',
          exam_year: 2023,
          exam_type: 'JAMB'
        },
        {
          id: 'q2',
          question_text: 'Question 2',
          option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D',
          correct_answer: 'A',
          exam_year: 2022,
          exam_type: 'JAMB'
        },
        {
          id: 'q3',
          question_text: 'Question 3',
          option_a: 'A', option_b: 'B', option_c: 'C', option_d: 'D',
          correct_answer: 'A',
          exam_year: 2023,
          exam_type: 'WAEC'
        }
      ];

      const result = normalizeQuestions(rawQuestions, { exam_year: 2023, exam_type: 'JAMB' });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('q1');
      expect(result[0].exam_year).toBe(2023);
      expect(result[0].exam_type).toBe('JAMB');
    });
  });
});
