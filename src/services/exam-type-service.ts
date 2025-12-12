/**
 * Exam Type Service
 * Handles operations related to exam types (JAMB, WAEC, etc.)
 */

import { supabase } from '../integrations/supabase/client';
import type { ExamTypeRecord } from '../types/database';

export class ExamTypeService {
  /**
   * Get all active exam types
   */
  async getAllExamTypes(): Promise<ExamTypeRecord[]> {
    try {
      const { data, error } = await supabase
        .from('exam_types')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching exam types:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Failed to fetch exam types:', err);
      return [];
    }
  }

  /**
   * Get exam type by slug
   */
  async getExamTypeBySlug(slug: string): Promise<ExamTypeRecord | null> {
    try {
      const { data, error } = await supabase
        .from('exam_types')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching exam type by slug:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Failed to fetch exam type by slug:', err);
      return null;
    }
  }

  /**
   * Get exam type by ID
   */
  async getExamTypeById(id: string): Promise<ExamTypeRecord | null> {
    try {
      const { data, error } = await supabase
        .from('exam_types')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching exam type by ID:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Failed to fetch exam type by ID:', err);
      return null;
    }
  }
}

export const examTypeService = new ExamTypeService();