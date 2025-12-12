/**
 * Updated Subject Service
 * Handles operations with the new normalized subject structure
 */

import { supabase } from '../integrations/supabase/client';
import type { 
  SubjectRecord, 
  SubjectWithDetails, 
  ExamTypeRecord,
  SubjectCategoryRecord 
} from '../types/database';

export class UpdatedSubjectService {
  /**
   * Get all subjects with their category and exam type details
   */
  async getAllSubjectsWithDetails(): Promise<SubjectWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('subjects_with_details')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching subjects with details:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Failed to fetch subjects with details:', err);
      return [];
    }
  }

  /**
   * Get subjects by exam type slug
   */
  async getSubjectsByExamType(examTypeSlug: string): Promise<SubjectWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('subjects_with_details')
        .select('*')
        .contains('exam_type_slugs', [examTypeSlug])
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching subjects by exam type:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Failed to fetch subjects by exam type:', err);
      return [];
    }
  }

  /**
   * Get subjects by category slug
   */
  async getSubjectsByCategory(categorySlug: string): Promise<SubjectWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('subjects_with_details')
        .select('*')
        .eq('category_slug', categorySlug)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching subjects by category:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Failed to fetch subjects by category:', err);
      return [];
    }
  }

  /**
   * Get subject by slug with details
   */
  async getSubjectBySlug(slug: string): Promise<SubjectWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('subjects_with_details')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        console.error('Error fetching subject by slug:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Failed to fetch subject by slug:', err);
      return null;
    }
  }

  /**
   * Get mandatory subjects
   */
  async getMandatorySubjects(): Promise<SubjectWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('subjects_with_details')
        .select('*')
        .eq('is_mandatory', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching mandatory subjects:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Failed to fetch mandatory subjects:', err);
      return [];
    }
  }

  /**
   * Get subjects for JAMB (must be exactly 4 including English)
   */
  async getJAMBSubjects(): Promise<SubjectWithDetails[]> {
    try {
      const { data, error } = await supabase
        .from('subjects_with_details')
        .select('*')
        .contains('exam_type_slugs', ['jamb'])
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching JAMB subjects:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Failed to fetch JAMB subjects:', err);
      return [];
    }
  }

  /**
   * Validate JAMB subject selection (English + 3 others = 4 total)
   */
  async validateJAMBSubjects(subjectIds: string[]): Promise<{
    isValid: boolean;
    message: string;
    hasEnglish: boolean;
    subjectCount: number;
  }> {
    try {
      const { data, error } = await supabase
        .rpc('validate_jamb_subject_selection', {
          p_selected_subject_ids: subjectIds
        });

      if (error) {
        console.error('Error validating JAMB subjects:', error);
        return {
          isValid: false,
          message: 'Validation error occurred',
          hasEnglish: false,
          subjectCount: subjectIds.length
        };
      }

      const result = data[0];
      return {
        isValid: result.is_valid,
        message: result.message,
        hasEnglish: result.has_english,
        subjectCount: result.subject_count
      };
    } catch (err) {
      console.error('Failed to validate JAMB subjects:', err);
      return {
        isValid: false,
        message: 'Validation failed',
        hasEnglish: false,
        subjectCount: subjectIds.length
      };
    }
  }

  /**
   * Get subjects by multiple IDs
   */
  async getSubjectsByIds(ids: string[]): Promise<SubjectWithDetails[]> {
    if (ids.length === 0) return [];

    try {
      const { data, error } = await supabase
        .from('subjects_with_details')
        .select('*')
        .in('id', ids)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching subjects by IDs:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Failed to fetch subjects by IDs:', err);
      return [];
    }
  }

  /**
   * Get English subject (mandatory for JAMB)
   */
  async getEnglishSubject(): Promise<SubjectWithDetails | null> {
    try {
      const { data, error } = await supabase
        .from('subjects_with_details')
        .select('*')
        .eq('slug', 'english')
        .single();

      if (error) {
        console.error('Error fetching English subject:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Failed to fetch English subject:', err);
      return null;
    }
  }
}

export const updatedSubjectService = new UpdatedSubjectService();