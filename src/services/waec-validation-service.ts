/**
 * WAEC Validation Service
 * Handles WAEC-specific subject selection validation rules
 */

import { updatedSubjectService } from './updated-subject-service';
import type { SubjectWithDetails } from '../types/database';

export interface WAECValidationResult {
  isValid: boolean;
  message: string;
  subjectCount: number;
  missingRequirements: string[];
  suggestions: string[];
  selectedSubjectDetails: SubjectWithDetails[];
  categoryDistribution: {
    [category: string]: number;
  };
}

export class WAECValidationService {
  /**
   * Validate WAEC subject selection
   * Requirements: Flexible 6-9 subjects
   */
  async validateWAECSubjects(subjectIds: string[]): Promise<WAECValidationResult> {
    try {
      // Get subject details for validation
      const selectedSubjects = await updatedSubjectService.getSubjectsByIds(subjectIds);
      
      const result: WAECValidationResult = {
        isValid: false,
        message: '',
        subjectCount: subjectIds.length,
        missingRequirements: [],
        suggestions: [],
        selectedSubjectDetails: selectedSubjects,
        categoryDistribution: {}
      };

      // Calculate category distribution
      selectedSubjects.forEach(subject => {
        const category = subject.category_name || 'General';
        result.categoryDistribution[category] = (result.categoryDistribution[category] || 0) + 1;
      });

      // Validate subject count
      if (subjectIds.length === 0) {
        result.message = 'Please select subjects for your WAEC examination.';
        result.missingRequirements.push('Select at least 6 subjects');
        result.suggestions.push('Choose subjects relevant to your career goals');
        result.suggestions.push('Include core subjects like English and Mathematics');
        return result;
      }

      if (subjectIds.length < 6) {
        const remaining = 6 - subjectIds.length;
        result.message = `WAEC requires at least 6 subjects. You need ${remaining} more subject${remaining !== 1 ? 's' : ''}.`;
        result.missingRequirements.push(`Select ${remaining} more subject${remaining !== 1 ? 's' : ''}`);
        result.suggestions.push('Consider adding core subjects like English and Mathematics');
        result.suggestions.push('Choose subjects that align with your intended field of study');
        return result;
      }

      if (subjectIds.length > 9) {
        const excess = subjectIds.length - 9;
        result.message = `WAEC allows maximum 9 subjects. Please remove ${excess} subject${excess !== 1 ? 's' : ''}.`;
        result.missingRequirements.push(`Remove ${excess} subject${excess !== 1 ? 's' : ''}`);
        result.suggestions.push('Keep your strongest subjects');
        result.suggestions.push('Focus on subjects required for your career path');
        return result;
      }

      // Check for recommended core subjects
      const coreSubjects = ['english', 'mathematics'];
      const selectedSlugs = selectedSubjects.map(s => s.slug);
      const missingCore = coreSubjects.filter(core => !selectedSlugs.includes(core));
      
      if (missingCore.length > 0) {
        result.suggestions.push(`Consider adding ${missingCore.join(' and ')} as they are commonly required`);
      }

      // Check for balanced subject distribution
      const categoryCount = Object.keys(result.categoryDistribution).length;
      if (categoryCount === 1) {
        result.suggestions.push('Consider adding subjects from different categories for a more balanced selection');
      }

      // All validations passed
      result.isValid = true;
      result.message = `Excellent! You have selected ${subjectIds.length} subjects for WAEC.`;
      
      // Add positive feedback based on selection
      if (subjectIds.length >= 8) {
        result.message += ' This comprehensive selection gives you many opportunities.';
      } else if (subjectIds.length === 7) {
        result.message += ' This is a well-balanced selection.';
      } else {
        result.message += ' This meets the minimum requirements.';
      }
      
      return result;

    } catch (error) {
      console.error('WAEC validation error:', error);
      return {
        isValid: false,
        message: 'Validation error occurred. Please try again.',
        subjectCount: subjectIds.length,
        missingRequirements: ['Validation failed'],
        suggestions: ['Please refresh and try again'],
        selectedSubjectDetails: [],
        categoryDistribution: {}
      };
    }
  }

  /**
   * Get WAEC subject selection recommendations
   */
  async getWAECRecommendations(currentSubjects: string[] = []): Promise<{
    coreSubjects: SubjectWithDetails[];
    recommendedByCategory: {
      [category: string]: SubjectWithDetails[];
    };
    popularCombinations: {
      name: string;
      subjects: string[];
      description: string;
      careerPaths: string[];
    }[];
  }> {
    try {
      const allWAECSubjects = await updatedSubjectService.getSubjectsByExamType('waec');
      
      // Identify core subjects
      const coreSubjectSlugs = ['english', 'mathematics'];
      const coreSubjects = allWAECSubjects.filter(s => coreSubjectSlugs.includes(s.slug));
      
      // Group subjects by category
      const subjectsByCategory: { [category: string]: SubjectWithDetails[] } = {};
      allWAECSubjects.forEach(subject => {
        const category = subject.category_name || 'General';
        if (!subjectsByCategory[category]) {
          subjectsByCategory[category] = [];
        }
        subjectsByCategory[category].push(subject);
      });

      // Popular WAEC combinations
      const popularCombinations = [
        {
          name: 'Science Track',
          subjects: ['english', 'mathematics', 'physics', 'chemistry', 'biology', 'further-mathematics'],
          description: 'Comprehensive science preparation',
          careerPaths: ['Medicine', 'Engineering', 'Pharmacy', 'Science Research']
        },
        {
          name: 'Commercial Track',
          subjects: ['english', 'mathematics', 'economics', 'commerce', 'accounting', 'business-studies'],
          description: 'Business and commerce focused',
          careerPaths: ['Business Administration', 'Accounting', 'Economics', 'Banking']
        },
        {
          name: 'Arts Track',
          subjects: ['english', 'literature', 'government', 'history', 'geography', 'crs'],
          description: 'Humanities and social sciences',
          careerPaths: ['Law', 'Mass Communication', 'International Relations', 'Education']
        },
        {
          name: 'Balanced Mix',
          subjects: ['english', 'mathematics', 'physics', 'chemistry', 'economics', 'government', 'literature'],
          description: 'Versatile combination for multiple career paths',
          careerPaths: ['Multiple Options', 'Flexible Career Choices']
        }
      ];

      return {
        coreSubjects,
        recommendedByCategory: subjectsByCategory,
        popularCombinations
      };

    } catch (error) {
      console.error('Failed to get WAEC recommendations:', error);
      return {
        coreSubjects: [],
        recommendedByCategory: {},
        popularCombinations: []
      };
    }
  }

  /**
   * Real-time validation for UI feedback
   */
  validateInRealTime(subjectIds: string[], allSubjects: SubjectWithDetails[]): {
    status: 'incomplete' | 'invalid' | 'valid';
    message: string;
    progress: number;
    nextStep?: string;
    categoryBalance?: string;
  } {
    const count = subjectIds.length;
    const selectedSubjects = allSubjects.filter(s => subjectIds.includes(s.id));
    
    // Calculate category distribution
    const categories = new Set(selectedSubjects.map(s => s.category_name).filter(Boolean));
    const categoryCount = categories.size;

    if (count === 0) {
      return {
        status: 'incomplete',
        message: 'Select subjects to begin',
        progress: 0,
        nextStep: 'Start with core subjects like English and Mathematics'
      };
    }

    if (count < 6) {
      const remaining = 6 - count;
      const progress = (count / 6) * 100;
      
      return {
        status: 'incomplete',
        message: `${remaining} more subject${remaining !== 1 ? 's' : ''} needed`,
        progress,
        nextStep: `Select ${remaining} more subject${remaining !== 1 ? 's' : ''} to meet minimum requirement`,
        categoryBalance: categoryCount > 1 ? 'Good category balance' : 'Consider subjects from different categories'
      };
    }

    if (count > 9) {
      const excess = count - 9;
      return {
        status: 'invalid',
        message: `Remove ${excess} subject${excess !== 1 ? 's' : ''}`,
        progress: 100,
        nextStep: `Deselect ${excess} subject${excess !== 1 ? 's' : ''} to stay within limit`,
        categoryBalance: `${categoryCount} categories represented`
      };
    }

    // Valid range (6-9 subjects)
    const coreSubjects = ['english', 'mathematics'];
    const selectedSlugs = selectedSubjects.map(s => s.slug);
    const missingCore = coreSubjects.filter(core => !selectedSlugs.includes(core));
    
    let message = `Great! ${count} subjects selected`;
    let nextStep: string | undefined;
    
    if (missingCore.length > 0) {
      message += ` (consider adding ${missingCore.join(' and ')})`;
      nextStep = `Add ${missingCore.join(' and ')} for better opportunities`;
    }

    return {
      status: 'valid',
      message,
      progress: 100,
      nextStep,
      categoryBalance: `${categoryCount} categories - ${categoryCount >= 2 ? 'Well balanced' : 'Consider more variety'}`
    };
  }

  /**
   * Get subject recommendations based on career path
   */
  getSubjectsByCareerPath(careerPath: string): string[] {
    const careerMappings: { [key: string]: string[] } = {
      'medicine': ['english', 'mathematics', 'physics', 'chemistry', 'biology'],
      'engineering': ['english', 'mathematics', 'physics', 'chemistry', 'further-mathematics'],
      'law': ['english', 'literature', 'government', 'history', 'economics'],
      'business': ['english', 'mathematics', 'economics', 'commerce', 'accounting'],
      'education': ['english', 'mathematics', 'education', 'any-teaching-subject'],
      'arts': ['english', 'literature', 'government', 'history', 'crs', 'fine-arts'],
      'science': ['english', 'mathematics', 'physics', 'chemistry', 'biology', 'geography']
    };

    return careerMappings[careerPath.toLowerCase()] || [];
  }
}

export const waecValidationService = new WAECValidationService();