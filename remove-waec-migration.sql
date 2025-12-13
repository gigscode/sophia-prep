-- Migration to remove all WAEC-related content from Sophia Prep
-- This script removes WAEC exam type, WAEC-only subjects, and updates references
-- Uses IF EXISTS checks to handle tables that may not exist

-- 1. Remove WAEC-only subjects (if subjects table exists)
DELETE FROM subjects WHERE exam_type = 'WAEC';

-- 2. Update subjects that were 'BOTH' to be 'JAMB' only
UPDATE subjects SET exam_type = 'JAMB' WHERE exam_type = 'BOTH';

-- 3. Remove WAEC questions
DELETE FROM questions WHERE exam_type = 'WAEC';

-- 4. Update user profiles to remove WAEC exam type (if table and column exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'exam_type') THEN
    UPDATE user_profiles SET exam_type = 'JAMB' WHERE exam_type = 'WAEC';
    UPDATE user_profiles SET exam_type = 'JAMB' WHERE exam_type = 'BOTH';
  END IF;
END $$;

-- 5. Update quiz sessions to remove WAEC exam type (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'quiz_sessions') THEN
    EXECUTE 'UPDATE quiz_sessions SET exam_type = ''JAMB'' WHERE exam_type = ''WAEC''';
  END IF;
END $$;

-- 6. Update subject combinations to remove WAEC exam type (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subject_combinations') THEN
    EXECUTE 'UPDATE subject_combinations SET exam_type = ''JAMB'' WHERE exam_type = ''WAEC''';
    EXECUTE 'UPDATE subject_combinations SET exam_type = ''JAMB'' WHERE exam_type = ''BOTH''';
  END IF;
END $$;

-- 7. Remove WAEC timer configurations if table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'timer_configurations') THEN
    EXECUTE 'DELETE FROM timer_configurations WHERE exam_type = ''WAEC''';
  END IF;
END $$;

-- 8. Clean up any WAEC references in metadata JSONB fields (if column exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'subjects' AND column_name = 'metadata') THEN
    UPDATE subjects SET metadata = jsonb_set(metadata, '{exam_type}', '"JAMB"') 
    WHERE metadata ? 'exam_type' AND metadata->>'exam_type' IN ('WAEC', 'BOTH');
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'metadata') THEN
    UPDATE questions SET metadata = jsonb_set(metadata, '{exam_type}', '"JAMB"') 
    WHERE metadata ? 'exam_type' AND metadata->>'exam_type' = 'WAEC';
  END IF;
END $$;

-- Verification query
SELECT 'WAEC removal complete. Remaining WAEC subjects:' as status, 
       (SELECT count(*) FROM subjects WHERE exam_type = 'WAEC') as count;