-- Fix subject categories to ensure correct classification
-- This migration corrects any miscategorized subjects

-- Update Science Subjects
UPDATE subjects SET subject_category = 'SCIENCE' WHERE slug IN ('physics', 'chemistry', 'biology', 'agricultural-science');

-- Update Commercial Subjects
UPDATE subjects SET subject_category = 'COMMERCIAL' WHERE slug IN ('economics', 'commerce', 'accounting', 'business-studies');

-- Update Arts Subjects
UPDATE subjects SET subject_category = 'ARTS' WHERE slug IN ('literature', 'government', 'history', 'crs', 'irs', 'geography');

-- Update Language Subjects
UPDATE subjects SET subject_category = 'LANGUAGE' WHERE slug IN ('english', 'french', 'yoruba', 'igbo', 'hausa');

-- Update General Subjects
UPDATE subjects SET subject_category = 'GENERAL' WHERE slug IN ('mathematics', 'civic-education');

-- Update Further Mathematics to SCIENCE (if it exists)
UPDATE subjects SET subject_category = 'SCIENCE' WHERE slug = 'further-mathematics';

-- Update Food & Nutrition to SCIENCE (if it exists)
UPDATE subjects SET subject_category = 'SCIENCE' WHERE slug IN ('food-nutrition', 'food-and-nutrition');
