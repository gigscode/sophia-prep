/**
 * Updated Question Service
 * Handles operations with the new normalized question structure
 */

import { supabase } from '../integrations/supabase/client';
import type { 
  QuestionRecord, 
  PracticeQuestionResponse, 
  CBTQuestionResponse,

} from '../types/database';

export class UpdatedQuestionService {
  /**
   * Get practice questions (can be from any exam type)
   */
  async getPracticeQuestions(
    subjectIds: string[],
    options?: {
      limit?: number;
    }
  ): Promise<PracticeQuestionResponse[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_practice_questions', {
          p_subject_ids: subjectIds,
          p_limit: options?.limit || 20,
          p_difficulty: null
        });

      if (error) {
        console.error('Error fetching practice questions:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Failed to fetch practice questions:', err);
      return [];
    }
  }

  /**
   * Get CBT exam questions (specific exam type only)
   */
  async getCBTExamQuestions(
    examTypeSlug: string,
    subjectIds: string[],
    options?: {
      limit?: number;
      examYear?: number; // NEW: Add exam year option
    }
  ): Promise<CBTQuestionResponse[]> {
    try {
      // If exam year is specified, use the year-specific function
      if (options?.examYear) {
        const { data, error } = await supabase
          .rpc('get_cbt_questions_by_year', {
            p_exam_type_slug: examTypeSlug,
            p_subject_ids: subjectIds,
            p_exam_year: options.examYear,
            p_requested_questions: options?.limit || null
          });

        if (error) {
          console.error('Error fetching CBT exam questions by year:', error);
          return [];
        }

        return data || [];
      }

      // Otherwise, use the general function (any year)
      const { data, error } = await supabase
        .rpc('get_cbt_exam_questions_with_validation', {
          p_exam_type_slug: examTypeSlug,
          p_subject_ids: subjectIds,
          p_requested_questions: options?.limit || null
        });

      if (error) {
        console.error('Error fetching CBT exam questions:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Failed to fetch CBT exam questions:', err);
      return [];
    }
  }

  /**
   * Get available exam years for CBT mode
   */
  async getAvailableExamYears(
    examTypeSlug: string,
    subjectIds?: string[]
  ): Promise<Array<{
    examYear: number;
    questionCount: number;
    subjectsWithQuestions: string[];
  }>> {
    try {
      const { data, error } = await supabase
        .rpc('get_available_exam_years', {
          p_exam_type_slug: examTypeSlug,
          p_subject_ids: subjectIds || null
        });

      if (error) {
        console.error('Error fetching available exam years:', error);
        return [];
      }

      return (data || []).map(item => ({
        examYear: item.exam_year,
        questionCount: item.question_count,
        subjectsWithQuestions: item.subjects_with_questions
      }));
    } catch (err) {
      console.error('Failed to fetch available exam years:', err);
      return [];
    }
  }

  /**
   * Get JAMB CBT questions with 4-subject validation
   */
  async getJAMBCBTQuestions(
    subjectIds: string[],
    options?: {
      questionsPerSubject?: number;
      totalQuestions?: number;
    }
  ): Promise<CBTQuestionResponse[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_jamb_cbt_questions', {
          p_subject_ids: subjectIds,
          p_questions_per_subject: options?.questionsPerSubject || 45,
          p_total_questions: options?.totalQuestions || null
        });

      if (error) {
        console.error('Error fetching JAMB CBT questions:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Failed to fetch JAMB CBT questions:', err);
      return [];
    }
  }

  /**
   * Get questions by subject ID (direct query)
   */
  async getQuestionsBySubjectId(
    subjectId: string,
    filters?: {
      examTypeId?: string;
      examYear?: number;
      limit?: number;
    }
  ): Promise<QuestionRecord[]> {
    try {
      let query = supabase
        .from('questions_new')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (filters?.examTypeId) {
        query = query.eq('exam_type_id', filters.examTypeId);
      }
      if (filters?.examYear) {
        query = query.eq('exam_year', filters.examYear);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching questions by subject ID:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Failed to fetch questions by subject ID:', err);
      return [];
    }
  }

  /**
   * Get questions by multiple subject IDs
   */
  async getQuestionsBySubjectIds(
    subjectIds: string[],
    filters?: {
      examTypeId?: string;
      examYear?: number;
      questionsPerSubject?: number;
    }
  ): Promise<QuestionRecord[]> {
    if (subjectIds.length === 0) return [];

    try {
      let query = supabase
        .from('questions_new')
        .select('*')
        .in('subject_id', subjectIds)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (filters?.examTypeId) {
        query = query.eq('exam_type_id', filters.examTypeId);
      }
      if (filters?.examYear) {
        query = query.eq('exam_year', filters.examYear);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching questions by subject IDs:', error);
        return [];
      }

      let questions = data || [];

      // If questionsPerSubject is specified, limit per subject
      if (filters?.questionsPerSubject) {
        const questionsBySubject = new Map<string, QuestionRecord[]>();
        
        // Group by subject
        questions.forEach(q => {
          if (!questionsBySubject.has(q.subject_id)) {
            questionsBySubject.set(q.subject_id, []);
          }
          questionsBySubject.get(q.subject_id)!.push(q);
        });

        // Take specified number from each subject
        const limitedQuestions: QuestionRecord[] = [];
        questionsBySubject.forEach(subjectQuestions => {
          const shuffled = subjectQuestions.sort(() => Math.random() - 0.5);
          limitedQuestions.push(...shuffled.slice(0, filters.questionsPerSubject));
        });

        questions = limitedQuestions;
      }

      // Shuffle final result
      return questions.sort(() => Math.random() - 0.5);
    } catch (err) {
      console.error('Failed to fetch questions by subject IDs:', err);
      return [];
    }
  }

  /**
   * Save quiz attempt with new structure
   */
  async saveQuizAttempt(attempt: {
    subjectId?: string;
    examTypeId?: string;
    quizMode: 'PRACTICE' | 'CBT_EXAM';
    totalQuestions: number;
    questionsRequested?: number;
    correctAnswers: number;
    incorrectAnswers: number;
    scorePercentage: number;
    timeTakenSeconds: number;
    timeLimitSeconds?: number;
    isAutoSubmitted?: boolean;
    examYear?: number;
    questionsData: any[];
  }): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .from('quiz_attempts_new')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          subject_id: attempt.subjectId,
          exam_type_id: attempt.examTypeId,
          quiz_mode: attempt.quizMode,
          total_questions: attempt.totalQuestions,
          questions_requested: attempt.questionsRequested,
          correct_answers: attempt.correctAnswers,
          incorrect_answers: attempt.incorrectAnswers,
          score_percentage: attempt.scorePercentage,
          time_taken_seconds: attempt.timeTakenSeconds,
          time_limit_seconds: attempt.timeLimitSeconds,
          is_auto_submitted: attempt.isAutoSubmitted || false,
          exam_year: attempt.examYear,
          questions_data: attempt.questionsData
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error saving quiz attempt:', error);
        return null;
      }

      return data.id;
    } catch (err) {
      console.error('Failed to save quiz attempt:', err);
      return null;
    }
  }
}

export const updatedQuestionService = new UpdatedQuestionService();