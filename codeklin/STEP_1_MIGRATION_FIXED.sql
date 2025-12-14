-- ============================================================================
-- STEP 1: MIGRATE YOUR EXISTING DATA TO NEW TABLES (FIXED VERSION)
-- ============================================================================
-- Copy and paste this ENTIRE file into Supabase SQL Editor and run it

-- Step 1.1: Migrate existing subjects to new structure
INSERT INTO subjects_new (id, name, slug, description, icon, color_theme, category_id, is_mandatory, is_active, sort_order, created_at, updated_at)
SELECT 
  s.id,
  s.name,
  s.slug,
  s.description,
  s.icon,
  s.color_theme,
  sc.id as category_id,
  s.is_mandatory,
  s.is_active,
  s.sort_order,
  s.created_at,
  s.updated_at
FROM subjects s
LEFT JOIN subject_categories sc ON sc.name = s.subject_category
WHERE NOT EXISTS (SELECT 1 FROM subjects_new WHERE subjects_new.id = s.id);

-- Step 1.2: Migrate subject-exam type relationships
INSERT INTO subject_exam_types (subject_id, exam_type_id, is_mandatory)
SELECT DISTINCT
  s.id as subject_id,
  et.id as exam_type_id,
  s.is_mandatory
FROM subjects s
CROSS JOIN exam_types et
WHERE (s.exam_type = 'BOTH' OR s.exam_type = et.name)
AND NOT EXISTS (
  SELECT 1 FROM subject_exam_types 
  WHERE subject_exam_types.subject_id = s.id 
  AND subject_exam_types.exam_type_id = et.id
);

-- Step 1.3: Check what tables exist and migrate questions if possible
DO $$
DECLARE
  questions_exist BOOLEAN := FALSE;
  has_subject_id BOOLEAN := FALSE;
  migration_count INTEGER := 0;
BEGIN
  -- Check if questions table exists
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'questions'
  ) INTO questions_exist;
  
  IF questions_exist THEN
    RAISE NOTICE 'Questions table found!';
    
    -- Check if it has subject_id column
    SELECT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_name = 'questions' AND column_name = 'subject_id'
    ) INTO has_subject_id;
    
    IF has_subject_id THEN
      RAISE NOTICE 'Questions table has subject_id column - migrating...';
      
      -- Migrate questions with subject_id
      INSERT INTO questions_new (
        subject_id, exam_type_id, question_text, option_a, option_b, option_c, option_d, 
        correct_answer, explanation, difficulty_level, exam_year, question_number, 
        is_active, created_at, updated_at
      )
      SELECT 
        q.subject_id,
        COALESCE(et.id, (SELECT id FROM exam_types WHERE slug = 'jamb' LIMIT 1)) as exam_type_id,
        q.question_text,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.correct_answer,
        COALESCE(q.explanation, '') as explanation,
        COALESCE(q.difficulty_level, 'MEDIUM') as difficulty_level,
        q.exam_year,
        q.question_number,
        COALESCE(q.is_active, true) as is_active,
        COALESCE(q.created_at, NOW()) as created_at,
        COALESCE(q.updated_at, NOW()) as updated_at
      FROM questions q
      LEFT JOIN exam_types et ON et.name = q.exam_type
      WHERE q.subject_id IS NOT NULL;
      
      GET DIAGNOSTICS migration_count = ROW_COUNT;
      RAISE NOTICE 'Migrated % questions', migration_count;
      
    ELSE
      RAISE NOTICE 'Questions table found but no subject_id column. Questions will need to be uploaded fresh.';
    END IF;
    
  ELSE
    RAISE NOTICE 'No questions table found. Ready for fresh question uploads.';
  END IF;
END $$;

-- Step 1.4: Verify migration results
SELECT 'Migration Results:' as status;
SELECT 'Subjects migrated:' as table_name, COUNT(*) as count FROM subjects_new;
SELECT 'Subject-Exam relationships:' as table_name, COUNT(*) as count FROM subject_exam_types;
SELECT 'Questions migrated:' as table_name, COUNT(*) as count FROM questions_new;
SELECT 'Exam types available:' as table_name, COUNT(*) as count FROM exam_types;
SELECT 'Subject categories available:' as table_name, COUNT(*) as count FROM subject_categories;

-- Step 1.5: Show what we have now
SELECT 'Available Exam Types:' as info;
SELECT name, slug, description FROM exam_types ORDER BY sort_order;

SELECT 'Available Subject Categories:' as info;
SELECT name, slug, description FROM subject_categories ORDER BY sort_order;

SELECT 'Sample Subjects with Categories:' as info;
SELECT 
  s.name as subject_name,
  s.slug as subject_slug,
  sc.name as category_name,
  ARRAY_AGG(et.name) as exam_types
FROM subjects_new s
LEFT JOIN subject_categories sc ON s.category_id = sc.id
LEFT JOIN subject_exam_types set ON s.id = set.subject_id
LEFT JOIN exam_types et ON set.exam_type_id = et.id
GROUP BY s.id, s.name, s.slug, sc.name
ORDER BY s.sort_order
LIMIT 10;