/**
 * Question Upload Service
 * Handles uploading questions to the new normalized database structure
 */

import { supabase } from '../integrations/supabase/client';
import type { 
  QuestionRecord, 
  ExamTypeRecord, 
  SubjectRecord,

} from '../types/database';

export interface QuestionUploadData {
  subjectSlug: string;
  examTypeSlug: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;

  examYear?: number;
  questionNumber?: number;
}

export interface BulkUploadResult {
  success: boolean;
  totalQuestions: number;
  successfulUploads: number;
  failedUploads: number;
  errors: string[];
  uploadedQuestionIds: string[];
}

export class QuestionUploadService {
  private subjectCache = new Map<string, string>(); // slug -> id
  private examTypeCache = new Map<string, string>(); // slug -> id

  /**
   * Initialize caches for subjects and exam types
   */
  private async initializeCaches(): Promise<void> {
    try {
      // Load subjects
      const { data: subjects, error: subjectsError } = await supabase
        .from('subjects_new')
        .select('id, slug')
        .eq('is_active', true);

      if (subjectsError) {
        console.error('Error loading subjects cache:', subjectsError);
      } else {
        subjects?.forEach(subject => {
          this.subjectCache.set(subject.slug, subject.id);
        });
      }

      // Load exam types
      const { data: examTypes, error: examTypesError } = await supabase
        .from('exam_types')
        .select('id, slug')
        .eq('is_active', true);

      if (examTypesError) {
        console.error('Error loading exam types cache:', examTypesError);
      } else {
        examTypes?.forEach(examType => {
          this.examTypeCache.set(examType.slug, examType.id);
        });
      }
    } catch (err) {
      console.error('Failed to initialize caches:', err);
    }
  }

  /**
   * Get subject ID by slug (with caching)
   */
  private async getSubjectId(slug: string): Promise<string | null> {
    if (this.subjectCache.size === 0) {
      await this.initializeCaches();
    }
    return this.subjectCache.get(slug) || null;
  }

  /**
   * Get exam type ID by slug (with caching)
   */
  private async getExamTypeId(slug: string): Promise<string | null> {
    if (this.examTypeCache.size === 0) {
      await this.initializeCaches();
    }
    return this.examTypeCache.get(slug) || null;
  }

  /**
   * Validate question data
   */
  private validateQuestionData(question: QuestionUploadData): string[] {
    const errors: string[] = [];

    if (!question.subjectSlug?.trim()) {
      errors.push('Subject slug is required');
    }

    if (!question.examTypeSlug?.trim()) {
      errors.push('Exam type slug is required');
    }

    if (!question.questionText?.trim()) {
      errors.push('Question text is required');
    }

    if (!question.optionA?.trim()) {
      errors.push('Option A is required');
    }

    if (!question.optionB?.trim()) {
      errors.push('Option B is required');
    }

    if (!question.optionC?.trim()) {
      errors.push('Option C is required');
    }

    if (!question.optionD?.trim()) {
      errors.push('Option D is required');
    }

    if (!['A', 'B', 'C', 'D'].includes(question.correctAnswer)) {
      errors.push('Correct answer must be A, B, C, or D');
    }



    if (question.examYear && (question.examYear < 2000 || question.examYear > new Date().getFullYear())) {
      errors.push('Exam year must be between 2000 and current year');
    }

    return errors;
  }

  /**
   * Upload a single question
   */
  async uploadQuestion(questionData: QuestionUploadData): Promise<{
    success: boolean;
    questionId?: string;
    errors: string[];
  }> {
    // Validate data
    const validationErrors = this.validateQuestionData(questionData);
    if (validationErrors.length > 0) {
      return {
        success: false,
        errors: validationErrors
      };
    }

    try {
      // Get subject and exam type IDs
      const subjectId = await this.getSubjectId(questionData.subjectSlug);
      const examTypeId = await this.getExamTypeId(questionData.examTypeSlug);

      if (!subjectId) {
        return {
          success: false,
          errors: [`Subject not found: ${questionData.subjectSlug}`]
        };
      }

      if (!examTypeId) {
        return {
          success: false,
          errors: [`Exam type not found: ${questionData.examTypeSlug}`]
        };
      }

      // Insert question
      const { data, error } = await supabase
        .from('questions_new')
        .insert({
          subject_id: subjectId,
          exam_type_id: examTypeId,
          question_text: questionData.questionText.trim(),
          option_a: questionData.optionA.trim(),
          option_b: questionData.optionB.trim(),
          option_c: questionData.optionC.trim(),
          option_d: questionData.optionD.trim(),
          correct_answer: questionData.correctAnswer,
          explanation: questionData.explanation?.trim() || null,

          exam_year: questionData.examYear || null,
          question_number: questionData.questionNumber || null,
          is_active: true
        })
        .select('id')
        .single();

      if (error) {
        console.error('Error uploading question:', error);
        return {
          success: false,
          errors: [`Database error: ${error.message}`]
        };
      }

      return {
        success: true,
        questionId: data.id,
        errors: []
      };
    } catch (err) {
      console.error('Failed to upload question:', err);
      return {
        success: false,
        errors: [`Upload failed: ${err instanceof Error ? err.message : 'Unknown error'}`]
      };
    }
  }

  /**
   * Upload multiple questions in bulk
   */
  async uploadQuestionsBulk(questions: QuestionUploadData[]): Promise<BulkUploadResult> {
    const result: BulkUploadResult = {
      success: false,
      totalQuestions: questions.length,
      successfulUploads: 0,
      failedUploads: 0,
      errors: [],
      uploadedQuestionIds: []
    };

    if (questions.length === 0) {
      result.errors.push('No questions provided');
      return result;
    }

    // Initialize caches once for bulk upload
    await this.initializeCaches();

    // Process questions in batches to avoid overwhelming the database
    const batchSize = 50;
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);
      
      for (const question of batch) {
        const uploadResult = await this.uploadQuestion(question);
        
        if (uploadResult.success) {
          result.successfulUploads++;
          if (uploadResult.questionId) {
            result.uploadedQuestionIds.push(uploadResult.questionId);
          }
        } else {
          result.failedUploads++;
          result.errors.push(
            `Question ${i + batch.indexOf(question) + 1}: ${uploadResult.errors.join(', ')}`
          );
        }
      }

      // Small delay between batches to prevent rate limiting
      if (i + batchSize < questions.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    result.success = result.successfulUploads > 0;
    return result;
  }

  /**
   * Upload questions from JSON file
   */
  async uploadQuestionsFromJSON(jsonData: any[]): Promise<BulkUploadResult> {
    try {
      // Convert JSON data to QuestionUploadData format
      const questions: QuestionUploadData[] = jsonData.map((item, index) => {
        // Handle different JSON formats
        const question: QuestionUploadData = {
          subjectSlug: item.subject_slug || item.subjectSlug || item.subject || '',
          examTypeSlug: item.exam_type_slug || item.examTypeSlug || item.exam_type || item.examType || '',
          questionText: item.question_text || item.questionText || item.question || item.text || '',
          optionA: item.option_a || item.optionA || item.a || item.A || '',
          optionB: item.option_b || item.optionB || item.b || item.B || '',
          optionC: item.option_c || item.optionC || item.c || item.C || '',
          optionD: item.option_d || item.optionD || item.d || item.D || '',
          correctAnswer: (item.correct_answer || item.correctAnswer || item.correct || item.answer || '').toUpperCase(),
          explanation: item.explanation || item.explain || null,

          examYear: item.exam_year || item.examYear || item.year || null,
          questionNumber: item.question_number || item.questionNumber || item.number || null
        };

        return question;
      });

      return await this.uploadQuestionsBulk(questions);
    } catch (err) {
      console.error('Failed to process JSON data:', err);
      return {
        success: false,
        totalQuestions: 0,
        successfulUploads: 0,
        failedUploads: 0,
        errors: [`JSON processing error: ${err instanceof Error ? err.message : 'Unknown error'}`],
        uploadedQuestionIds: []
      };
    }
  }

  /**
   * Get upload statistics
   */
  async getUploadStats(): Promise<{
    totalQuestions: number;
    questionsBySubject: Record<string, number>;
    questionsByExamType: Record<string, number>;
    questionsByYear: Record<string, number>;
  }> {
    try {
      const { data: stats, error } = await supabase
        .from('questions_new')
        .select(`
          id,
          exam_year,
          subjects_new!inner(name, slug),
          exam_types!inner(name, slug)
        `)
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching upload stats:', error);
        return {
          totalQuestions: 0,
          questionsBySubject: {},
          questionsByExamType: {},
          questionsByYear: {}
        };
      }

      const questionsBySubject: Record<string, number> = {};
      const questionsByExamType: Record<string, number> = {};
      const questionsByYear: Record<string, number> = {};

      stats?.forEach(question => {
        // Count by subject
        const subjectName = question.subjects_new?.name || 'Unknown';
        questionsBySubject[subjectName] = (questionsBySubject[subjectName] || 0) + 1;

        // Count by exam type
        const examTypeName = question.exam_types?.name || 'Unknown';
        questionsByExamType[examTypeName] = (questionsByExamType[examTypeName] || 0) + 1;

        // Count by year
        const year = question.exam_year?.toString() || 'No Year';
        questionsByYear[year] = (questionsByYear[year] || 0) + 1;
      });

      return {
        totalQuestions: stats?.length || 0,
        questionsBySubject,
        questionsByExamType,
        questionsByYear
      };
    } catch (err) {
      console.error('Failed to fetch upload stats:', err);
      return {
        totalQuestions: 0,
        questionsBySubject: {},
        questionsByExamType: {},
        questionsByYear: {}
      };
    }
  }
}

export const questionUploadService = new QuestionUploadService();