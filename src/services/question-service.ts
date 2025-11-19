import { supabase } from '../integrations/supabase/client';
import type { Question, Subject, Topic } from '../integrations/supabase/types';

export class QuestionService {
  async getQuestionsBySubjectSlug(slug: string, filters?: { exam_year?: number; exam_type?: 'JAMB' | 'WAEC'; difficulty_level?: 'EASY' | 'MEDIUM' | 'HARD'; limit?: number }): Promise<Question[]> {
    const { data: subject } = await supabase
      .from('subjects')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    if (!subject) return [];

    const { data: topics } = await supabase
      .from('topics')
      .select('id')
      .eq('subject_id', (subject as Subject).id)
      .eq('is_active', true);
    const topicIds = (topics || []).map(t => t.id);
    if (topicIds.length === 0) return [];

    let q = supabase
      .from('questions')
      .select('*')
      .in('topic_id', topicIds)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (filters?.exam_year) q = q.eq('exam_year', filters.exam_year);
    if (filters?.exam_type) q = q.eq('exam_type', filters.exam_type);
    if (filters?.difficulty_level) q = q.eq('difficulty_level', filters.difficulty_level);
    if (filters?.limit) q = q.limit(filters.limit);

    const { data } = await q;
    return (data as Question[]) || [];
  }

  async getPastQuestions(slug: string, exam_year: number, exam_type: 'JAMB' | 'WAEC', limit = 50): Promise<Question[]> {
    return this.getQuestionsBySubjectSlug(slug, { exam_year, exam_type, limit });
  }

  async getQuestionsByTopic(topicId: string, filters?: { exam_year?: number; exam_type?: 'JAMB' | 'WAEC'; difficulty_level?: 'EASY' | 'MEDIUM' | 'HARD'; limit?: number }): Promise<Question[]> {
    let q = supabase
      .from('questions')
      .select('*')
      .eq('topic_id', topicId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (filters?.exam_year) q = q.eq('exam_year', filters.exam_year);
    if (filters?.exam_type) q = q.eq('exam_type', filters.exam_type);
    if (filters?.difficulty_level) q = q.eq('difficulty_level', filters.difficulty_level);
    if (filters?.limit) q = q.limit(filters.limit);
    const { data } = await q;
    return (data as Question[]) || [];
  }
}

export const questionService = new QuestionService();