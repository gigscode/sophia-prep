-- STEP 1: Just fix missing columns first
-- Run this first, then let me know if it works

-- Add price_ngn column to subscription_plans table
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
        RAISE NOTICE 'price_ngn column already exists';
    END IF;
END $$;

-- Add exam_type column to questions table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'questions' 
        AND column_name = 'exam_type'
    ) THEN
        ALTER TABLE questions 
        ADD COLUMN exam_type TEXT CHECK (exam_type IN ('JAMB'));
        UPDATE questions SET exam_type = 'JAMB' WHERE exam_type IS NULL;
        RAISE NOTICE 'Added exam_type column to questions table';
    ELSE
        RAISE NOTICE 'exam_type column already exists';
    END IF;
END $$;

SELECT 'Step 1 completed successfully!' as result;