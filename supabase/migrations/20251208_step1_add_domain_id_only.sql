-- ============================================================================
-- STEP 1 ONLY: Add domain_id column to questions
-- ============================================================================
-- This is the safest first step - just adds the column
-- Run this FIRST, then verify it worked before proceeding
-- ============================================================================

-- Add the column (nullable, no foreign key yet)
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS domain_id UUID;

-- Verify it was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'questions' AND column_name = 'domain_id';

-- Expected output: domain_id | uuid | YES

-- Check current questions structure
SELECT 
  COUNT(*) as total_questions,
  COUNT(topic_id) as with_topic_id,
  COUNT(domain_id) as with_domain_id
FROM questions;
