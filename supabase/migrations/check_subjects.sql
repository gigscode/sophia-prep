-- ============================================================================
-- QUICK CHECK: Are subjects already seeded?
-- ============================================================================
-- Run this first to see if you need to seed subjects
-- ============================================================================

-- Check if subjects table exists and has data
DO $
DECLARE
  v_count INTEGER;
BEGIN
  -- Check if table exists
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'subjects'
  ) THEN
    RAISE NOTICE '❌ subjects table does not exist';
    RAISE NOTICE '   You need to create tables first';
    RETURN;
  END IF;
  
  -- Count subjects
  SELECT COUNT(*) INTO v_count FROM subjects;
  
  IF v_count = 0 THEN
    RAISE NOTICE '⚠️  subjects table is EMPTY';
    RAISE NOTICE '   You need to run: seed_subjects_only.sql';
  ELSIF v_count = 21 THEN
    RAISE NOTICE '✅ All 21 subjects are already seeded!';
    RAISE NOTICE '   Task 1.6 is COMPLETE - no action needed';
  ELSE
    RAISE NOTICE '⚠️  Found % subjects (expected 21)', v_count;
    RAISE NOTICE '   You may need to re-run: seed_subjects_only.sql';
  END IF;
END $;

-- Show current subjects
SELECT 
  COUNT(*) as total_subjects,
  COUNT(*) FILTER (WHERE subject_category = 'GENERAL') as general,
  COUNT(*) FILTER (WHERE subject_category = 'SCIENCE') as science,
  COUNT(*) FILTER (WHERE subject_category = 'COMMERCIAL') as commercial,
  COUNT(*) FILTER (WHERE subject_category = 'ARTS') as arts,
  COUNT(*) FILTER (WHERE subject_category = 'LANGUAGE') as language
FROM subjects;

-- List subjects if any exist
SELECT 
  sort_order,
  name,
  exam_type,
  subject_category
FROM subjects
ORDER BY sort_order;
