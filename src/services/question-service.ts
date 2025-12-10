import { supabase } from '../integrations/supabase/client';
import type { Question, Subject } from '../integrations/supabase/types';

export class QuestionService {
  /**
   * Get questions by subject_id directly with optional filters
   * Queries questions using the subject_id column directly
   * Requirements: 3.1, 3.2, 4.4
   */
  async getQuestionsBySubjectId(
    subjectId: string,
    filters?: {
      exam_year?: number;
      exam_type?: 'JAMB' | 'WAEC';
      limit?: number;
    }
  ): Promise<Question[]> {
    // Build query with subject_id filter
    let q = supabase
      .from('questions')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    // Apply filters at database level
    if (filters?.exam_year) q = q.eq('exam_year', filters.exam_year);
    if (filters?.exam_type) q = q.eq('exam_type', filters.exam_type);
    if (filters?.limit) q = q.limit(filters.limit);

    const { data, error } = await q;

    if (error) {
      console.error('Error fetching questions by subject_id:', error);
      return [];
    }

    // Handle null/empty results gracefully
    return (data as Question[]) || [];
  }

  /**
   * Get questions by subject slug with optional filters
   * Now queries by subject_id directly instead of through topics
   * Maintains same method signature for backward compatibility
   * Requirements: 1.1, 1.2, 3.1, 3.2, 3.3
   */
  async getQuestionsBySubjectSlug(slug: string, filters?: { exam_year?: number; exam_type?: 'JAMB' | 'WAEC'; limit?: number }): Promise<Question[]> {
    // First, get the subject by slug
    const { data: subject, error: subjectError } = await supabase
      .from('subjects')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (subjectError) {
      console.error('Error fetching subject:', subjectError);
      return [];
    }

    if (!subject) {
      console.warn(`Subject not found for slug: ${slug}`);
      return [];
    }

    // Query questions directly by subject_id using the new method
    // This removes the topic lookup step and applies all filters in a single database query
    const questions = await this.getQuestionsBySubjectId((subject as Subject).id, filters);

    // FALLBACK: If no questions found with subject_id, try querying without subject_id filter
    // This handles cases where questions exist but haven't been associated with subjects yet
    if (questions.length === 0 && filters?.exam_type) {
      console.warn(`No questions found for subject ${slug} with subject_id. Trying fallback query by exam_type only.`);

      let fallbackQuery = supabase
        .from('questions')
        .select('*')
        .eq('exam_type', filters.exam_type)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (filters.exam_year) fallbackQuery = fallbackQuery.eq('exam_year', filters.exam_year);
      if (filters.limit) fallbackQuery = fallbackQuery.limit(filters.limit);

      const { data: fallbackData, error: fallbackError } = await fallbackQuery;

      if (fallbackError) {
        console.error('Error in fallback query:', fallbackError);
        return [];
      }

      console.log(`Fallback query returned ${fallbackData?.length || 0} questions`);
      return (fallbackData as Question[]) || [];
    }

    return questions;
  }

  /**
   * Get questions by year with optional exam_type filter
   * Requirements: 4.2
   */
  async getQuestionsByYear(year: number, filters?: { exam_type?: 'JAMB' | 'WAEC'; limit?: number }): Promise<Question[]> {
    let q = supabase
      .from('questions')
      .select('*')
      .eq('exam_year', year)
      .eq('is_active', true)
      .order('question_number', { ascending: true });

    if (filters?.exam_type) q = q.eq('exam_type', filters.exam_type);
    if (filters?.limit) q = q.limit(filters.limit);

    const { data } = await q;
    return (data as Question[]) || [];
  }

  /**
   * Get questions with combined filters (exam_type and/or exam_year)
   * Supports both subject_id and topic_id based queries for backward compatibility
   * Optimized to apply all filters at database level
   * Requirements: 3.3, 7.3
   */
  async getQuestionsByFilters(filters: {
    exam_type?: 'JAMB' | 'WAEC';
    exam_year?: number;
    subject_slug?: string;
    subject_id?: string;
    limit?: number
  }): Promise<Question[]> {
    // If subject_slug is provided, use subject-based filtering
    if (filters.subject_slug) {
      return this.getQuestionsBySubjectSlug(filters.subject_slug, {
        exam_year: filters.exam_year,
        exam_type: filters.exam_type,
        limit: filters.limit
      });
    }

    // If subject_id is provided, use direct subject_id filtering
    if (filters.subject_id) {
      return this.getQuestionsBySubjectId(filters.subject_id, {
        exam_year: filters.exam_year,
        exam_type: filters.exam_type,
        limit: filters.limit
      });
    }


    // If only year is provided, use year-based filtering
    if (filters.exam_year && !filters.exam_type) {
      return this.getQuestionsByYear(filters.exam_year, { limit: filters.limit });
    }

    // Build query with all applicable filters at database level
    let q = supabase
      .from('questions')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (filters.exam_type) q = q.eq('exam_type', filters.exam_type);
    if (filters.exam_year) q = q.eq('exam_year', filters.exam_year);
    if (filters.limit) q = q.limit(filters.limit);

    const { data } = await q;
    return (data as Question[]) || [];
  }
}

export const questionService = new QuestionService();

export type QuizQuestion = {
  id: string;
  text: string;
  options: { key: string; text: string }[];
  correct?: string;
  explanation?: string;
  exam_year?: number | null;
  exam_type?: 'JAMB' | 'WAEC' | null;
};

export function normalizeQuestions(rows: any[], filters?: { exam_year?: number | 'ALL'; exam_type?: 'JAMB' | 'WAEC' | 'ALL' }): QuizQuestion[] {
  const list: QuizQuestion[] = (rows || []).filter(r => !!r).map((r: unknown) => {
    const opts = [
      { key: 'A', text: r.option_a },
      { key: 'B', text: r.option_b },
      { key: 'C', text: r.option_c },
      { key: 'D', text: r.option_d },
    ].filter(o => !!o.text && String(o.text).trim().length > 0);
    let correct = r.correct_answer;
    if (correct && !['A', 'B', 'C', 'D'].includes(String(correct))) {
      const m = opts.find(o => String(o.text).trim().toLowerCase() === String(correct).trim().toLowerCase());
      correct = m?.key;
    }
    return {
      id: r.id,
      text: r.question_text || r.text || 'Question text missing',
      options: opts,
      correct: correct || undefined,
      explanation: r.explanation || undefined,
      exam_year: r.exam_year ?? null,
      exam_type: r.exam_type ?? null,
    };
  });
  const filtered = list.filter(q => (q.options?.length ?? 0) >= 2);
  const byYear = filters?.exam_year && filters.exam_year !== 'ALL' ? filtered.filter(q => q.exam_year === filters.exam_year) : filtered;
  const byType = filters?.exam_type && filters.exam_type !== 'ALL' ? byYear.filter(q => q.exam_type === filters.exam_type) : byYear;
  return byType;
}