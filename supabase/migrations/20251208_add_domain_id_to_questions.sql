-- ============================================================================
-- MIGRATION: Add domain_id column to questions table
-- ============================================================================
-- Date: 2025-12-08
-- Description: Adds direct domain_id reference to questions table, making
--              topic_id optional to support domain-based question queries
--              without requiring topic categorization.
--
-- This migration is adapted for the actual database schema which uses:
-- - domains (not subjects)
-- - topics.domain_id (not topics.subject_id)
-- ============================================================================

-- Step 1: Add domain_id column (nullable initially for backfill)
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS domain_id UUID;

-- Step 2: Create index on domain_id for query performance
CREATE INDEX IF NOT EXISTS idx_questions_domain_id ON questions(domain_id);

-- Step 3: Backfill domain_id from existing topic relationships
-- This populates domain_id for all questions that have a valid topic_id
UPDATE questions q
SET domain_id = t.domain_id
FROM topics t
WHERE q.topic_id = t.id
  AND q.domain_id IS NULL;

-- Step 4: Add foreign key constraint for domain_id
ALTER TABLE questions
ADD CONSTRAINT questions_domain_id_fkey
  FOREIGN KEY (domain_id)
  REFERENCES domains(id)
  ON DELETE SET NULL;

-- Step 5: Make topic_id nullable (if it's currently NOT NULL)
-- First, check if there's an existing foreign key constraint
ALTER TABLE questions
DROP CONSTRAINT IF EXISTS questions_topic_id_fkey;

-- Make the column nullable
ALTER TABLE questions 
ALTER COLUMN topic_id DROP NOT NULL;

-- Re-add the foreign key constraint with ON DELETE SET NULL
ALTER TABLE questions
ADD CONSTRAINT questions_topic_id_fkey 
  FOREIGN KEY (topic_id) 
  REFERENCES topics(id) 
  ON DELETE SET NULL;

-- Step 6: Add check constraint to ensure either domain_id or topic_id is provided
-- This ensures data integrity - every question must be associated with at least
-- a domain or a topic
ALTER TABLE questions
ADD CONSTRAINT questions_domain_or_topic_check
CHECK (domain_id IS NOT NULL OR topic_id IS NOT NULL);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries after migration to verify correctness:

-- 1. Check that all questions have either domain_id or topic_id:
SELECT COUNT(*) as questions_with_neither
FROM questions 
WHERE domain_id IS NULL AND topic_id IS NULL;
-- Expected: 0

-- 2. Check backfill correctness (domain_id matches topic's domain_id):
SELECT COUNT(*) as mismatched_domain_ids
FROM questions q
JOIN topics t ON q.topic_id = t.id
WHERE q.domain_id != t.domain_id;
-- Expected: 0

-- 3. Verify index exists:
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'questions' AND indexname = 'idx_questions_domain_id';
-- Expected: 1 row

-- 4. Check constraint exists:
SELECT conname 
FROM pg_constraint 
WHERE conname = 'questions_domain_or_topic_check';
-- Expected: 1 row

-- 5. Sample data check:
SELECT 
  COUNT(*) as total_questions,
  COUNT(domain_id) as with_domain_id,
  COUNT(topic_id) as with_topic_id,
  ROUND(COUNT(domain_id)::numeric / COUNT(*)::numeric * 100, 2) as domain_id_percentage
FROM questions;

-- ============================================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ============================================================================
-- To rollback this migration:
--
-- 1. Remove check constraint:
--    ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_domain_or_topic_check;
--
-- 2. Make topic_id NOT NULL again (if it was before):
--    ALTER TABLE questions ALTER COLUMN topic_id SET NOT NULL;
--
-- 3. Drop foreign key:
--    ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_domain_id_fkey;
--
-- 4. Drop domain_id column:
--    ALTER TABLE questions DROP COLUMN IF EXISTS domain_id;
--
-- 5. Drop index:
--    DROP INDEX IF EXISTS idx_questions_domain_id;
-- ============================================================================
