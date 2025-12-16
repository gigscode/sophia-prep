-- Simple query to see exactly what English subjects you have
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