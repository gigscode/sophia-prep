-- ============================================================================
-- VERIFICATION SCRIPT: Check if JAMB/WAEC Subjects are Seeded
-- ============================================================================
-- Run this script in Supabase SQL Editor to verify Task 1.6 completion
-- Requirements: 1.1, 1.2, 1.3
-- ============================================================================

-- Check if subjects table exists
DO $
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'subjects'
  ) THEN
    RAISE NOTICE '❌ ERROR: subjects table does not exist';
    RAISE NOTICE '   Please run complete_setup.sql first';
    RETURN;
  END IF;
  
  RAISE NOTICE '✅ subjects table exists';
END $;

-- Count total subjects
DO $
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM subjects;
  
  IF v_count = 0 THEN
    RAISE NOTICE '❌ ERROR: No subjects found in database';
    RAISE NOTICE '   Please run the subject seeding script';
  ELSIF v_count < 21 THEN
    RAISE NOTICE '⚠️  WARNING: Only % subjects found (expected 21)', v_count;
  ELSIF v_count = 21 THEN
    RAISE NOTICE '✅ SUCCESS: All 21 subjects found';
  ELSE
    RAISE NOTICE '⚠️  WARNING: % subjects found (expected 21)', v_count;
  END IF;
END $;

-- Display subject count by category
SELECT 
  '📊 Subject Categories' as info,
  subject_category,
  COUNT(*) as count
FROM subjects
GROUP BY subject_category
ORDER BY subject_category;

-- Display subject count by exam type
SELECT 
  '📊 Exam Types' as info,
  exam_type,
  COUNT(*) as count
FROM subjects
GROUP BY exam_type
ORDER BY exam_type;

-- Display mandatory subjects
SELECT 
  '⭐ Mandatory Subjects' as info,
  name,
  exam_type,
  subject_category
FROM subjects
WHERE is_mandatory = TRUE
ORDER BY name;

-- Display all subjects
SELECT 
  '📚 All Subjects' as info,
  sort_order,
  name,
  slug,
  exam_type,
  subject_category,
  CASE WHEN is_mandatory THEN '⭐' ELSE '' END as mandatory,
  is_active
FROM subjects
ORDER BY sort_order;

-- Check for expected subjects
DO $
DECLARE
  v_missing TEXT[];
  v_expected TEXT[] := ARRAY[
    'english-language', 'mathematics', 'physics', 'chemistry', 'biology',
    'further-mathematics', 'geography', 'food-nutrition', 'commerce',
    'accounting', 'economics', 'marketing', 'civic-education',
    'literature-in-english', 'government', 'crs-irs', 'music', 'history',
    'yoruba', 'hausa', 'igbo'
  ];
  v_slug TEXT;
  v_exists BOOLEAN;
BEGIN
  FOREACH v_slug IN ARRAY v_expected
  LOOP
    SELECT EXISTS(SELECT 1 FROM subjects WHERE slug = v_slug) INTO v_exists;
    IF NOT v_exists THEN
      v_missing := array_append(v_missing, v_slug);
    END IF;
  END LOOP;
  
  IF array_length(v_missing, 1) IS NULL THEN
    RAISE NOTICE '✅ All expected subjects are present';
  ELSE
    RAISE NOTICE '❌ Missing subjects: %', array_to_string(v_missing, ', ');
  END IF;
END $;

-- Final summary
DO $
DECLARE
  v_total INTEGER;
  v_general INTEGER;
  v_science INTEGER;
  v_commercial INTEGER;
  v_arts INTEGER;
  v_language INTEGER;
  v_both INTEGER;
  v_waec INTEGER;
  v_mandatory INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_total FROM subjects;
  SELECT COUNT(*) INTO v_general FROM subjects WHERE subject_category = 'GENERAL';
  SELECT COUNT(*) INTO v_science FROM subjects WHERE subject_category = 'SCIENCE';
  SELECT COUNT(*) INTO v_commercial FROM subjects WHERE subject_category = 'COMMERCIAL';
  SELECT COUNT(*) INTO v_arts FROM subjects WHERE subject_category = 'ARTS';
  SELECT COUNT(*) INTO v_language FROM subjects WHERE subject_category = 'LANGUAGE';
  SELECT COUNT(*) INTO v_both FROM subjects WHERE exam_type = 'BOTH';
  SELECT COUNT(*) INTO v_waec FROM subjects WHERE exam_type = 'WAEC';
  SELECT COUNT(*) INTO v_mandatory FROM subjects WHERE is_mandatory = TRUE;
  
  RAISE NOTICE '';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'TASK 1.6 VERIFICATION SUMMARY';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Total Subjects: % (expected: 21)', v_total;
  RAISE NOTICE '';
  RAISE NOTICE 'By Category:';
  RAISE NOTICE '  GENERAL: % (expected: 4)', v_general;
  RAISE NOTICE '  SCIENCE: % (expected: 5)', v_science;
  RAISE NOTICE '  COMMERCIAL: % (expected: 4)', v_commercial;
  RAISE NOTICE '  ARTS: % (expected: 5)', v_arts;
  RAISE NOTICE '  LANGUAGE: % (expected: 3)', v_language;
  RAISE NOTICE '';
  RAISE NOTICE 'By Exam Type:';
  RAISE NOTICE '  BOTH (JAMB & WAEC): % (expected: 17)', v_both;
  RAISE NOTICE '  WAEC only: % (expected: 4)', v_waec;
  RAISE NOTICE '';
  RAISE NOTICE 'Mandatory Subjects: % (expected: 1)', v_mandatory;
  RAISE NOTICE '';
  
  IF v_total = 21 AND v_general = 4 AND v_science = 5 AND 
     v_commercial = 4 AND v_arts = 5 AND v_language = 3 AND
     v_both = 17 AND v_waec = 4 AND v_mandatory = 1 THEN
    RAISE NOTICE '✅ TASK 1.6 COMPLETE: All subjects seeded correctly!';
  ELSE
    RAISE NOTICE '❌ TASK 1.6 INCOMPLETE: Please check the data';
  END IF;
  RAISE NOTICE '============================================';
END $;
