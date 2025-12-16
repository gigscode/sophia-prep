-- Step 1: Add slug column to topics table
-- Date: 2025-12-16
-- Description: Add slug column for URL-friendly topic identifiers

-- Add slug column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'topics' 
        AND column_name = 'slug'
    ) THEN
        ALTER TABLE topics ADD COLUMN slug TEXT;
        RAISE NOTICE 'Added slug column to topics table';
    ELSE
        RAISE NOTICE 'slug column already exists in topics table';
    END IF;
END $$;

-- Create unique index on subject_id + slug combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_topics_subject_slug 
ON topics(subject_id, slug);

-- Add comment
COMMENT ON COLUMN topics.slug IS 'URL-friendly identifier for the topic';

