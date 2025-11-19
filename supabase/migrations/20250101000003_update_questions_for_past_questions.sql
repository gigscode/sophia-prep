-- Migration: Update questions table for past questions support
-- This migration adds columns to support past questions filtering by year and exam type
-- Requirements: 2.5

-- Log migration start
DO $$
DECLARE
  v_log_id UUID;
BEGIN
  SELECT log_migration_operation(
    'update_questions_for_past_questions',
    'START_MIGRATION',
    'STARTED',
    0,
    NULL,
    '{"description": "Adding past questions support columns to questions table"}'::jsonb
  ) INTO v_log_id;
END $$;

-- Add exam_year column to questions table
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS exam_year INTEGER;

-- Add exam_type column to questions table
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS exam_type TEXT CHECK (exam_type IN ('JAMB', 'WAEC'));

-- Add question_number column to questions table
ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS question_number INTEGER;

-- Create indexes on new columns for efficient querying
CREATE INDEX IF NOT EXISTS idx_questions_exam_year ON questions(exam_year) WHERE exam_year IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_questions_exam_type ON questions(exam_type) WHERE exam_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_questions_year_type ON questions(exam_year, exam_type) WHERE exam_year IS NOT NULL AND exam_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_questions_topic_year ON questions(topic_id, exam_year) WHERE exam_year IS NOT NULL;

-- Add comment to explain the columns
COMMENT ON COLUMN questions.exam_year IS 'The year this question appeared in an actual exam (e.g., 2023)';
COMMENT ON COLUMN questions.exam_type IS 'The exam type this question is from (JAMB or WAEC)';
COMMENT ON COLUMN questions.question_number IS 'The original question number in the exam paper';

-- Log migration completion
DO $$
DECLARE
  v_log_id UUID;
BEGIN
  SELECT log_migration_operation(
    'update_questions_for_past_questions',
    'ALTER_TABLE',
    'COMPLETED',
    0,
    NULL,
    '{"description": "Added exam_year, exam_type, and question_number columns to questions table", "columns_added": ["exam_year", "exam_type", "question_number"]}'::jsonb
  ) INTO v_log_id;
END $$;
