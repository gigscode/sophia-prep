-- Remove difficulty feature from the database
-- This script removes all difficulty-related columns and constraints

-- Remove difficulty_level column from questions table
ALTER TABLE questions DROP COLUMN IF EXISTS difficulty_level;

-- Remove difficulty_level column from topics table  
ALTER TABLE topics DROP COLUMN IF EXISTS difficulty_level;

-- Drop any indexes related to difficulty
DROP INDEX IF EXISTS idx_questions_difficulty;
DROP INDEX IF EXISTS idx_questions_new_difficulty;

-- Update any stored procedures that reference difficulty
-- Note: You may need to manually update stored procedures/functions
-- that reference p_difficulty parameter or difficulty_level columns

-- Example of updating a function (adjust based on your actual functions):
-- DROP FUNCTION IF EXISTS get_practice_questions(UUID[], INTEGER, TEXT);
-- CREATE OR REPLACE FUNCTION get_practice_questions(
--   p_subject_ids UUID[],
--   p_limit INTEGER DEFAULT 20
-- )
-- RETURNS TABLE (
--   id UUID,
--   question_text TEXT,
--   option_a TEXT,
--   option_b TEXT,
--   option_c TEXT,
--   option_d TEXT,
--   correct_answer TEXT,
--   explanation TEXT,
--   subject_name TEXT
-- ) AS $$
-- BEGIN
--   RETURN QUERY
--   SELECT 
--     q.id,
--     q.question_text,
--     q.option_a,
--     q.option_b,
--     q.option_c,
--     q.option_d,
--     q.correct_answer,
--     q.explanation,
--     s.name as subject_name
--   FROM questions q
--   JOIN subjects s ON q.subject_id = s.id
--   WHERE s.id = ANY(p_subject_ids)
--     AND q.is_active = true
--     AND s.is_active = true
--   ORDER BY RANDOM()
--   LIMIT p_limit;
-- END;
-- $$ LANGUAGE plpgsql;

COMMENT ON SCHEMA public IS 'Difficulty feature removed - all difficulty_level columns and related functionality have been removed';