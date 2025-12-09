-- ============================================================================
-- SAFE STEP 1: Add subject_id column without any constraints
-- ============================================================================
-- This adds just the column, no foreign keys, no constraints
-- This should work regardless of schema permissions
-- ============================================================================

-- Add the column (nullable, no constraints)
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS subject_id UUID;

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'questions' 
  AND column_name = 'subject_id';

-- Expected result: One row showing subject_id column exists