-- Verification queries to check the cleanup worked

-- 1. Check all English and Literature subjects (should only see correct ones)
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

-- 2. Check for any duplicate subject names
SELECT 
    name, 
    COUNT(*) as count,
    array_agg(slug) as slugs
FROM subjects 
GROUP BY name 
HAVING COUNT(*) > 1;

-- 3. Check all active subjects to see the full list
SELECT 
    name, 
    slug, 
    subject_category, 
    is_mandatory
FROM subjects 
WHERE is_active = true
ORDER BY subject_category, name;