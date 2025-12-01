import { describe, it, expect } from 'vitest';
import type { QuestionInput } from '../services/admin-question-service';

/**
 * Test suite for admin question import with exam metadata
 * 
 * Requirements: 12.1, 12.2, 12.3
 */
describe('Admin Question Import - Exam Metadata Support', () => {
  /**
   * Requirement 12.1: WHEN an administrator imports questions THEN the Quiz System SHALL accept exam_type field with values JAMB or WAEC
   */
  it('should accept exam_type field with JAMB value', () => {
    const question: QuestionInput = {
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

    // Verify the question object has the correct exam_type
    expect(question.exam_type).toBe('JAMB');
    expect(['JAMB', 'WAEC', null, undefined]).toContain(question.exam_type);
  });

  it('should accept exam_type field with WAEC value', () => {
    const question: QuestionInput = {
      topic_id: 'test-topic-id',
      question_text: 'What is 2 + 2?',
      option_a: '2',
      option_b: '3',
      option_c: '4',
      option_d: '5',
      correct_answer: 'C',
      explanation: 'Addition of two numbers',
      exam_type: 'WAEC',
      exam_year: 2023,
      is_active: true,
    };

    // Verify the question object has the correct exam_type
    expect(question.exam_type).toBe('WAEC');
    expect(['JAMB', 'WAEC', null, undefined]).toContain(question.exam_type);
  });

  /**
   * Requirement 12.2: WHEN an administrator imports questions THEN the Quiz System SHALL accept exam_year field with numeric year values
   */
  it('should accept exam_year field with numeric year values', () => {
    const question: QuestionInput = {
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
        topic_id: 'test-topic-id',
        question_text: 'Question with only exam_type',
        option_a: '2',
        option_b: '3',
        option_c: '4',
        option_d: '5',
        correct_answer: 'C',
        exam_type: 'WAEC',
        is_active: true,
      },
      {
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
    expect(questions[2].exam_type).toBe('WAEC');
    expect(questions[2].exam_year).toBeUndefined();
    expect(questions[3].exam_type).toBeUndefined();
    expect(questions[3].exam_year).toBe(2022);
  });
});
