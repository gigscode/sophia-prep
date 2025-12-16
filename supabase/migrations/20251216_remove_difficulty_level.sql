-- Remove difficulty_level from topics table
-- Date: 2025-12-16
-- Description: Remove difficulty_level column from topics table as it's not being used

-- 1. Drop difficulty_level column from topics table if it exists
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'topics' 
        AND column_name = 'difficulty_level'
    ) THEN
        ALTER TABLE topics DROP COLUMN difficulty_level;
        RAISE NOTICE 'Removed difficulty_level column from topics table';
    ELSE
        RAISE NOTICE 'difficulty_level column does not exist in topics table';
    END IF;
END $$;

-- 2. Verify removal
SELECT 'Difficulty level removal complete' as status;

