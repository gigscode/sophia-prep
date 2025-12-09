-- ============================================================================
-- STEP 1 ONLY: Add subject_id column (NO constraints, NO foreign keys)
-- ============================================================================
-- This is the safest first step - just adds the column
-- Run this FIRST, then verify it worked before proceeding
-- ============================================================================

-- Add the column (nullable, no foreign key yet)
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS subject_id UUID;

-- Verify it was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'questions' AND column_name = 'subject_id';

-- Expected output: subject_id | uuid | YES
