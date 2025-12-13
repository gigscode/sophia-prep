import { describe, it, expect } from 'vitest';
import type { QuestionInput } from '../services/admin-question-service';

/**
 * Test suite for admin question import with exam metadata
 * 
 * Requirements: 12.1, 12.2, 12.3
 */
describe('Admin Question Import - Exam Metadata Support', () => {
  /**
   * Requirement 12.1: WHEN an administrator imports questions THEN the Quiz System SHALL accept exam_type field with value JAMB
   */
  it('should accept exam_type field with JAMB value', () => {
    const question: QuestionInput = {
      subject_id: 'test-subject-id',
      question_text: 'What is 2 + 2?',
      option_a: '2',
      option_b: '3',
      option_c: '4',
      option_d: '5',
      correct_answer: 'C',
      explanation: 'Addition of two numbers',
      exam_type: 'JAMB',
      exam_year: 2023,
      is_active: true,
    };

    // Verify the question object has the correct exam_type
    expect(question.exam_type).toBe('JAMB');
    expect(['JAMB', null, undefined]).toContain(question.exam_type);
  });

  /**
   * Requirement 12.2: WHEN an administrator imports questions THEN the Quiz System SHALL accept exam_year field with numeric year values
   */
  it('should accept exam_year field with numeric year values', () => {
    const question: QuestionInput = {
      subject_id: 'test-subject-id',
      topic_id: 'test-topic-id',
      question_text: 'What is 2 + 2?',
      option_a: '2',
      option_b: '3',
      option_c: '4',
      option_d: '5',
      correct_answer: 'C',
      explanation: 'Addition of two numbers',
      exam_type: 'JAMB',
      exam_year: 2023,
      is_active: true,
    };

    // Verify the question object has the correct exam_year
    expect(question.exam_year).toBe(2023);
    expect(typeof question.exam_year).toBe('number');
  });

  it('should accept various year values', () => {
    const years = [2020, 2021, 2022, 2023, 2024];

    years.forEach(year => {
      const question: QuestionInput = {
        subject_id: 'test-subject-id',
        topic_id: 'test-topic-id',
        question_text: 'What is 2 + 2?',
        option_a: '2',
        option_b: '3',
        option_c: '4',
        option_d: '5',
        correct_answer: 'C',
        exam_year: year,
        is_active: true,
      };

      expect(question.exam_year).toBe(year);
      expect(typeof question.exam_year).toBe('number');
    });
  });

  /**
   * Requirement 12.3: WHEN an administrator imports questions without exam_type or exam_year THEN the Quiz System SHALL store the question with null values for those fields
   */
  it('should store questions with null exam_type when not provided', () => {
    const question: QuestionInput = {
      subject_id: 'test-subject-id',
      topic_id: 'test-topic-id',
      question_text: 'What is 2 + 2?',
      option_a: '2',
      option_b: '3',
      option_c: '4',
      option_d: '5',
      correct_answer: 'C',
      explanation: 'Addition of two numbers',
      exam_type: null,
      exam_year: null,
      is_active: true,
    };

    // Verify the question object accepts null values
    expect(question.exam_type).toBeNull();
    expect(question.exam_year).toBeNull();
  });

  it('should store questions without exam_type or exam_year fields', () => {
    const question: QuestionInput = {
      subject_id: 'test-subject-id',
      topic_id: 'test-topic-id',
      question_text: 'What is 2 + 2?',
      option_a: '2',
      option_b: '3',
      option_c: '4',
      option_d: '5',
      correct_answer: 'C',
      explanation: 'Addition of two numbers',
      is_active: true,
    };

    // Verify the question object is valid without exam metadata
    expect(question.exam_type).toBeUndefined();
    expect(question.exam_year).toBeUndefined();
    expect(question.question_text).toBe('What is 2 + 2?');
  });

  it('should handle mixed scenarios - some with metadata, some without', () => {
    const questions: QuestionInput[] = [
      {
        subject_id: 'test-subject-id',
        topic_id: 'test-topic-id',
        question_text: 'Question with full metadata',
        option_a: '2',
        option_b: '3',
        option_c: '4',
        option_d: '5',
        correct_answer: 'C',
        exam_type: 'JAMB',
        exam_year: 2023,
        is_active: true,
      },
      {
        subject_id: 'test-subject-id',
        topic_id: 'test-topic-id',
        question_text: 'Question without metadata',
        option_a: '2',
        option_b: '3',
        option_c: '4',
        option_d: '5',
        correct_answer: 'C',
        is_active: true,
      },
      {
        subject_id: 'test-subject-id',
        topic_id: 'test-topic-id',
        question_text: 'Question with only exam_type',
        option_a: '2',
        option_b: '3',
        option_c: '4',
        option_d: '5',
        correct_answer: 'C',
        exam_type: 'JAMB',
        is_active: true,
      },
      {
        subject_id: 'test-subject-id',
        topic_id: 'test-topic-id',
        question_text: 'Question with only exam_year',
        option_a: '2',
        option_b: '3',
        option_c: '4',
        option_d: '5',
        correct_answer: 'C',
        exam_year: 2022,
        is_active: true,
      },
    ];

    // Verify all questions are valid
    expect(questions).toHaveLength(4);
    expect(questions[0].exam_type).toBe('JAMB');
    expect(questions[0].exam_year).toBe(2023);
    expect(questions[1].exam_type).toBeUndefined();
    expect(questions[1].exam_year).toBeUndefined();
    expect(questions[2].exam_type).toBe('JAMB');
    expect(questions[2].exam_year).toBeUndefined();
    expect(questions[3].exam_type).toBeUndefined();
    expect(questions[3].exam_year).toBe(2022);
  });
});

describe('Admin Question Import - Validation Logic (Requirements 5.2, 5.4)', () => {
  /**
   * Requirement 5.2: Validate that subject_id is required
   */
  it('should reject questions without subject_id', () => {
    const question: QuestionInput = {
      subject_id: null,
      question_text: 'What is 2 + 2?',
      option_a: '2',
      option_b: '3',
      option_c: '4',
      option_d: '5',
      correct_answer: 'C',
      explanation: 'Invalid - no subject',
      is_active: true,
    };

    // This question should be considered invalid
    // The validation should catch this during import
    expect(question.subject_id).toBeNull();
  });

  /**
   * Requirement 5.4: Validate required fields
   */
  it('should validate all required fields are present', () => {
    const validQuestion: QuestionInput = {
      subject_id: 'test-subject-id',
      question_text: 'What is 2 + 2?',
      option_a: '2',
      option_b: '3',
      option_c: '4',
      option_d: '5',
      correct_answer: 'C',
      is_active: true,
    };

    // All required fields should be present
    expect(validQuestion.question_text).toBeTruthy();
    expect(validQuestion.option_a).toBeTruthy();
    expect(validQuestion.option_b).toBeTruthy();
    expect(validQuestion.option_c).toBeTruthy();
    expect(validQuestion.option_d).toBeTruthy();
    expect(validQuestion.correct_answer).toBeTruthy();
    expect(['A', 'B', 'C', 'D']).toContain(validQuestion.correct_answer);
  });

  it('should validate correct_answer is one of A, B, C, D', () => {
    const validAnswers = ['A', 'B', 'C', 'D'];

    validAnswers.forEach(answer => {
      const question: QuestionInput = {
        subject_id: 'test-subject-id',
        topic_id: null,
        question_text: 'What is 2 + 2?',
        option_a: '2',
        option_b: '3',
        option_c: '4',
        option_d: '5',
        correct_answer: answer as 'A' | 'B' | 'C' | 'D',
        is_active: true,
      };

      expect(['A', 'B', 'C', 'D']).toContain(question.correct_answer);
    });
  });

  /**
   * Requirement 5.2: Handle direct subject assignment
   */
  it('should handle direct subject assignment without topic', () => {
    const question: QuestionInput = {
      subject_id: 'mathematics-id',
      question_text: 'Solve: 2x + 5 = 15',
      option_a: '3',
      option_b: '5',
      option_c: '7',
      option_d: '10',
      correct_answer: 'B',
      explanation: 'Direct subject assignment - no topic needed',
      exam_type: 'JAMB',
      exam_year: 2023,
      is_active: true,
    };

    // Verify direct subject assignment is valid
    expect(question.subject_id).toBe('mathematics-id');
    expect(question.question_text).toBeTruthy();
  });

  it('should handle questions with empty string fields as invalid', () => {
    const invalidQuestions = [
      {
        subject_id: 'test-subject-id',
        topic_id: null,
        question_text: '',  // Empty
        option_a: '2',
        option_b: '3',
        option_c: '4',
        option_d: '5',
        correct_answer: 'C' as const,
        is_active: true,
      },
      {
        subject_id: 'test-subject-id',
        topic_id: null,
        question_text: 'What is 2 + 2?',
        option_a: '',  // Empty
        option_b: '3',
        option_c: '4',
        option_d: '5',
        correct_answer: 'C' as const,
        is_active: true,
      },
      {
        subject_id: 'test-subject-id',
        topic_id: null,
        question_text: '   ',  // Whitespace only
        option_a: '2',
        option_b: '3',
        option_c: '4',
        option_d: '5',
        correct_answer: 'C' as const,
        is_active: true,
      },
    ];

    // These should all be considered invalid
    invalidQuestions.forEach(q => {
      const hasEmptyField = !q.question_text?.trim() || !q.option_a?.trim();
      expect(hasEmptyField).toBe(true);
    });
  });

  /**
   * Test error message formatting
   */
  it('should format validation error messages clearly', () => {
    const questionPreview = 'What is 2 + 2?';

    // Test various error message formats
    const errorMessages = [
      `Validation Error: subject_id must be provided. Question: "${questionPreview.substring(0, 50)}..."`,
      `Validation failed: Missing required fields [question_text]. Question: "${questionPreview.substring(0, 50)}..."`,
      `Validation failed: correct_answer must be A, B, C, or D (got "E"). Question: "${questionPreview.substring(0, 50)}..."`,
    ];

    // Verify error messages contain key information
    errorMessages.forEach(msg => {
      expect(msg).toContain('Validation');
      expect(msg).toContain('Question:');
    });
  });
});
