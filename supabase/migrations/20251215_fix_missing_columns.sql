-- Fix missing columns that are causing console errors
-- Date: 2025-12-15
-- Description: Add missing price_ngn and exam_type columns

-- Add price_ngn column to subscription_plans table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscription_plans' 
        AND column_name = 'price_ngn'
    ) THEN
        ALTER TABLE subscription_plans 
        ADD COLUMN price_ngn DECIMAL(10,2) DEFAULT 0 CHECK (price_ngn >= 0);
        
        RAISE NOTICE 'Added price_ngn column to subscription_plans table';
    ELSE
        RAISE NOTICE 'price_ngn column already exists in subscription_plans table';
    END IF;
END $$;

-- Add exam_type column to questions table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'questions' 
        AND column_name = 'exam_type'
    ) THEN
        ALTER TABLE questions 
        ADD COLUMN exam_type TEXT CHECK (exam_type IN ('JAMB'));
        
        -- Set default value for existing questions
        UPDATE questions SET exam_type = 'JAMB' WHERE exam_type IS NULL;
        
        RAISE NOTICE 'Added exam_type column to questions table';
    ELSE
        RAISE NOTICE 'exam_type column already exists in questions table';
    END IF;
END $$;

-- Create index on exam_type for better performance
CREATE INDEX IF NOT EXISTS idx_questions_exam_type ON questions(exam_type);

-- Update any existing subscription plans to have a default price if needed
UPDATE subscription_plans 
SET price_ngn = 0 
WHERE price_ngn IS NULL;