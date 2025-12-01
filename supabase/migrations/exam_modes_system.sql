-- =====================================================
-- Exam Modes System - Database Migration
-- =====================================================
-- This migration adds support for the unified exam modes system
-- with timer configurations and enhanced quiz attempt tracking.
--
-- Features:
-- 1. Timer configurations table for exam durations
-- 2. Enhanced quiz_attempts table with mode metadata
-- =====================================================

-- =====================================================
-- 1. Create Timer Configurations Table
-- =====================================================
-- Stores official exam durations per exam type, subject, and year
-- Allows flexible configuration without code changes

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

-- Add comment for documentation
COMMENT ON TABLE timer_configurations IS 'Stores exam timer durations for different exam types, subjects, and years';
COMMENT ON COLUMN timer_configurations.exam_type IS 'Type of exam: JAMB or WAEC';
COMMENT ON COLUMN timer_configurations.subject_slug IS 'Subject identifier (NULL for default)';
COMMENT ON COLUMN timer_configurations.year IS 'Exam year (NULL for default)';
COMMENT ON COLUMN timer_configurations.duration_seconds IS 'Timer duration in seconds';

-- =====================================================
-- 2. Insert Default Timer Configurations
-- =====================================================
-- Default durations for JAMB and WAEC exams

INSERT INTO timer_configurations (exam_type, subject_slug, year, duration_seconds) 
VALUES
  ('JAMB', NULL, NULL, 2100),  -- 35 minutes (2100 seconds) default for JAMB
  ('WAEC', NULL, NULL, 3600)   -- 60 minutes (3600 seconds) default for WAEC
ON CONFLICT (exam_type, subject_slug, year) DO NOTHING;

-- =====================================================
-- 3. Enhance Quiz Attempts Table
-- =====================================================
-- Add columns for tracking quiz mode, exam type, and year

-- Add quiz_mode column to track the type of quiz taken
ALTER TABLE quiz_attempts 
ADD COLUMN IF NOT EXISTS quiz_mode VARCHAR(50);

-- Add exam_type column to track JAMB or WAEC
ALTER TABLE quiz_attempts 
ADD COLUMN IF NOT EXISTS exam_type VARCHAR(10) 
CHECK (exam_type IS NULL OR exam_type IN ('JAMB', 'WAEC'));

-- Add exam_year column to track specific year
ALTER TABLE quiz_attempts 
ADD COLUMN IF NOT EXISTS exam_year INTEGER;

-- Add index for filtering by mode and exam type
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_mode 
ON quiz_attempts(quiz_mode, exam_type, exam_year);

-- Add index for user history queries
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_completed 
ON quiz_attempts(user_id, completed_at DESC);

-- Add comments for documentation
COMMENT ON COLUMN quiz_attempts.quiz_mode IS 'Quiz mode: practice, exam, practice-subject, practice-year, exam-subject, exam-year, cbt';
COMMENT ON COLUMN quiz_attempts.exam_type IS 'Exam type: JAMB or WAEC (NULL for general quizzes)';
COMMENT ON COLUMN quiz_attempts.exam_year IS 'Specific exam year (NULL if not year-based)';

-- =====================================================
-- 4. Create Updated At Trigger for Timer Configurations
-- =====================================================
-- Automatically update the updated_at timestamp

CREATE OR REPLACE FUNCTION update_timer_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_timer_configurations_updated_at ON timer_configurations;

CREATE TRIGGER trigger_update_timer_configurations_updated_at
  BEFORE UPDATE ON timer_configurations
  FOR EACH ROW
  EXECUTE FUNCTION update_timer_configurations_updated_at();

-- =====================================================
-- 5. Enable Row Level Security (RLS)
-- =====================================================
-- Secure access to timer configurations

ALTER TABLE timer_configurations ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read timer configurations
CREATE POLICY "Allow authenticated users to read timer configurations"
ON timer_configurations
FOR SELECT
TO authenticated
USING (true);

-- Allow only admins to insert/update/delete timer configurations
-- Note: Adjust this policy based on your admin setup
-- For now, we'll allow service role only (you can modify this later)
CREATE POLICY "Allow service role to manage timer configurations"
ON timer_configurations
FOR ALL
TO service_role
USING (true);

-- Optionally, if you have an admin check, you can add it here
-- Example: Check if user email is in an admin list
-- CREATE POLICY "Allow specific admins to manage timer configurations"
-- ON timer_configurations
-- FOR ALL
-- TO authenticated
-- USING (auth.jwt() ->> 'email' IN ('admin@example.com'));

-- =====================================================
-- 6. Grant Permissions
-- =====================================================
-- Ensure proper access for authenticated users

GRANT SELECT ON timer_configurations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON quiz_attempts TO authenticated;

-- =====================================================
-- Migration Complete
-- =====================================================
-- The exam modes system database schema is now ready!
--
-- Next steps:
-- 1. Run this migration in your Supabase dashboard
-- 2. Verify the tables were created successfully
-- 3. Test the timer configuration lookups
-- 4. Test quiz attempt creation with new fields
-- =====================================================
