/**
 * JAMB Validation Service
 * Handles JAMB-specific subject selection validation rules
 */

import { updatedSubjectService } from './updated-subject-service';
import type { SubjectWithDetails } from '../types/database';

export interface JAMBValidationResult {
  isValid: boolean;
  message: string;
  subjectCount: number;
  hasEnglish: boolean;
  missingRequirements: string[];
  suggestions: string[];
  selectedSubjectDetails: SubjectWithDetails[];
}

export class JAMBValidationService {
  /**
   * Validate JAMB subject selection
   * Requirements: Exactly 4 subjects including English
   */
  async validateJAMBSubjects(subjectIds: string[]): Promise<JAMBValidationResult> {
    try {
      // Get subject details for validation
      const selectedSubjects = await updatedSubjectService.getSubjectsByIds(subjectIds);
      const englishSubject = await updatedSubjectService.getEnglishSubject();
      
      const result: JAMBValidationResult = {
        isValid: false,
        message: '',
        subjectCount: subjectIds.length,
        hasEnglish: false,
        missingRequirements: [],
        suggestions: [],
        selectedSubjectDetails: selectedSubjects
      };

      // Check if English is included
      if (englishSubject) {
        result.hasEnglish = subjectIds.includes(englishSubject.id);
      }

      // Validate subject count
      if (subjectIds.length === 0) {
        result.message = 'Please select subjects for your JAMB examination.';
        result.missingRequirements.push('Select 4 subjects total');
        result.suggestions.push('Start by selecting English Language (mandatory)');
        return result;
      }

      if (subjectIds.length < 4) {
        const remaining = 4 - subjectIds.length;
        result.message = `JAMB requires exactly 4 subjects. You need ${remaining} more subject${remaining !== 1 ? 's' : ''}.`;
        result.missingRequirements.push(`Select ${remaining} more subject${remaining !== 1 ? 's' : ''}`);
        
        if (!result.hasEnglish) {
          result.suggestions.push('English Language is mandatory for JAMB');
        }
        result.suggestions.push('Choose subjects from different categories for a balanced combination');
        return result;
      }

      if (subjectIds.length > 4) {
        const excess = subjectIds.length - 4;
        result.message = `JAMB allows exactly 4 subjects. Please remove ${excess} subject${excess !== 1 ? 's' : ''}.`;
        result.missingRequirements.push(`Remove ${excess} subject${excess !== 1 ? 's' : ''}`);
        result.suggestions.push('Keep English and your 3 strongest subjects');
        return result;
      }

      // Check for English requirement
      if (!result.hasEnglish) {
        result.message = 'English Language is mandatory for JAMB examinations.';
        result.missingRequirements.push('Include English Language');
        result.suggestions.push('Replace one subject with English Language');
        return result;
      }

      // Check for subject diversity (different categories)
      const categories = new Set(
        selectedSubjects
          .map(s => s.category_slug)
          .filter(Boolean)
      );

      if (categories.size < 2) {
        result.message = 'Select subjects from different categories for a balanced JAMB combination.';
        result.missingRequirements.push('Choose subjects from at least 2 different categories');
        result.suggestions.push('Consider mixing Science, Arts, and Commercial subjects');
        return result;
      }

      // All validations passed
      result.isValid = true;
      result.message = 'Valid JAMB subject combination! You have selected 4 subjects including English.';
      
      return result;

    } catch (error) {
      console.error('JAMB validation error:', error);
      return {
        isValid: false,
        message: 'Validation error occurred. Please try again.',
        subjectCount: subjectIds.length,
        hasEnglish: false,
        missingRequirements: ['Validation failed'],
        suggestions: ['Please refresh and try again'],
        selectedSubjectDetails: []
      };
    }
  }

  /**
   * Get JAMB subject selection recommendations
   */
  async getJAMBRecommendations(currentSubjects: string[] = []): Promise<{
    mandatorySubjects: SubjectWithDetails[];
    recommendedByCategory: {
      [category: string]: SubjectWithDetails[];
    };
    popularCombinations: {
      name: string;
      subjects: string[];
      description: string;
    }[];
  }> {
    try {
      const allJAMBSubjects = await updatedSubjectService.getJAMBSubjects();
      const englishSubject = await updatedSubjectService.getEnglishSubject();
      
      // Group subjects by category
      const subjectsByCategory: { [category: string]: SubjectWithDetails[] } = {};
      allJAMBSubjects.forEach(subject => {
        const category = subject.category_name || 'General';
        if (!subjectsByCategory[category]) {
          subjectsByCategory[category] = [];
        }
        subjectsByCategory[category].push(subject);
      });

      // Popular JAMB combinations
      const popularCombinations = [
        {
          name: 'Science (Medicine/Engineering)',
          subjects: ['english', 'mathematics', 'physics', 'chemistry'],
          description: 'For Medicine, Engineering, and Science-related courses'
        },
        {
          name: 'Science (Biological Sciences)',
          subjects: ['english', 'mathematics', 'biology', 'chemistry'],
          description: 'For Biological Sciences, Agriculture, and related fields'
        },
        {
          name: 'Commercial',
          subjects: ['english', 'mathematics', 'economics', 'commerce'],
          description: 'For Business, Economics, and Commercial courses'
        },
        {
          name: 'Arts',
          subjects: ['english', 'literature', 'government', 'history'],
          description: 'For Arts, Humanities, and Social Sciences'
        }
      ];

      return {
        mandatorySubjects: englishSubject ? [englishSubject] : [],
        recommendedByCategory: subjectsByCategory,
        popularCombinations
      };

    } catch (error) {
      console.error('Failed to get JAMB recommendations:', error);
      return {
        mandatorySubjects: [],
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
  } {
    const englishSubject = allSubjects.find(s => s.slug === 'english');
    const hasEnglish = englishSubject ? subjectIds.includes(englishSubject.id) : false;
    const count = subjectIds.length;

    if (count === 0) {
      return {
        status: 'incomplete',
        message: 'Select subjects to begin',
        progress: 0,
        nextStep: 'Select English Language first'
      };
    }

    if (count < 4) {
      if (!hasEnglish) {
        return {
          status: 'invalid',
          message: 'English Language is required',
          progress: (count / 4) * 100,
          nextStep: 'Add English Language'
        };
      }
      
      const remaining = 4 - count;
      return {
        status: 'incomplete',
        message: `${remaining} more subject${remaining !== 1 ? 's' : ''} needed`,
        progress: (count / 4) * 100,
        nextStep: `Select ${remaining} more subject${remaining !== 1 ? 's' : ''}`
      };
    }

    if (count > 4) {
      const excess = count - 4;
      return {
        status: 'invalid',
        message: `Remove ${excess} subject${excess !== 1 ? 's' : ''}`,
        progress: 100,
        nextStep: `Deselect ${excess} subject${excess !== 1 ? 's' : ''}`
      };
    }

    if (!hasEnglish) {
      return {
        status: 'invalid',
        message: 'English Language is required',
        progress: 100,
        nextStep: 'Replace one subject with English'
      };
    }

    // Check category diversity
    const selectedSubjects = allSubjects.filter(s => subjectIds.includes(s.id));
    const categories = new Set(selectedSubjects.map(s => s.category_slug).filter(Boolean));
    
    if (categories.size < 2) {
      return {
        status: 'invalid',
        message: 'Choose subjects from different categories',
        progress: 100,
        nextStep: 'Mix Science, Arts, or Commercial subjects'
      };
    }

    return {
      status: 'valid',
      message: 'Perfect! Valid JAMB combination',
      progress: 100
    };
  }
}

export const jambValidationService = new JAMBValidationService();