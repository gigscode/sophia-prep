/**
 * Quiz Navigation Utilities
 * 
 * Utilities for parsing legacy quiz URL parameters and building QuizConfig objects.
 * Supports the streamlined navigation flow from subjects page to quiz interface.
 * 
 * Requirements: 1.3, 1.5, 3.2
 */

import type { QuizConfig, QuizMode, ExamType } from '../types/quiz-config';
import { QuizConfigHelpers } from '../types/quiz-config';
import { subjectService } from '../services/subject-service';

/**
 * Parsed legacy quiz parameters
 */
export interface LegacyQuizParams {
  subject?: string;
  year?: number;
  type?: ExamType;
}

/**
 * Parse legacy quiz URL query parameters
 * 
 * Extracts subject, year, and type from URL search parameters.
 * Handles "ALL" values by treating them as undefined.
 * 
 * @param searchParams - URLSearchParams object from the URL
 * @returns Parsed parameters object
 * 
 * Requirements: 1.3, 1.5
 */
export function parseLegacyQuizParams(searchParams: URLSearchParams): LegacyQuizParams {
  const subject = searchParams.get('subject') || undefined;
  const yearParam = searchParams.get('year');
  const typeParam = searchParams.get('type');
  
  // Parse year, treating "ALL" as undefined
  const year = yearParam && yearParam !== 'ALL' 
    ? parseInt(yearParam, 10) 
    : undefined;
    
  // Parse type, treating "ALL" as undefined and validating against ExamType
  const type = typeParam && typeParam !== 'ALL' && (typeParam === 'JAMB')
    ? typeParam as ExamType
    : undefined;
  
  return { subject, year, type };
}

/**
 * Build QuizConfig from legacy parameters
 * 
 * Constructs a valid QuizConfig object from parsed legacy URL parameters.
 * Performs subject lookup to determine exam type if not provided.
 * Validates the resulting configuration before returning.
 * 
 * @param mode - Quiz mode (practice or exam)
 * @param params - Parsed legacy parameters
 * @returns QuizConfig object if valid, null if invalid or missing required data
 * 
 * Requirements: 1.3, 1.5, 3.2
 */
export async function buildQuizConfigFromLegacy(
  mode: QuizMode,
  params: LegacyQuizParams
): Promise<QuizConfig | null> {
  // If no subject provided, cannot build config
  if (!params.subject) {
    return null;
  }
  
  // Determine exam type
  let examType: ExamType;
  if (params.type) {
    examType = params.type;
  } else {
    // Look up subject to determine exam type
    try {
      const subject = await subjectService.getSubjectBySlug(params.subject);
      if (!subject) {
        return null;
      }
      
      // If subject supports both, default to JAMB
      examType = subject.exam_type === 'BOTH' ? 'JAMB' : subject.exam_type as ExamType;
    } catch (error) {
      console.error('Failed to lookup subject:', error);
      return null;
    }
  }
  
  // Build config
  const config: QuizConfig = {
    examType,
    mode,
    selectionMethod: 'subject',
    subjectSlug: params.subject,
    year: params.year
  };
  
  // Validate config
  const validationError = QuizConfigHelpers.validateConfig(config);
  if (validationError) {
    console.error('Invalid config:', validationError);
    return null;
  }
  
  return config;
}
