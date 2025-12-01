-- =====================================================
-- Exam Modes System - Simple Database Migration
-- =====================================================
-- Simplified version without complex RLS policies
-- =====================================================

-- =====================================================
-- 1. Create Timer Configurations Table
-- =====================================================

CREATE TABLE IF NOT EXISTS timer_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_type VARCHAR(10) NOT NULL CHECK (exam_type IN ('JAMB', 'WAEC')),
  subject_slug VARCHAR(100),
  year INTEGER,
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(exam_type, subject_slug, year)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_timer_configurations_lookup 
ON timer_configurations(exam_type, subject_slug, year);

-- =====================================================
-- 2. Insert Default Timer Configurations
-- =====================================================

INSERT INTO timer_configurations (exam_type, subject_slug, year, duration_seconds) 
VALUES
  ('JAMB', NULL, NULL, 2100),  -- 35 minutes default for JAMB
  ('WAEC', NULL, NULL, 3600)   -- 60 minutes default for WAEC
ON CONFLICT (exam_type, subject_slug, year) DO NOTHING;

-- =====================================================
-- 3. Enhance Quiz Attempts Table
-- =====================================================

-- Add quiz_mode column
ALTER TABLE quiz_attempts 
ADD COLUMN IF NOT EXISTS quiz_mode VARCHAR(50);

-- Add exam_type column
ALTER TABLE quiz_attempts 
ADD COLUMN IF NOT EXISTS exam_type VARCHAR(10) 
CHECK (exam_type IS NULL OR exam_type IN ('JAMB', 'WAEC'));

-- Add exam_year column
ALTER TABLE quiz_attempts 
ADD COLUMN IF NOT EXISTS exam_year INTEGER;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_mode 
ON quiz_attempts(quiz_mode, exam_type, exam_year);

CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_completed 
ON quiz_attempts(user_id, completed_at DESC);

-- =====================================================
-- 4. Enable RLS with Simple Policies
-- =====================================================

ALTER TABLE timer_configurations ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read timer configurations (they're not sensitive)
CREATE POLICY "Allow public read access to timer configurations"
ON timer_configurations
FOR SELECT
USING (true);

-- Allow authenticated users to insert/update (you can restrict this later)
CREATE POLICY "Allow authenticated users to manage timer configurations"
ON timer_configurations
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- =====================================================
-- 5. Grant Permissions
-- =====================================================

GRANT SELECT ON timer_configurations TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON timer_configurations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON quiz_attempts TO authenticated;

-- =====================================================
-- Migration Complete!
-- =====================================================
