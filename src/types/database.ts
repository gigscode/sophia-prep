/**
 * Updated Database Types for New Schema
 * Supports the new normalized structure with exam_types, subject_categories, etc.
 */

export type ExamType = 'JAMB';
export type QuizMode = 'PRACTICE' | 'CBT_EXAM';
export type SubjectCategory = 'SCIENCE' | 'COMMERCIAL' | 'ARTS' | 'LANGUAGE' | 'GENERAL';


/**
 * Exam Types Table
 */
export interface ExamTypeRecord {
  id: string;
  name: string;
  slug: string;
  description?: string;
  full_name?: string;
  duration_minutes?: number;
  total_questions?: number;
  passing_score?: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Subject Categories Table
 */
export interface SubjectCategoryRecord {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color_theme?: string;
  icon?: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Updated Subjects Table
 */
export interface SubjectRecord {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color_theme?: string;
  category_id?: string;
  is_mandatory: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

/**
 * Subject-Exam Type Junction Table
 */
export interface SubjectExamTypeRecord {
  id: string;
  subject_id: string;
  exam_type_id: string;
  is_mandatory: boolean;
  max_questions?: number;
  created_at: string;
}

/**
 * Updated Questions Table
 */
export interface QuestionRecord {
  id: string;
  subject_id: string;
  exam_type_id?: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  explanation?: string;

  exam_year?: number;
  question_number?: number;
  metadata?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Quiz Mode Configurations Table
 */
export interface QuizModeConfigRecord {
  id: string;
  mode_name: string;
  display_name: string;
  description?: string;
  has_timer: boolean;
  show_explanations_during: boolean;
  show_explanations_after: boolean;
  allow_manual_submit: boolean;
  auto_submit_on_timeout: boolean;
  default_time_limit_minutes?: number;
  created_at: string;
}

/**
 * Updated Quiz Attempts Table
 */
export interface QuizAttemptRecord {
  id: string;
  user_id: string;
  subject_id?: string;
  exam_type_id?: string;
  quiz_mode: QuizMode;
  total_questions: number;
  questions_requested?: number;
  correct_answers: number;
  incorrect_answers: number;
  score_percentage: number;
  time_taken_seconds: number;
  time_limit_seconds?: number;
  is_auto_submitted: boolean;
  exam_year?: number;
  questions_data: QuestionAttemptData[];
  completed_at: string;
  created_at: string;
}

/**
 * CBT Exam Configurations Table
 */
export interface CBTExamConfigRecord {
  id: string;
  exam_type_id: string;
  min_questions: number;
  max_questions: number;
  time_per_question_minutes: number;
  allow_custom_question_count: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Individual Question Attempt Data
 */
export interface QuestionAttemptData {
  question_id: string;
  user_answer?: string;
  correct_answer?: string;
  is_correct: boolean;
  time_spent_seconds?: number;
}

/**
 * Enhanced Subject with Relations
 */
export interface SubjectWithDetails {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color_theme?: string;
  category_name?: string;
  category_slug?: string;
  category_color?: string;
  exam_types: string[];
  exam_type_slugs: string[];
  is_mandatory: boolean;
  is_active: boolean;
  sort_order: number;
}

/**
 * JAMB Subject Validation Result
 */
export interface JAMBValidationResult {
  is_valid: boolean;
  message: string;
  subject_count: number;
  has_english: boolean;
  missing_subjects: string[];
  extra_subjects: string[];
}

/**
 * CBT Question Response
 */
export interface CBTQuestionResponse {
  question_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation?: string;
  subject_name: string;
  exam_type_name: string;
  questions_count: number;
  time_limit_minutes: number;
  is_valid: boolean;
  message: string;
}

/**
 * Practice Question Response
 */
export interface PracticeQuestionResponse {
  question_id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
  explanation?: string;
  subject_name: string;
}