-- Simple fix for English Language duplicates
-- Step by step approach

-- 1. First, let's see what English subjects we have
SELECT 
    id, 
    name, 
    slug, 
    subject_category, 
    is_mandatory,
    is_active
FROM subjects 
WHERE name ILIKE '%english%'
ORDER BY name, slug;

-- 2. Move any questions from 'english-language' slug to 'english' slug
UPDATE questions 
SET subject_id = (
    SELECT id FROM subjects 
    WHERE name = 'English Language' AND slug = 'english'
    LIMIT 1
)
WHERE subject_id = (
    SELECT id FROM subjects 
    WHERE name = 'English Language' AND slug = 'english-language'
    LIMIT 1
);

-- 3. Update subscription plans to use 'english' instead of 'english-language'
UPDATE subscription_plans 
SET included_subjects = array_replace(included_subjects, 'english-language', 'english')
WHERE 'english-language' = ANY(included_subjects);

-- 4. Delete the duplicate English Language subject with 'english-language' slug
DELETE FROM subjects 
WHERE name = 'English Language' AND slug = 'english-language';

-- 5. Ensure the remaining English Language subject has correct properties
UPDATE subjects 
SET 
    subject_category = 'LANGUAGE',
    is_mandatory = true,
    is_active = true
WHERE name = 'English Language' AND slug = 'english';

-- 6. Verify the fix worked
SELECT 
    id, 
    name, 
    slug, 
    subject_category, 
    is_mandatory,
    is_active
FROM subjects 
WHERE name ILIKE '%english%'
ORDER BY name, slug;