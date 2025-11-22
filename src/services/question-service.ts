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
    const topicIds = ((topics ?? []) as { id: string }[]).map(t => t.id);
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
  const list: QuizQuestion[] = (rows || []).filter(r => !!r).map((r: any) => {
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