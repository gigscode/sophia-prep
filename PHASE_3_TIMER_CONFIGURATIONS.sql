-- =====================================================
-- Phase 3: Timer Configurations for Proportional Timing
-- =====================================================
-- This migration adds default timer configurations for
-- JAMB and WAEC exams to support proportional timing
-- =====================================================

-- Pre-flight check: Verify timer_configurations table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'timer_configurations'
  ) THEN
    RAISE EXCEPTION 'timer_configurations table does not exist. Please create it first.';
  END IF;
END $$;

-- =====================================================
-- 1. Default Full Exam Configurations
-- =====================================================

-- JAMB Full Exam: 2.5 hours (9000 seconds) for 4 subjects
INSERT INTO timer_configurations (exam_type, subject_slug, year, duration_seconds)
VALUES ('JAMB', NULL, NULL, 9000)
ON CONFLICT (exam_type, subject_slug, year) 
DO UPDATE SET 
  duration_seconds = EXCLUDED.duration_seconds,
  updated_at = NOW();

-- WAEC Full Exam: 3 hours (10800 seconds) for 9 subjects
INSERT INTO timer_configurations (exam_type, subject_slug, year, duration_seconds)
VALUES ('WAEC', NULL, NULL, 10800)
ON CONFLICT (exam_type, subject_slug, year) 
DO UPDATE SET 
  duration_seconds = EXCLUDED.duration_seconds,
  updated_at = NOW();

-- =====================================================
-- 2. Subject-Specific Configurations (Optional)
-- =====================================================
-- These are optional overrides for specific subjects
-- If not set, the proportional calculation will be used

-- JAMB Mathematics: 37.5 minutes (2250 seconds)
-- Calculated as: 9000s / 4 subjects = 2250s per subject
INSERT INTO timer_configurations (exam_type, subject_slug, year, duration_seconds)
VALUES ('JAMB', 'mathematics', NULL, 2250)
ON CONFLICT (exam_type, subject_slug, year) 
DO UPDATE SET 
  duration_seconds = EXCLUDED.duration_seconds,
  updated_at = NOW();

-- JAMB English: 37.5 minutes (2250 seconds)
INSERT INTO timer_configurations (exam_type, subject_slug, year, duration_seconds)
VALUES ('JAMB', 'english', NULL, 2250)
ON CONFLICT (exam_type, subject_slug, year) 
DO UPDATE SET 
  duration_seconds = EXCLUDED.duration_seconds,
  updated_at = NOW();

-- JAMB Physics: 37.5 minutes (2250 seconds)
INSERT INTO timer_configurations (exam_type, subject_slug, year, duration_seconds)
VALUES ('JAMB', 'physics', NULL, 2250)
ON CONFLICT (exam_type, subject_slug, year) 
DO UPDATE SET 
  duration_seconds = EXCLUDED.duration_seconds,
  updated_at = NOW();

-- JAMB Chemistry: 37.5 minutes (2250 seconds)
INSERT INTO timer_configurations (exam_type, subject_slug, year, duration_seconds)
VALUES ('JAMB', 'chemistry', NULL, 2250)
ON CONFLICT (exam_type, subject_slug, year) 
DO UPDATE SET 
  duration_seconds = EXCLUDED.duration_seconds,
  updated_at = NOW();

-- JAMB Biology: 37.5 minutes (2250 seconds)
INSERT INTO timer_configurations (exam_type, subject_slug, year, duration_seconds)
VALUES ('JAMB', 'biology', NULL, 2250)
ON CONFLICT (exam_type, subject_slug, year) 
DO UPDATE SET 
  duration_seconds = EXCLUDED.duration_seconds,
  updated_at = NOW();

-- WAEC subjects: 20 minutes (1200 seconds) per subject
-- Calculated as: 10800s / 9 subjects = 1200s per subject

INSERT INTO timer_configurations (exam_type, subject_slug, year, duration_seconds)
VALUES ('WAEC', 'mathematics', NULL, 1200)
ON CONFLICT (exam_type, subject_slug, year) 
DO UPDATE SET 
  duration_seconds = EXCLUDED.duration_seconds,
  updated_at = NOW();

INSERT INTO timer_configurations (exam_type, subject_slug, year, duration_seconds)
VALUES ('WAEC', 'english', NULL, 1200)
ON CONFLICT (exam_type, subject_slug, year) 
DO UPDATE SET 
  duration_seconds = EXCLUDED.duration_seconds,
  updated_at = NOW();

-- =====================================================
-- 3. Verification
-- =====================================================

-- Display all timer configurations
SELECT 
  exam_type,
  COALESCE(subject_slug, 'ALL SUBJECTS') as subject,
  COALESCE(year::text, 'ALL YEARS') as year,
  duration_seconds,
  CONCAT(
    FLOOR(duration_seconds / 60), 
    ' min ', 
    duration_seconds % 60, 
    ' sec'
  ) as duration_formatted,
  created_at,
  updated_at
FROM timer_configurations
ORDER BY exam_type, subject_slug NULLS FIRST, year NULLS FIRST;

-- =====================================================
-- Success Message
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ Timer configurations added successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '- JAMB Full Exam: 2.5 hours (9000s)';
  RAISE NOTICE '- WAEC Full Exam: 3 hours (10800s)';
  RAISE NOTICE '- JAMB per subject: ~37.5 min (2250s)';
  RAISE NOTICE '- WAEC per subject: ~20 min (1200s)';
  RAISE NOTICE '';
  RAISE NOTICE 'Note: For subjects without specific configs, proportional timing will be calculated automatically based on question count.';
END $$;

