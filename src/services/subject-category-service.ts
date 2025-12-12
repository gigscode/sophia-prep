/**
 * Subject Category Service
 * Handles operations related to subject categories (Science, Arts, Commercial, etc.)
 */

import { supabase } from '../integrations/supabase/client';
import type { SubjectCategoryRecord } from '../types/database';

export class SubjectCategoryService {
  /**
   * Get all active subject categories
   */
  async getAllCategories(): Promise<SubjectCategoryRecord[]> {
    try {
      const { data, error } = await supabase
        .from('subject_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('Error fetching subject categories:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Failed to fetch subject categories:', err);
      return [];
    }
  }

  /**
   * Get category by slug
   */
  async getCategoryBySlug(slug: string): Promise<SubjectCategoryRecord | null> {
    try {
      const { data, error } = await supabase
        .from('subject_categories')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching category by slug:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Failed to fetch category by slug:', err);
      return null;
    }
  }

  /**
   * Get category by ID
   */
  async getCategoryById(id: string): Promise<SubjectCategoryRecord | null> {
    try {
      const { data, error } = await supabase
        .from('subject_categories')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching category by ID:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Failed to fetch category by ID:', err);
      return null;
    }
  }
}

export const subjectCategoryService = new SubjectCategoryService();