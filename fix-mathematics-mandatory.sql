-- Fix Mathematics to be non-mandatory
-- Only English Language should be mandatory for all JAMB students

UPDATE subjects 
SET is_mandatory = false 
WHERE slug = 'mathematics';

-- Verify the change
SELECT name, slug, subject_category, is_mandatory 
FROM subjects 
WHERE slug IN ('english', 'mathematics')
ORDER BY sort_order;