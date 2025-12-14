-- Migration to remove difficulty level features from Sophia Prep
-- This script removes difficulty_level column and related indexes
-- Uses IF EXISTS checks to handle missing tables/columns gracefully

-- 1. Drop the difficulty level index (if exists)
DROP INDEX IF EXISTS idx_questions_difficulty;

-- 2. Remove difficulty_level column from questions table (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'difficulty_level') THEN
    ALTER TABLE questions DROP COLUMN difficulty_level;
  END IF;
END $$;

-- 3. Clean up any difficulty references in metadata JSONB fields (if column exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'metadata') THEN
    UPDATE questions SET metadata = metadata - 'difficulty_level' WHERE metadata ? 'difficulty_level';
    UPDATE questions SET metadata = metadata - 'difficulty' WHERE metadata ? 'difficulty';
  END IF;
END $$;

-- 4. Remove difficulty from topics table if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'topics' AND column_name = 'difficulty') THEN
    ALTER TABLE topics DROP COLUMN difficulty;
  END IF;
END $$;

-- Verification query
SELECT 'Difficulty removal complete. Remaining difficulty columns in questions:' as status,
       (SELECT count(*) FROM information_schema.columns 
        WHERE table_name = 'questions' AND column_name LIKE '%difficulty%') as count;