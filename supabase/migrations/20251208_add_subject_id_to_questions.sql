-- ============================================================================
-- MIGRATION: Add subject_id column to questions table
-- ============================================================================
-- Date: 2025-12-08
-- Description: Adds direct subject_id reference to questions table, making
--              topic_id optional to support subject-based question queries
--              without requiring topic categorization.
--
-- Requirements: 2.1, 2.2, 2.3, 4.1, 4.4
-- ============================================================================

-- Step 1: Add subject_id column (nullable initially for backfill)
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS subject_id UUID REFERENCES public.subjects(id) ON DELETE SET NULL;

-- Step 2: Create index on subject_id for query performance
CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON public.questions(subject_id);

-- Step 3: Backfill subject_id from existing topic relationships
-- This populates subject_id for all questions that have a valid topic_id
UPDATE public.questions q
SET subject_id = t.subject_id
FROM public.topics t
WHERE q.topic_id = t.id
  AND q.subject_id IS NULL;

-- Step 4: Make topic_id nullable (was previously NOT NULL)
-- First, drop the existing foreign key constraint
ALTER TABLE public.questions
DROP CONSTRAINT IF EXISTS questions_topic_id_fkey;

-- Make the column nullable
ALTER TABLE public.questions 
ALTER COLUMN topic_id DROP NOT NULL;

-- Re-add the foreign key constraint with ON DELETE SET NULL
ALTER TABLE public.questions
ADD CONSTRAINT questions_topic_id_fkey 
  FOREIGN KEY (topic_id) 
  REFERENCES public.topics(id) 
  ON DELETE SET NULL;

-- Step 5: Add check constraint to ensure either subject_id or topic_id is provided
-- This ensures data integrity - every question must be associated with at least
-- a subject or a topic
ALTER TABLE public.questions
ADD CONSTRAINT questions_subject_or_topic_check
CHECK (subject_id IS NOT NULL OR topic_id IS NOT NULL);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries after migration to verify correctness:
--
-- 1. Check that all questions have either subject_id or topic_id:
--    SELECT COUNT(*) FROM questions WHERE subject_id IS NULL AND topic_id IS NULL;
--    Expected: 0
--
-- 2. Check backfill correctness (subject_id matches topic's subject_id):
--    SELECT COUNT(*) FROM questions q
--    JOIN topics t ON q.topic_id = t.id
--    WHERE q.subject_id != t.subject_id;
--    Expected: 0
--
-- 3. Verify index exists:
--    SELECT indexname FROM pg_indexes 
--    WHERE tablename = 'questions' AND indexname = 'idx_questions_subject_id';
--    Expected: 1 row
--
-- 4. Check constraint exists:
--    SELECT conname FROM pg_constraint 
--    WHERE conname = 'questions_subject_or_topic_check';
--    Expected: 1 row
-- ============================================================================

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================
-- To rollback this migration:
--
-- 1. Remove check constraint:
--    ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_subject_or_topic_check;
--
-- 2. Make topic_id NOT NULL again:
--    ALTER TABLE questions ALTER COLUMN topic_id SET NOT NULL;
--
-- 3. Drop subject_id column:
--    ALTER TABLE questions DROP COLUMN IF EXISTS subject_id;
--
-- 4. Drop index:
--    DROP INDEX IF EXISTS idx_questions_subject_id;
-- ============================================================================
