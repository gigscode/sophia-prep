import { supabase } from '../integrations/supabase/client';
import type { Subject, ExamType, SubjectCategory } from '../integrations/supabase/types';

export class SubjectService {
  /**
   * Get all subjects
   */
  async getAllSubjects(): Promise<Subject[]> {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      if (data && Array.isArray(data) && data.length > 0) return data;
    } catch (err) {
      // fallback to local subjects.json when Supabase is not reachable
      try {
        const res = await fetch('/data/subjects.json');
        if (res.ok) {
          const local = await res.json();
          return local as Subject[];
        }
      } catch (e) {
        // ignore and fallthrough
      }
    }

    return [];
  }

  /**
   * Get subjects filtered by exam type
   */
  async getSubjectsByExamType(examType: ExamType): Promise<Subject[]> {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('is_active', true)
      .or(`exam_type.eq.${examType},exam_type.eq.BOTH`)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch subjects by exam type: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get subjects by category
   */
  async getSubjectsByCategory(category: SubjectCategory): Promise<Subject[]> {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('is_active', true)
      .eq('subject_category', category)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch subjects by category: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get a single subject by ID
   */
  async getSubjectById(id: string): Promise<Subject | null> {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Not found
      }
      throw new Error(`Failed to fetch subject: ${error.message}`);
    }

    return data;
  }

  /**
   * Get a single subject by slug
   */
  async getSubjectBySlug(slug: string): Promise<Subject | null> {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw new Error(error.message);
      }

      if (data) return data;
    } catch (err) {
      // fallback to local subjects.json
      try {
        const res = await fetch('/data/subjects.json');
        if (res.ok) {
          const local = await res.json();
          const found = (local as Subject[]).find(s => s.slug === slug);
          return found || null;
        }
      } catch (e) {
        // ignore
      }
    }

    return null;
  }

  /**
   * Get mandatory subjects
   */
  async getMandatorySubjects(): Promise<Subject[]> {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('is_active', true)
      .eq('is_mandatory', true)
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch mandatory subjects: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get language subjects (Yoruba, Hausa, Igbo)
   */
  async getLanguageSubjects(): Promise<Subject[]> {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('is_active', true)
      .eq('subject_category', 'LANGUAGE')
      .order('sort_order', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch language subjects: ${error.message}`);
    }

    return data || [];
  }
}

export const subjectService = new SubjectService();
