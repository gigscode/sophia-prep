import { supabase } from '../integrations/supabase/client';
import type { Subject, SubjectCategory, ExamType } from '../integrations/supabase/types';

export type SubjectFilters = {
  search?: string;
  category?: SubjectCategory | 'all';
  examType?: ExamType | 'all';
  status?: 'active' | 'inactive' | 'all';
};

export type SubjectInput = {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color_theme?: string;
  exam_type: ExamType;
  subject_category: SubjectCategory;
  is_active?: boolean;
  sort_order?: number;
};

export class AdminSubjectService {
  async getAllSubjects(filters?: SubjectFilters): Promise<Subject[]> {
    try {
      let query = supabase.from('subjects').select('*');

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.category && filters.category !== 'all') {
        query = query.eq('subject_category', filters.category);
      }

      if (filters?.examType && filters.examType !== 'all') {
        query = query.or(`exam_type.eq.${filters.examType},exam_type.eq.BOTH`);
      }

      if (filters?.status === 'active') {
        query = query.eq('is_active', true);
      } else if (filters?.status === 'inactive') {
        query = query.eq('is_active', false);
      }

      query = query.order('sort_order', { ascending: true });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching subjects:', error);
        return [];
      }

      return (data as Subject[]) || [];
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
      return [];
    }
  }

  async getSubjectById(id: string): Promise<Subject | null> {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching subject:', error);
        return null;
      }

      return (data as Subject) || null;
    } catch (err) {
      console.error('Failed to fetch subject:', err);
      return null;
    }
  }

  async createSubject(input: SubjectInput): Promise<Subject | null> {
    try {
      const { data, error } = await (supabase
        .from('subjects') as any)
        .insert([input])
        .select()
        .single();

      if (error) {
        console.error('Error creating subject:', error);
        return null;
      }

      return (data as Subject) || null;
    } catch (err) {
      console.error('Failed to create subject:', err);
      return null;
    }
  }

  async updateSubject(id: string, updates: Partial<SubjectInput>): Promise<boolean> {
    try {
      const { error } = await (supabase
        .from('subjects') as any)
        .update(updates)
        .eq('id', id);

      if (error) {
        console.error('Error updating subject:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Failed to update subject:', err);
      return false;
    }
  }

  async deleteSubject(id: string): Promise<boolean> {
    try {
      // Check if subject has questions
      const { count } = await supabase
        .from('questions')
        .select('id', { count: 'exact', head: true })
        .eq('subject_id', id);

      if (count && count > 0) {
        throw new Error('Cannot delete subject with existing questions');
      }

      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting subject:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Failed to delete subject:', err);
      return false;
    }
  }

  async bulkUpdateStatus(ids: string[], isActive: boolean): Promise<boolean> {
    try {
      const { error } = await (supabase
        .from('subjects') as any)
        .update({ is_active: isActive })
        .in('id', ids);

      if (error) {
        console.error('Error bulk updating subjects:', error);
        return false;
      }

      return true;
    } catch (err) {
      console.error('Failed to bulk update subjects:', err);
      return false;
    }
  }
}

export const adminSubjectService = new AdminSubjectService();

