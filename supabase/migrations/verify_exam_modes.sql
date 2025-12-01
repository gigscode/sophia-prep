-- =====================================================
-- Verification Queries for Exam Modes System
-- =====================================================
-- Run these queries to verify the migration was successful
-- =====================================================

-- 1. Check timer_configurations table exists and has default data
SELECT 
  exam_type,
  subject_slug,
  year,
  duration_seconds,
  ROUND(duration_seconds / 60.0, 1) as duration_minutes
FROM timer_configurations
ORDER BY exam_type;

-- Expected: 2 rows (JAMB: 2100s/35min, WAEC: 3600s/60min)

-- 2. Check quiz_attempts table has new columns
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'quiz_attempts' 
AND column_name IN ('quiz_mode', 'exam_type', 'exam_year')
ORDER BY column_name;

-- Expected: 3 rows showing the new columns

-- 3. Check indexes were created
SELECT 
  indexname,
  tablename
FROM pg_indexes
WHERE tablename IN ('timer_configurations', 'quiz_attempts')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Expected: Multiple indexes including idx_timer_configurations_lookup, idx_quiz_attempts_mode

-- 4. Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'timer_configurations'
ORDER BY policyname;

-- Expected: 2 policies (read and manage)

-- =====================================================
-- All checks passed? You're ready to test the app!
-- =====================================================
