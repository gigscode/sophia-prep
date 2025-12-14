import { supabase } from '../integrations/supabase/client';

export interface ExamItem {
  id: string;
  subject_id: string | null;
  topic_id: string | null;
  item_type: 'ESSAY' | 'PRACTICAL';
  prompt: string;
  expected_structure: string | null;
  mark_weighting: number;
  time_minutes: number;
  bloom_level: string | null;
  related_past: any[];
  exam_types: string[];
  references: any[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export class ExamItemService {
  async getExamItemsBySubjectSlug(slug: string, filters?: { item_type?: 'ESSAY' | 'PRACTICAL'; exam_type?: 'JAMB'; limit?: number }): Promise<ExamItem[]> {
    const { data: subject } = await supabase
      .from('subjects')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();
    if (!subject) return [];

    let q = supabase
      .from('exam_items')
      .select('*')
      .eq('subject_id', subject.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (filters?.item_type) q = q.eq('item_type', filters.item_type);
    if (filters?.exam_type) q = q.contains('exam_types', [filters.exam_type]);
    if (filters?.limit) q = q.limit(filters.limit);
    const { data } = await q;
    return (data as ExamItem[]) || [];
  }

  async getExamItemsByTopic(topicId: string, filters?: { item_type?: 'ESSAY' | 'PRACTICAL'; exam_type?: 'JAMB'; limit?: number }): Promise<ExamItem[]> {
    let q = supabase
      .from('exam_items')
      .select('*')
      .eq('topic_id', topicId)
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (filters?.item_type) q = q.eq('item_type', filters.item_type);
    if (filters?.exam_type) q = q.contains('exam_types', [filters.exam_type]);
    if (filters?.limit) q = q.limit(filters.limit);
    const { data } = await q;
    return (data as ExamItem[]) || [];
  }
}

export const examItemService = new ExamItemService();