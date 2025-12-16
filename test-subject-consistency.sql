-- Test Subject Consistency
-- Run this to verify all subjects are properly set up

-- 1. Check all English and Literature subjects (should only be one of each)
SELECT 
    'English/Literature Subjects' as test_name,
    id, 
    name, 
    slug, 
    subject_category, 
    is_mandatory,
    is_active
FROM subjects 
WHERE name ILIKE '%english%' OR name ILIKE '%literature%'
ORDER BY name;

-- 2. Verify no duplicate subject names exist
SELECT 
    'Duplicate Check' as test_name,
    name, 
    COUNT(*) as count,
    array_agg(slug) as slugs
FROM subjects 
GROUP BY name 
HAVING COUNT(*) > 1;

-- 3. Check that English Language is properly configured
SELECT 
    'English Language Config' as test_name,
    CASE 
        WHEN name = 'English Language' AND slug = 'english' AND is_mandatory = true AND subject_category = 'LANGUAGE' 
        THEN '✅ CORRECT' 
        ELSE '❌ NEEDS FIX' 
    END as status,
    name, slug, is_mandatory, subject_category
FROM subjects 
WHERE slug = 'english';

-- 4. Check that Literature in English is properly configured  
SELECT 
    'Literature Config' as test_name,
    CASE 
        WHEN name = 'Literature in English' AND slug = 'literature' AND is_mandatory = false AND subject_category = 'ARTS'
        THEN '✅ CORRECT' 
        ELSE '❌ NEEDS FIX' 
    END as status,
    name, slug, is_mandatory, subject_category
FROM subjects 
WHERE slug = 'literature';

-- 5. Check all active subjects for overview
SELECT 
    'All Active Subjects' as test_name,
    name, 
    slug, 
    subject_category, 
    is_mandatory,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'questions') 
        THEN (SELECT COUNT(*) FROM questions WHERE subject_id = subjects.id)
        ELSE 0 
    END as question_count
FROM subjects 
WHERE is_active = true
ORDER BY subject_category, name;