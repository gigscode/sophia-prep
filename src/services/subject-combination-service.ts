import { supabase } from '../integrations/supabase/client';
import type { SubjectCombination, ExamType, CombinationType, Subject } from '../integrations/supabase/types';
import { subjectService } from './subject-service';

interface CombinationDefinition {
  mandatory: string[]; // Subject slugs
  optional: string[]; // Subject slugs
}

export class SubjectCombinationService {
  /**
   * Get the subject combination definition for a given type
   */
  getCombinationDefinition(combinationType: CombinationType): CombinationDefinition {
    switch (combinationType) {
      case 'SCIENCE':
        return {
          mandatory: ['english-language', 'mathematics', 'physics', 'chemistry', 'biology'],
          optional: ['further-mathematics', 'geography', 'food-nutrition']
        };
      case 'COMMERCIAL':
        return {
          mandatory: ['english-language', 'mathematics', 'commerce', 'accounting', 'economics'],
          optional: ['marketing', 'civic-education', 'geography']
        };
      case 'ARTS':
        return {
          mandatory: ['english-language', 'literature-in-english', 'government', 'crs-irs'],
          optional: ['music', 'geography', 'history', 'civic-education']
        };
      case 'CUSTOM':
        return {
          mandatory: ['english-language'],
          optional: []
        };
    }
  }

  /**
   * Get subjects for a combination type
   */
  async getSubjectsForCombination(
    combinationType: CombinationType,
    examType: ExamType
  ): Promise<{ mandatory: Subject[]; optional: Subject[] }> {
    const definition = this.getCombinationDefinition(combinationType);
    const allSubjects = await subjectService.getSubjectsByExamType(examType);

    const mandatory = allSubjects.filter(s => definition.mandatory.includes(s.slug));
    const optional = allSubjects.filter(s => definition.optional.includes(s.slug));

    return { mandatory, optional };
  }

  /**
   * Validate a subject combination
   */
  async validateCombination(
    combinationType: CombinationType,
    examType: ExamType,
    selectedSubjectIds: string[]
  ): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];
    const definition = this.getCombinationDefinition(combinationType);
    const allSubjects = await subjectService.getSubjectsByExamType(examType);

    // Get selected subjects
    const selectedSubjects = allSubjects.filter(s => selectedSubjectIds.includes(s.id));
    const selectedSlugs = selectedSubjects.map(s => s.slug);

    // Check mandatory subjects
    for (const mandatorySlug of definition.mandatory) {
      if (!selectedSlugs.includes(mandatorySlug)) {
        const subject = allSubjects.find(s => s.slug === mandatorySlug);
        errors.push(`Missing mandatory subject: ${subject?.name || mandatorySlug}`);
      }
    }

    // For JAMB, must have exactly 4 subjects
    if (examType === 'JAMB' && selectedSubjectIds.length !== 4) {
      errors.push(`JAMB requires exactly 4 subjects, but ${selectedSubjectIds.length} were selected`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Save a subject combination for a user
   */
  async saveUserCombination(
    userId: string,
    examType: ExamType,
    combinationType: CombinationType,
    subjectIds: string[]
  ): Promise<SubjectCombination> {
    // Validate first
    const validation = await this.validateCombination(combinationType, examType, subjectIds);
    if (!validation.valid) {
      throw new Error(`Invalid combination: ${validation.errors.join(', ')}`);
    }

    const { data, error } = await supabase
      .from('subject_combinations')
      .insert({
        user_id: userId,
        exam_type: examType,
        combination_type: combinationType,
        subjects: subjectIds
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save subject combination: ${error.message}`);
    }

    return data;
  }

  /**
   * Get user's subject combinations
   */
  async getUserCombinations(userId: string): Promise<SubjectCombination[]> {
    const { data, error } = await supabase
      .from('subject_combinations')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch user combinations: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Delete a subject combination
   */
  async deleteCombination(combinationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('subject_combinations')
      .delete()
      .eq('id', combinationId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to delete combination: ${error.message}`);
    }
  }
}

export const subjectCombinationService = new SubjectCombinationService();
