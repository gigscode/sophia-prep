-- ============================================================================
-- CLEANUP DUPLICATE SUBJECTS
-- ============================================================================
-- This script removes duplicate subjects and ensures consistency
-- Run this in your Supabase SQL editor

-- First, let's see what subjects currently exist
SELECT 
    id, 
    name, 
    slug, 
    subject_category, 
    is_mandatory,
    is_active,
    created_at
FROM subjects 
WHERE name ILIKE '%english%' OR name ILIKE '%literature%'
ORDER BY name, created_at;

-- ============================================================================
-- STEP 1: Remove duplicate "English" subject (keep "English Language")
-- ============================================================================

-- First, move any questions from the duplicate "English" subject to "English Language"
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'questions') THEN
        UPDATE questions 
        SET subject_id = (
            SELECT id FROM subjects 
            WHERE slug = 'english' AND name = 'English Language'
            LIMIT 1
        )
        WHERE subject_id IN (
            SELECT id FROM subjects 
            WHERE name = 'English' AND slug != 'english'
        );
        RAISE NOTICE 'Updated questions table for English duplicates';
    ELSE
        RAISE NOTICE 'questions table does not exist - skipping';
    END IF;
END $$;

-- Move any user progress from duplicate English to correct one (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_subject_progress') THEN
        UPDATE user_subject_progress 
        SET subject_id = (
            SELECT id FROM subjects 
            WHERE slug = 'english' AND name = 'English Language'
            LIMIT 1
        )
        WHERE subject_id IN (
            SELECT id FROM subjects 
            WHERE name = 'English' AND slug != 'english'
        );
        RAISE NOTICE 'Updated user_subject_progress table';
    ELSE
        RAISE NOTICE 'user_subject_progress table does not exist - skipping';
    END IF;
END $$;

-- Delete the duplicate "English" subject (not "English Language")
DELETE FROM subjects 
WHERE name = 'English' AND slug != 'english';

-- ============================================================================
-- STEP 2: Remove duplicate "Literature" subject (keep "Literature in English")
-- ============================================================================

-- Move any questions from the duplicate "Literature" subject to "Literature in English"
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'questions') THEN
        UPDATE questions 
        SET subject_id = (
            SELECT id FROM subjects 
            WHERE slug = 'literature' AND name = 'Literature in English'
            LIMIT 1
        )
        WHERE subject_id IN (
            SELECT id FROM subjects 
            WHERE name = 'Literature' AND slug != 'literature'
        );
        RAISE NOTICE 'Updated questions table for Literature duplicates';
    ELSE
        RAISE NOTICE 'questions table does not exist - skipping';
    END IF;
END $$;

-- Move any user progress from duplicate Literature to correct one (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_subject_progress') THEN
        UPDATE user_subject_progress 
        SET subject_id = (
            SELECT id FROM subjects 
            WHERE slug = 'literature' AND name = 'Literature in English'
            LIMIT 1
        )
        WHERE subject_id IN (
            SELECT id FROM subjects 
            WHERE name = 'Literature' AND slug != 'literature'
        );
        RAISE NOTICE 'Updated user_subject_progress table';
    ELSE
        RAISE NOTICE 'user_subject_progress table does not exist - skipping';
    END IF;
END $$;

-- Delete the duplicate "Literature" subject (not "Literature in English")
DELETE FROM subjects 
WHERE name = 'Literature' AND slug != 'literature';

-- ============================================================================
-- STEP 3: Ensure correct subject properties
-- ============================================================================

-- Make sure English Language is properly configured
UPDATE subjects 
SET 
    name = 'English Language',
    subject_category = 'LANGUAGE',
    is_mandatory = true,
    is_active = true
WHERE slug = 'english';

-- Make sure Literature in English is properly configured
UPDATE subjects 
SET 
    name = 'Literature in English',
    subject_category = 'ARTS',
    is_mandatory = false,
    is_active = true
WHERE slug = 'literature';

-- ============================================================================
-- STEP 4: Verification - Check final state
-- ============================================================================

-- Verify the cleanup worked
SELECT 
    id, 
    name, 
    slug, 
    subject_category, 
    is_mandatory,
    is_active,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'questions') 
        THEN (SELECT COUNT(*) FROM questions WHERE subject_id = subjects.id)
        ELSE 0 
    END as question_count
FROM subjects 
WHERE name ILIKE '%english%' OR name ILIKE '%literature%'
ORDER BY name;

-- Check for any remaining duplicates
SELECT 
    name, 
    COUNT(*) as count
FROM subjects 
GROUP BY name 
HAVING COUNT(*) > 1;

-- ============================================================================
-- STEP 5: Update subscription plans to use correct slugs
-- ============================================================================

-- Update subscription plans that might reference old slugs
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans') THEN
        UPDATE subscription_plans 
        SET included_subjects = array_replace(included_subjects, 'english-language', 'english')
        WHERE 'english-language' = ANY(included_subjects);

        UPDATE subscription_plans 
        SET included_subjects = array_replace(included_subjects, 'literature-in-english', 'literature')
        WHERE 'literature-in-english' = ANY(included_subjects);
        
        RAISE NOTICE 'Updated subscription_plans table';
    ELSE
        RAISE NOTICE 'subscription_plans table does not exist - skipping';
    END IF;
END $$;

-- Verify subscription plans (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans') THEN
        RAISE NOTICE 'Subscription plans verification:';
        PERFORM * FROM subscription_plans 
        WHERE 'english' = ANY(included_subjects) OR 'literature' = ANY(included_subjects);
    ELSE
        RAISE NOTICE 'subscription_plans table does not exist - skipping verification';
    END IF;
END $$;

-- Cleanup completed successfully!