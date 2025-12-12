-- ============================================================================
-- STEP 1: MIGRATE YOUR EXISTING DATA TO NEW TABLES
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

-- Step 1.3: Migrate existing questions (if any exist)
-- First, let's check if questions table exists and what columns it has
DO $$
BEGIN
  -- Check if questions table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'questions') THEN
    
    -- Check if questions table has subject_id column directly
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'subject_id') THEN
      
      -- Questions table has subject_id column - migrate directly
      INSERT INTO questions_new (
        id, subject_id, exam_type_id, question_text, option_a, option_b, option_c, option_d, 
        correct_answer, explanation, difficulty_level, exam_year, question_number, 
        metadata, is_active, created_at, updated_at
      )
      SELECT 
        q.id,
        q.subject_id, -- Use subject_id directly
        et.id as exam_type_id,
        q.question_text,
        q.option_a,
        q.option_b,
        q.option_c,
        q.option_d,
        q.correct_answer,
        q.explanation,
        COALESCE(q.difficulty_level, 'MEDIUM') as difficulty_level,
        q.exam_year,
        q.question_number,
        COALESCE(q.metadata, '{}') as metadata,
        q.is_active,
        q.created_at,
        q.updated_at
      FROM questions q
      LEFT JOIN exam_types et ON et.name = q.exam_type
      WHERE NOT EXISTS (SELECT 1 FROM questions_new WHERE questions_new.id = q.id);
      
    ELSE
      -- Questions table doesn't have subject_id - skip migration for now
      RAISE NOTICE 'Questions table exists but no subject_id column found. Skipping question migration.';
    END IF;
    
  ELSE
    RAISE NOTICE 'No questions table found. Skipping question migration.';
  END IF;
END $$;

-- Step 1.4: Verify migration results
SELECT 'Migration Results:' as status;
SELECT 'Subjects migrated:' as table_name, COUNT(*) as count FROM subjects_new;
SELECT 'Subject-Exam relationships:' as table_name, COUNT(*) as count FROM subject_exam_types;
SELECT 'Questions migrated:' as table_name, COUNT(*) as count FROM questions_new;
SELECT 'Exam types available:' as table_name, COUNT(*) as count FROM exam_types;
SELECT 'Subject categories available:' as table_name, COUNT(*) as count FROM subject_categories;