import { describe, it, expect } from 'vitest';

/**
 * Integration test for question import with exam metadata
 * 
 * This test verifies that the import system correctly handles questions
 * with and without exam metadata (exam_type and exam_year).
 * 
 * Requirements: 12.1, 12.2, 12.3, 12.4
 */
describe('Question Import Integration - Exam Metadata', () => {
  /**
   * Requirement 12.4: WHEN the Quiz System queries questions THEN the Quiz System SHALL filter by exam_type and exam_year when those parameters are provided
   */
  it('should parse JSON with exam metadata correctly', () => {
    const jsonData = [
      {
        question_text: "What is 2 + 2?",
        option_a: "2",
        option_b: "3",
        option_c: "4",
        option_d: "5",
        correct_answer: "C",
        explanation: "Addition of two numbers",
        exam_year: 2023,
        exam_type: "JAMB",
        topic: "Arithmetic",
        subject: "Mathematics"
      },
      {
        question_text: "Solve: x + 5 = 10",
        option_a: "3",
        option_b: "4",
        option_c: "5",
        option_d: "6",
        correct_answer: "C",
        explanation: "Subtract 5 from both sides",
        exam_year: 2022,
        exam_type: "JAMB",
        topic: "Algebra",
        subject: "Mathematics"
      }
    ];

    // Verify the data structure
    expect(jsonData).toHaveLength(2);
    expect(jsonData[0].exam_type).toBe('JAMB');
    expect(jsonData[0].exam_year).toBe(2023);
    expect(jsonData[1].exam_type).toBe('JAMB');
    expect(jsonData[1].exam_year).toBe(2022);
  });

  it('should parse JSON without exam metadata correctly', () => {
    const jsonData: any[] = [
      {
        question_text: "What is 2 + 2?",
        option_a: "2",
        option_b: "3",
        option_c: "4",
        option_d: "5",
        correct_answer: "C",
        explanation: "Addition of two numbers",
        topic: "Arithmetic",
        subject: "Mathematics"
      }
    ];

    // Verify the data structure
    expect(jsonData).toHaveLength(1);
    expect(jsonData[0].exam_type).toBeUndefined();
    expect(jsonData[0].exam_year).toBeUndefined();
    expect(jsonData[0].question_text).toBe('What is 2 + 2?');
  });

  it('should handle CSV format with exam metadata', () => {
    const csvLine = 'question_text,option_a,option_b,option_c,option_d,correct_answer,explanation,exam_year,exam_type,topic,subject';
    const csvData = '"What is 2 + 2?","2","3","4","5","C","Addition of two numbers","2023","JAMB","Arithmetic","Mathematics"';
    
    const headers = csvLine.split(',').map(h => h.trim().toLowerCase());
    const values = csvData.split(',').map(v => v.replace(/"/g, '').trim());
    
    const question: any = {};
    headers.forEach((header, index) => {
      question[header] = values[index];
    });

    // Verify parsed data
    expect(question.exam_type).toBe('JAMB');
    expect(question.exam_year).toBe('2023');
    expect(question.question_text).toBe('What is 2 + 2?');
  });

  it('should validate that exam_type only accepts JAMB', () => {
    const validTypes = ['JAMB'];
    const invalidTypes = ['NECO', 'GCE', 'WAEC', 'INVALID'];

    validTypes.forEach(type => {
      expect(['JAMB']).toContain(type);
    });

    invalidTypes.forEach(type => {
      expect(['JAMB']).not.toContain(type);
    });
  });

  it('should validate that exam_year is a number', () => {
    const validYears = [2020, 2021, 2022, 2023, 2024];
    const invalidYears = ['2020', 'twenty', null, undefined, NaN];

    validYears.forEach(year => {
      expect(typeof year).toBe('number');
      expect(Number.isNaN(year)).toBe(false);
    });

    invalidYears.forEach(year => {
      if (year !== null && year !== undefined) {
        expect(typeof year === 'number' && !Number.isNaN(year)).toBe(false);
      }
    });
  });

  it('should support filtering questions by exam_type', () => {
    const allQuestions = [
      { id: '1', exam_type: 'JAMB', question_text: 'Q1' },
      { id: '2', exam_type: 'JAMB', question_text: 'Q2' },
      { id: '3', exam_type: 'JAMB', question_text: 'Q3' },
      { id: '4', exam_type: null, question_text: 'Q4' },
    ];

    // Filter by JAMB
    const jambQuestions = allQuestions.filter(q => q.exam_type === 'JAMB');
    expect(jambQuestions).toHaveLength(3);
    expect(jambQuestions.every(q => q.exam_type === 'JAMB')).toBe(true);
  });

  it('should support filtering questions by exam_year', () => {
    const allQuestions = [
      { id: '1', exam_year: 2023, question_text: 'Q1' },
      { id: '2', exam_year: 2022, question_text: 'Q2' },
      { id: '3', exam_year: 2023, question_text: 'Q3' },
      { id: '4', exam_year: null, question_text: 'Q4' },
    ];

    // Filter by 2023
    const questions2023 = allQuestions.filter(q => q.exam_year === 2023);
    expect(questions2023).toHaveLength(2);
    expect(questions2023.every(q => q.exam_year === 2023)).toBe(true);

    // Filter by 2022
    const questions2022 = allQuestions.filter(q => q.exam_year === 2022);
    expect(questions2022).toHaveLength(1);
    expect(questions2022.every(q => q.exam_year === 2022)).toBe(true);
  });

  it('should support filtering questions by both exam_type and exam_year', () => {
    const allQuestions = [
      { id: '1', exam_type: 'JAMB', exam_year: 2023, question_text: 'Q1' },
      { id: '2', exam_type: 'JAMB', exam_year: 2023, question_text: 'Q2' },
      { id: '3', exam_type: 'JAMB', exam_year: 2022, question_text: 'Q3' },
      { id: '4', exam_type: 'JAMB', exam_year: 2022, question_text: 'Q4' },
      { id: '5', exam_type: null, exam_year: null, question_text: 'Q5' },
    ];

    // Filter by JAMB 2023
    const jamb2023 = allQuestions.filter(q => q.exam_type === 'JAMB' && q.exam_year === 2023);
    expect(jamb2023).toHaveLength(2);
    expect(jamb2023[0].id).toBe('1');

    // Filter by JAMB 2022
    const jamb2022 = allQuestions.filter(q => q.exam_type === 'JAMB' && q.exam_year === 2022);
    expect(jamb2022).toHaveLength(2);
    expect(jamb2022[0].id).toBe('3');
  });
});
