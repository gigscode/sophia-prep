-- STEP 4A: Just add topic_id column to questions
-- Run this first

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'questions' 
        AND column_name = 'topic_id'
    ) THEN
        ALTER TABLE questions 
        ADD COLUMN topic_id UUID REFERENCES topics(id) ON DELETE SET NULL;
        RAISE NOTICE 'Added topic_id column to questions table';
    ELSE
        RAISE NOTICE 'topic_id column already exists';
    END IF;
END $$;

SELECT 'Step 4A completed - topic_id added to questions!' as result;