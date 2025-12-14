/**
 * Universal Validation Service
 * Provides exam-agnostic validation interface for subject selection
 */

import { jambValidationService } from './jamb-validation-service';
// WAEC validation removed - app is JAMB-only
import type { ExamTypeRecord, SubjectWithDetails } from '../types/database';
import type { JAMBValidationResult } from './jamb-validation-service';

export interface UniversalValidationResult {
  isValid: boolean;
  message: string;
  examType: string;
  subjectCount: number;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  validationDetails: JAMBValidationResult | null;
  realTimeStatus: {
    status: 'incomplete' | 'invalid' | 'valid';
    message: string;
    progress: number;
    nextStep?: string;
    categoryBalance?: string;
  };
}

export interface ValidationState {
  isValidating: boolean;
  lastValidated: number;
  validationHistory: {
    timestamp: number;
    subjectIds: string[];
    result: UniversalValidationResult;
  }[];
}

export class UniversalValidationService {
  private validationState: ValidationState = {
    isValidating: false,
    lastValidated: 0,
    validationHistory: []
  };

  /**
   * Validate subject selection for any exam type
   */
  async validateSubjectSelection(
    examType: ExamTypeRecord,
    subjectIds: string[],
    allSubjects: SubjectWithDetails[]
  ): Promise<UniversalValidationResult> {
    this.validationState.isValidating = true;
    
    try {
      const examSlug = examType.slug.toLowerCase();
      let validationDetails: JAMBValidationResult | null = null;
      let realTimeStatus: UniversalValidationResult['realTimeStatus'];
      
      const result: UniversalValidationResult = {
        isValid: false,
        message: '',
        examType: examType.name,
        subjectCount: subjectIds.length,
        errors: [],
        warnings: [],
        suggestions: [],
        validationDetails: null,
        realTimeStatus: {
          status: 'incomplete',
          message: 'Validating...',
          progress: 0
        }
      };

      // Route to appropriate validation service
      if (examSlug === 'jamb') {
        const jambResult = await jambValidationService.validateJAMBSubjects(subjectIds);
        validationDetails = jambResult;
        realTimeStatus = jambValidationService.validateInRealTime(subjectIds, allSubjects);
        
        result.isValid = jambResult.isValid;
        result.message = jambResult.message;
        
        if (!jambResult.isValid) {
          result.errors.push(...jambResult.missingRequirements);
        }
        result.suggestions.push(...jambResult.suggestions);
        
      } else {
        // Generic validation for other exam types
        result.message = `Validation for ${examType.name} is not yet implemented.`;
        result.warnings.push('Using generic validation rules');
        result.suggestions.push('Please verify subject requirements manually');
        
        realTimeStatus = {
          status: subjectIds.length > 0 ? 'valid' : 'incomplete',
          message: subjectIds.length > 0 ? 'Subjects selected' : 'No subjects selected',
          progress: subjectIds.length > 0 ? 100 : 0
        };
      }

      result.validationDetails = validationDetails;
      result.realTimeStatus = realTimeStatus;

      // Store validation result in history
      this.validationState.validationHistory.push({
        timestamp: Date.now(),
        subjectIds: [...subjectIds],
        result: { ...result }
      });

      // Keep only last 10 validation results
      if (this.validationState.validationHistory.length > 10) {
        this.validationState.validationHistory = this.validationState.validationHistory.slice(-10);
      }

      this.validationState.lastValidated = Date.now();
      
      return result;

    } catch (error) {
      console.error('Universal validation error:', error);
      
      return {
        isValid: false,
        message: 'Validation service error occurred.',
        examType: examType.name,
        subjectCount: subjectIds.length,
        errors: ['Validation service temporarily unavailable'],
        warnings: [],
        suggestions: ['Please try again or contact support'],
        validationDetails: null,
        realTimeStatus: {
          status: 'invalid',
          message: 'Validation error',
          progress: 0,
          nextStep: 'Please try again'
        }
      };
    } finally {
      this.validationState.isValidating = false;
    }
  }

  /**
   * Get validation requirements for an exam type
   */
  getValidationRequirements(examType: ExamTypeRecord): {
    title: string;
    description: string;
    requirements: string[];
    minSubjects: number;
    maxSubjects: number;
    mandatorySubjects: string[];
    recommendations: string[];
  } {
    const examSlug = examType.slug.toLowerCase();
    
    if (examSlug === 'jamb') {
      return {
        title: 'JAMB Requirements',
        description: 'Select exactly 4 subjects including English',
        requirements: [
          'English Language (Mandatory)',
          '3 additional subjects from different categories',
          'Total: 4 subjects'
        ],
        minSubjects: 4,
        maxSubjects: 4,
        mandatorySubjects: ['english'],
        recommendations: [
          'Choose subjects relevant to your intended course of study',
          'Ensure good balance between Science, Arts, and Commercial subjects',
          'Consider your strengths when selecting optional subjects'
        ]
      };
    }
    
    // Generic requirements for other exam types
    return {
      title: `${examType.name} Requirements`,
      description: 'Select subjects for your examination',
      requirements: ['Subject selection requirements not specified'],
      minSubjects: 1,
      maxSubjects: 10,
      mandatorySubjects: [],
      recommendations: ['Consult official guidelines for specific requirements']
    };
  }

  /**
   * Get validation state
   */
  getValidationState(): ValidationState {
    return { ...this.validationState };
  }

  /**
   * Clear validation history
   */
  clearValidationHistory(): void {
    this.validationState.validationHistory = [];
  }

  /**
   * Get last validation result
   */
  getLastValidationResult(): UniversalValidationResult | null {
    const history = this.validationState.validationHistory;
    return history.length > 0 ? history[history.length - 1].result : null;
  }

  /**
   * Check if validation is needed (subjects changed since last validation)
   */
  isValidationNeeded(currentSubjectIds: string[]): boolean {
    const lastResult = this.getLastValidationResult();
    if (!lastResult) return true;
    
    const lastHistory = this.validationState.validationHistory[this.validationState.validationHistory.length - 1];
    if (!lastHistory) return true;
    
    // Check if subject selection has changed
    const lastSubjects = lastHistory.subjectIds.sort();
    const currentSubjects = [...currentSubjectIds].sort();
    
    return JSON.stringify(lastSubjects) !== JSON.stringify(currentSubjects);
  }

  /**
   * Validate subject combination compatibility
   */
  validateSubjectCompatibility(
    subjectIds: string[],
    allSubjects: SubjectWithDetails[]
  ): {
    isCompatible: boolean;
    conflicts: string[];
    recommendations: string[];
  } {
    const selectedSubjects = allSubjects.filter(s => subjectIds.includes(s.id));
    const conflicts: string[] = [];
    const recommendations: string[] = [];
    
    // Check for category balance
    const categories = new Set(selectedSubjects.map(s => s.category_slug).filter(Boolean));
    if (categories.size === 1 && selectedSubjects.length > 3) {
      recommendations.push('Consider adding subjects from different categories for better balance');
    }
    
    // Check for common subject combinations
    const subjectSlugs = selectedSubjects.map(s => s.slug);
    
    // Science combination checks
    if (subjectSlugs.includes('physics') && subjectSlugs.includes('chemistry')) {
      if (!subjectSlugs.includes('mathematics')) {
        recommendations.push('Mathematics is highly recommended with Physics and Chemistry');
      }
    }
    
    // Commercial combination checks
    if (subjectSlugs.includes('accounting') && subjectSlugs.includes('commerce')) {
      if (!subjectSlugs.includes('economics')) {
        recommendations.push('Economics complements Accounting and Commerce well');
      }
    }
    
    return {
      isCompatible: conflicts.length === 0,
      conflicts,
      recommendations
    };
  }
}

export const universalValidationService = new UniversalValidationService();