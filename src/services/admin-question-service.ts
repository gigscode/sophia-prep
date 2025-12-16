import { supabase } from '../integrations/supabase/client';
import type { Question } from '../integrations/supabase/types';


export type QuestionFilters = {
  search?: string;
  subjectId?: string;
  topicId?: string;
  examType?: 'JAMB' | 'all';
  year?: number | 'all';
  status?: 'active' | 'inactive' | 'all';
};

export type QuestionInput = {
  subject_id?: string | null;
  topic_id?: string | null;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation?: string | null;
  exam_year?: number | null;
  exam_type?: 'JAMB' | null;
  question_number?: number | null;
  is_active?: boolean;
};

export type ImportResult = {
  success: number;
  failed: number;
  errors: string[];
};

export class AdminQuestionService {
  /**
   * Validates a question input for import/creation
   * @param question The question input to validate
   * @param subjectSlug Optional subject slug for content validation
   * @returns Object with isValid flag and array of error messages
   */
  async validateQuestionInput(
    question: QuestionInput, 
    subjectSlug?: string
  ): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    const questionPreview = question.question_text?.substring(0, 50) || 'Unknown question';

    // Validate that subject_id is provided
    if (!question.subject_id) {
      errors.push(`subject_id must be provided. Question: "${questionPreview}..."`);
    }

    // Validate required fields
    if (!question.question_text?.trim()) {
      errors.push(`question_text is required. Question: "${questionPreview}..."`);
    }
    if (!question.option_a?.trim()) {
      errors.push(`option_a is required. Question: "${questionPreview}..."`);
    }
    if (!question.option_b?.trim()) {
      errors.push(`option_b is required. Question: "${questionPreview}..."`);
    }
    if (!question.option_c?.trim()) {
      errors.push(`option_c is required. Question: "${questionPreview}..."`);
    }
    if (!question.option_d?.trim()) {
      errors.push(`option_d is required. Question: "${questionPreview}..."`);
    }
    if (!question.correct_answer) {
      errors.push(`correct_answer is required. Question: "${questionPreview}..."`);
    } else if (!['A', 'B', 'C', 'D'].includes(question.correct_answer)) {
      errors.push(`correct_answer must be A, B, C, or D (got "${question.correct_answer}"). Question: "${questionPreview}..."`);
    }

    // Content validation disabled - when user selects a subject, accept it as is
    // The user has manually chosen the subject, so we trust their decision

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  async getAllQuestions(filters?: QuestionFilters, page = 1, limit = 50): Promise<{ questions: Question[]; total: number }> {
    try {
      let query = supabase.from('questions').select('*', { count: 'exact' });

      if (filters?.search) {
        query = query.ilike('question_text', `%${filters.search}%`);
      }

      if (filters?.subjectId) {
        query = query.eq('subject_id', filters.subjectId);
      }

      if (filters?.topicId) {
        query = query.eq('topic_id', filters.topicId);
      }

      if (filters?.examType && filters.examType !== 'all') {
        query = query.eq('exam_type', filters.examType);
      }

      if (filters?.year && filters.year !== 'all') {
        query = query.eq('exam_year', filters.year);
      }

      if (filters?.status === 'active') {
        query = query.eq('is_active', true);
      } else if (filters?.status === 'inactive') {
        query = query.eq('is_active', false);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to).order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching questions:', error);
        return { questions: [], total: 0 };
      }

      return { questions: (data as Question[]) || [], total: count || 0 };
    } catch (err) {
      console.error('Failed to fetch questions:', err);
      return { questions: [], total: 0 };
    }
  }

  async getQuestionById(id: string): Promise<Question | null> {
    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching question:', error);
        return null;
      }

      return (data as Question) || null;
    } catch (err) {
      console.error('Failed to fetch question:', err);
      return null;
    }
  }

  async createQuestion(input: QuestionInput, subjectSlug?: string): Promise<Question | null> {
    try {
      // Validate input before creating
      const validation = await this.validateQuestionInput(input, subjectSlug);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
      }

      // Log warnings if any
      if (validation.warnings.length > 0) {
        console.warn('Question content warnings:', validation.warnings);
      }

      const { data, error } = await (supabase
        .from('questions') as any)
        .insert([input])
        .select()
        .single();

      if (error) {
        console.error('Error creating question:', error);
        throw error;
      }

      return (data as Question) || null;
    } catch (err) {
      console.error('Failed to create question:', err);
      throw err;
    }
  }

  async updateQuestion(id: string, updates: Partial<QuestionInput>): Promise<boolean> {
    try {
      const { error } = await (supabase
        .from('questions') as any)
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating question:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Failed to update question:', err);
      return false;
    }
  }

  async deleteQuestion(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting question:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Failed to delete question:', err);
      return false;
    }
  }

  async bulkDelete(ids: string[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .in('id', ids);

      if (error) {
        console.error('Error bulk deleting questions:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Failed to bulk delete questions:', err);
      return false;
    }
  }

  async importQuestions(questions: QuestionInput[], subjectSlug?: string): Promise<ImportResult> {
    const result: ImportResult = { success: 0, failed: 0, errors: [] };

    for (const question of questions) {
      try {
        // Validate question input with content validation
        const validation = await this.validateQuestionInput(question, subjectSlug);
        if (!validation.isValid) {
          result.failed++;
          result.errors.push(...validation.errors);
          continue;
        }

        // Add warnings to errors array for user visibility
        if (validation.warnings.length > 0) {
          result.errors.push(...validation.warnings);
        }

        await this.createQuestion(question, subjectSlug);
        result.success++;
      } catch (err: any) {
        result.failed++;
        const questionPreview = question.question_text?.substring(0, 30) || 'Unknown question';
        result.errors.push(`Failed to import question: "${questionPreview}...". Error: ${err.message || JSON.stringify(err)}`);
      }
    }

    return result;
  }

  async getQuestionStatistics(): Promise<{
    total: number;
    bySubject: Record<string, number>;
    byExamType: Record<string, number>;
    byYear: Record<number, number>;
  }> {
    try {
      // Get total count
      const { count: total } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true });

      // Get all questions for statistics
      const { data: questions } = await supabase
        .from('questions')
        .select('exam_type, exam_year');

      const byExamType: Record<string, number> = { JAMB: 0 };
      const byYear: Record<number, number> = {};

      questions?.forEach((q: any) => {
        if (q.exam_type) byExamType[q.exam_type]++;
        if (q.exam_year) byYear[q.exam_year] = (byYear[q.exam_year] || 0) + 1;
      });

      return {
        total: total || 0,
        bySubject: {}, // Would need to join with topics and subjects
        byExamType,
        byYear,
      };
    } catch (err) {
      console.error('Failed to get question statistics:', err);
      return {
        total: 0,
        bySubject: {},
        byExamType: {},
        byYear: {},
      };
    }
  }
}

export const adminQuestionService = new AdminQuestionService();

