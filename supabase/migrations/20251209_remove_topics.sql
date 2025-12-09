-- Remove topics table and topic_id column from questions
-- This migration removes all topic-related database structures

-- Step 1: Drop foreign key constraint if it exists
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_topic_id_fkey;

-- Step 2: Drop the topic_id column from questions table
ALTER TABLE questions DROP COLUMN IF EXISTS topic_id;

-- Step 3: Drop the topics table
DROP TABLE IF EXISTS topics CASCADE;

-- Note: This migration is destructive and cannot be easily reversed
-- Make sure you have a backup if you need to restore topic data
