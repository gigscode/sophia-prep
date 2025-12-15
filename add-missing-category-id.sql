-- Add category_id column if it's missing from topics table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'topics' 
        AND column_name = 'category_id'
    ) THEN
        ALTER TABLE topics 
        ADD COLUMN category_id UUID REFERENCES topic_categories(id) ON DELETE SET NULL;
        
        -- Now create the index
        CREATE INDEX IF NOT EXISTS idx_topics_category_id ON topics(category_id);
        
        RAISE NOTICE 'Added category_id column and index to topics table';
    ELSE
        RAISE NOTICE 'category_id column already exists';
    END IF;
END $$;

SELECT 'Category ID column added successfully!' as result;