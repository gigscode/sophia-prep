-- ============================================================================
-- FIX: Add subject_id column to questions table
-- ============================================================================
-- This migration adds the subject_id column that is required for questions
-- to be properly associated with subjects and displayed in the quiz interface.
--
-- VERIFIED AGAINST: data/soprep-db.md schema (2025-12-10)
-- Current State: questions table has 215 rows, NO subject_id column
-- Expected Result: questions table with subject_id column + foreign key
--
-- HOW TO RUN:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to SQL Editor
-- 3. Copy and paste this entire file
-- 4. Click "Run" to execute
-- ============================================================================

-- Pre-flight check: Verify current schema
DO $$
DECLARE
    has_subject_id BOOLEAN;
    question_count INTEGER;
BEGIN
    -- Check if subject_id already exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'questions' AND column_name = 'subject_id'
    ) INTO has_subject_id;

    -- Get question count
    SELECT COUNT(*) INTO question_count FROM questions;

    RAISE NOTICE '=== PRE-FLIGHT CHECK ===';
    RAISE NOTICE 'Questions table has % rows', question_count;
    RAISE NOTICE 'subject_id column exists: %', has_subject_id;

    IF has_subject_id THEN
        RAISE NOTICE 'WARNING: subject_id column already exists. Migration may be partially applied.';
    END IF;
END $$;

-- Step 1: Add subject_id column (nullable, no constraints initially)
ALTER TABLE questions
ADD COLUMN IF NOT EXISTS subject_id UUID;

-- Step 2: Create index on subject_id for query performance
CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON questions(subject_id);

-- Step 2b: Add foreign key constraint to subjects table
-- This ensures referential integrity (questions can only reference valid subjects)
DO $$
BEGIN
    -- Check if the foreign key constraint already exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'questions_subject_id_fkey'
        AND table_name = 'questions'
    ) THEN
        ALTER TABLE questions
        ADD CONSTRAINT questions_subject_id_fkey
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON DELETE SET NULL;

        RAISE NOTICE 'Foreign key constraint added successfully';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;

-- Step 3: Get the Mathematics subject ID
DO $$
DECLARE
    math_subject_id UUID;
BEGIN
    -- Find the Mathematics subject
    SELECT id INTO math_subject_id
    FROM subjects
    WHERE slug = 'mathematics'
    LIMIT 1;
    
    -- If Mathematics subject exists, associate all questions with it
    IF math_subject_id IS NOT NULL THEN
        UPDATE questions
        SET subject_id = math_subject_id
        WHERE subject_id IS NULL;
        
        RAISE NOTICE 'Updated questions with Mathematics subject_id: %', math_subject_id;
    ELSE
        RAISE NOTICE 'Mathematics subject not found. Questions not updated.';
    END IF;
END $$;

-- Step 4: Verify the changes
SELECT 
    COUNT(*) as total_questions,
    COUNT(subject_id) as questions_with_subject,
    COUNT(*) - COUNT(subject_id) as questions_without_subject
FROM questions;

-- Step 5: Show sample questions with their subject association
SELECT 
    q.id,
    LEFT(q.question_text, 60) as question_preview,
    q.exam_type,
    q.exam_year,
    s.name as subject_name,
    s.slug as subject_slug
FROM questions q
LEFT JOIN subjects s ON q.subject_id = s.id
LIMIT 10;

-- ============================================================================
-- POST-MIGRATION VERIFICATION
-- ============================================================================
-- After running this migration, you should see:
-- 1. All questions have subject_id populated (questions_without_subject = 0)
-- 2. Sample questions show "Mathematics" as the subject_name
-- 3. Foreign key constraint exists
-- 4. Index exists for performance
-- 5. Questions should now be visible in the quiz interface
-- ============================================================================

-- Final verification report
DO $$
DECLARE
    total_questions INTEGER;
    questions_with_subject INTEGER;
    has_fk BOOLEAN;
    has_index BOOLEAN;
BEGIN
    -- Count questions
    SELECT COUNT(*) INTO total_questions FROM questions;
    SELECT COUNT(subject_id) INTO questions_with_subject FROM questions;

    -- Check foreign key
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'questions_subject_id_fkey'
        AND table_name = 'questions'
    ) INTO has_fk;

    -- Check index
    SELECT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'questions'
        AND indexname = 'idx_questions_subject_id'
    ) INTO has_index;

    RAISE NOTICE '';
    RAISE NOTICE '=== MIGRATION COMPLETE ===';
    RAISE NOTICE 'Total questions: %', total_questions;
    RAISE NOTICE 'Questions with subject_id: %', questions_with_subject;
    RAISE NOTICE 'Questions without subject_id: %', total_questions - questions_with_subject;
    RAISE NOTICE 'Foreign key constraint exists: %', has_fk;
    RAISE NOTICE 'Index exists: %', has_index;
    RAISE NOTICE '';

    IF total_questions = questions_with_subject AND has_fk AND has_index THEN
        RAISE NOTICE '✅ SUCCESS! Migration completed successfully.';
        RAISE NOTICE '✅ All questions are now associated with subjects.';
        RAISE NOTICE '✅ Questions should now be visible in the quiz interface.';
    ELSE
        RAISE WARNING '⚠️  Migration may be incomplete. Please review the results above.';
    END IF;
END $$;

