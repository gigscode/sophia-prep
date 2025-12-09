-- ============================================================================
-- MIGRATION: Add subject_id column to questions table (STEP BY STEP)
-- ============================================================================
-- Date: 2025-12-08
-- Description: Adds direct subject_id reference to questions table
-- This version breaks the migration into smaller, safer steps
-- Run each step separately if you encounter errors
-- ============================================================================

-- ============================================================================
-- STEP 1: Add subject_id column (NO foreign key yet)
-- ============================================================================
-- Run this first - it's the safest step
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS subject_id UUID;

-- ============================================================================
-- STEP 2: Create index on subject_id
-- ============================================================================
-- This improves query performance
CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON questions(subject_id);

-- ============================================================================
-- STEP 3: Backfill subject_id from topics
-- ============================================================================
-- Populate subject_id for all questions that have a topic_id
UPDATE questions q
SET subject_id = t.subject_id
FROM topics t
WHERE q.topic_id = t.id
  AND q.subject_id IS NULL;

-- ============================================================================
-- STEP 4: Add foreign key constraint
-- ============================================================================
-- Now that data is populated, add the foreign key
ALTER TABLE questions
ADD CONSTRAINT questions_subject_id_fkey
  FOREIGN KEY (subject_id)
  REFERENCES subjects(id)
  ON DELETE SET NULL;

-- ============================================================================
-- STEP 5: Make topic_id nullable
-- ============================================================================
-- Drop existing foreign key
ALTER TABLE questions
DROP CONSTRAINT IF EXISTS questions_topic_id_fkey;

-- Make column nullable
ALTER TABLE questions 
ALTER COLUMN topic_id DROP NOT NULL;

-- Re-add foreign key with ON DELETE SET NULL
ALTER TABLE questions
ADD CONSTRAINT questions_topic_id_fkey 
  FOREIGN KEY (topic_id) 
  REFERENCES topics(id) 
  ON DELETE SET NULL;

-- ============================================================================
-- STEP 6: Add check constraint
-- ============================================================================
-- Ensure every question has either subject_id or topic_id
ALTER TABLE questions
ADD CONSTRAINT questions_subject_or_topic_check
CHECK (subject_id IS NOT NULL OR topic_id IS NOT NULL);

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Check that all questions have either subject_id or topic_id
SELECT COUNT(*) as questions_with_neither
FROM questions 
WHERE subject_id IS NULL AND topic_id IS NULL;
-- Expected: 0

-- Check backfill correctness
SELECT COUNT(*) as mismatched_subject_ids
FROM questions q
JOIN topics t ON q.topic_id = t.id
WHERE q.subject_id != t.subject_id;
-- Expected: 0

-- Verify index exists
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'questions' AND indexname = 'idx_questions_subject_id';
-- Expected: 1 row

-- Check constraint exists
SELECT conname 
FROM pg_constraint 
WHERE conname = 'questions_subject_or_topic_check';
-- Expected: 1 row

-- ============================================================================
-- SUCCESS!
-- ============================================================================
