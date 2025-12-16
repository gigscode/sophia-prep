-- ============================================================================
-- FIX ENGLISH LANGUAGE DUPLICATES
-- ============================================================================
-- This script handles the specific case where you have:
-- 1. "English Language" with slug "english" 
-- 2. "English Language" with slug "english-language"

-- First, let's see what we're working with
SELECT 
    id, 
    name, 
    slug, 
    subject_category, 
    is_mandatory,
    is_active,
    created_at
FROM subjects 
WHERE name ILIKE '%english%'
ORDER BY created_at;

-- ============================================================================
-- STEP 1: Decide which English Language subject to keep
-- ============================================================================
-- We'll keep the one with slug 'english' (matches our frontend code)
-- and remove the one with slug 'english-language'

-- Get the IDs of both English Language subjects
DO $$
DECLARE
    keep_subject_id UUID;
    remove_subject_id UUID;
    questions_moved INTEGER := 0;
BEGIN
    -- Get the subject we want to keep (slug = 'english')
    SELECT id INTO keep_subject_id 
    FROM subjects 
    WHERE name = 'English Language' AND slug = 'english'
    LIMIT 1;
    
    -- Get the subject we want to remove (slug = 'english-language')
    SELECT id INTO remove_subject_id 
    FROM subjects 
    WHERE name = 'English Language' AND slug = 'english-language'
    LIMIT 1;
    
    RAISE NOTICE 'Keep subject ID: %', keep_subject_id;
    RAISE NOTICE 'Remove subject ID: %', remove_subject_id;
    
    -- Only proceed if we found both subjects
    IF keep_subject_id IS NOT NULL AND remove_subject_id IS NOT NULL THEN
        
        -- Move questions from the duplicate to the correct one (if questions table exists)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'questions') THEN
            UPDATE questions 
            SET subject_id = keep_subject_id
            WHERE subject_id = remove_subject_id;
            
            GET DIAGNOSTICS questions_moved = ROW_COUNT;
            RAISE NOTICE 'Moved % questions from duplicate to correct English Language subject', questions_moved;
        END IF;
        
        -- Move user progress (if table exists)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_subject_progress') THEN
            UPDATE user_subject_progress 
            SET subject_id = keep_subject_id
            WHERE subject_id = remove_subject_id;
            RAISE NOTICE 'Moved user progress data';
        END IF;
        
        -- Update subscription plans to use 'english' slug
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'subscription_plans') THEN
            UPDATE subscription_plans 
            SET included_subjects = array_replace(included_subjects, 'english-language', 'english')
            WHERE 'english-language' = ANY(included_subjects);
            RAISE NOTICE 'Updated subscription plans to use english slug';
        END IF;
        
        -- Now delete the duplicate subject
        DELETE FROM subjects WHERE id = remove_subject_id;
        RAISE NOTICE 'Deleted duplicate English Language subject with slug english-language';
        
        -- Ensure the remaining subject has correct properties
        UPDATE subjects 
        SET 
            subject_category = 'LANGUAGE',
            is_mandatory = true,
            is_active = true
        WHERE id = keep_subject_id;
        RAISE NOTICE 'Updated remaining English Language subject properties';
        
    ELSE
        RAISE NOTICE 'Could not find both English Language subjects - no action taken';
    END IF;
END $$;

-- ============================================================================
-- STEP 2: Handle Literature duplicates (if they exist)
-- ============================================================================
DO $$
DECLARE
    keep_lit_id UUID;
    remove_lit_id UUID;
BEGIN
    -- Check if we have Literature duplicates
    SELECT id INTO keep_lit_id 
    FROM subjects 
    WHERE name = 'Literature in English' AND slug = 'literature'
    LIMIT 1;
    
    SELECT id INTO remove_lit_id 
    FROM subjects 
    WHERE name = 'Literature' AND slug != 'literature'
    LIMIT 1;
    
    IF keep_lit_id IS NOT NULL AND remove_lit_id IS NOT NULL THEN
        -- Move questions
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'questions') THEN
            UPDATE questions 
            SET subject_id = keep_lit_id
            WHERE subject_id = remove_lit_id;
        END IF;
        
        -- Move user progress
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_subject_progress') THEN
            UPDATE user_subject_progress 
            SET subject_id = keep_lit_id
            WHERE subject_id = remove_lit_id;
        END IF;
        
        -- Delete duplicate
        DELETE FROM subjects WHERE id = remove_lit_id;
        RAISE NOTICE 'Deleted duplicate Literature subject';
        
        -- Update remaining subject
        UPDATE subjects 
        SET 
            name = 'Literature in English',
            subject_category = 'ARTS',
            is_mandatory = false,
            is_active = true
        WHERE id = keep_lit_id;
        
    ELSE
        RAISE NOTICE 'No Literature duplicates found or already cleaned up';
    END IF;
END $$;

-- ============================================================================
-- STEP 3: Verification
-- ============================================================================

-- Check final state - English and Literature subjects
SELECT 
    id, 
    name, 
    slug, 
    subject_category, 
    is_mandatory,
    is_active
FROM subjects 
WHERE name ILIKE '%english%' OR name ILIKE '%literature%'
ORDER BY name;

-- Check for any remaining duplicates
SELECT 
    name, 
    COUNT(*) as count,
    array_agg(slug) as slugs
FROM subjects 
GROUP BY name 
HAVING COUNT(*) > 1;