import { supabase } from '../integrations/supabase/client';
import type { Subject, ExamType, SubjectCategory } from '../integrations/supabase/types';

export class SubjectService {
  /**
   * Get all subjects from Supabase
   */
  async getAllSubjects(): Promise<Subject[]> {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

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

  async getSubjectsByExamType(examType: ExamType): Promise<Subject[]> {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('is_active', true)
        .or(`exam_type.eq.${examType},exam_type.eq.BOTH`)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching subjects by exam type:', error);
        return [];
      }

      return (data as Subject[]) || [];
    } catch (err) {
      console.error('Failed to fetch subjects by exam type:', err);
      return [];
    }
  }

  async getSubjectsByCategory(category: SubjectCategory): Promise<Subject[]> {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('is_active', true)
        .eq('subject_category', category)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching subjects by category:', error);
        return [];
      }

      return (data as Subject[]) || [];
    } catch (err) {
      console.error('Failed to fetch subjects by category:', err);
      return [];
    }
  }

  async getSubjectById(id: string): Promise<Subject | null> {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching subject by ID:', error);
        return null;
      }

      return (data as Subject) || null;
    } catch (err) {
      console.error('Failed to fetch subject by ID:', err);
      return null;
    }
  }

  async getSubjectBySlug(slug: string): Promise<Subject | null> {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching subject by slug:', error);
        return null;
      }

      return (data as Subject) || null;
    } catch (err) {
      console.error('Failed to fetch subject by slug:', err);
      return null;
    }
  }

  async getMandatorySubjects(): Promise<Subject[]> {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('is_active', true)
        .eq('is_mandatory', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching mandatory subjects:', error);
        return [];
      }

      return (data as Subject[]) || [];
    } catch (err) {
      console.error('Failed to fetch mandatory subjects:', err);
      return [];
    }
  }

  async getLanguageSubjects(): Promise<Subject[]> {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('is_active', true)
        .eq('subject_category', 'LANGUAGE')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching language subjects:', error);
        return [];
      }

      return (data as Subject[]) || [];
    } catch (err) {
      console.error('Failed to fetch language subjects:', err);
      return [];
    }
  }
}

export const subjectService = new SubjectService();
