-- Fix Mathematics 2022 Questions - Move Misassigned Questions to Correct Subjects
-- Run this SQL in your Supabase SQL Editor

-- First, let's see what we're working with
SELECT 
    s.name as subject_name,
    s.slug as subject_slug,
    COUNT(*) as question_count
FROM questions q
JOIN subjects s ON q.subject_id = s.id
WHERE q.exam_year = 2022 AND q.is_active = true
GROUP BY s.id, s.name, s.slug
ORDER BY question_count DESC;

-- Get the subject IDs we need
WITH subject_ids AS (
    SELECT 
        id as math_id,
        'mathematics' as type
    FROM subjects 
    WHERE slug = 'mathematics'
    
    UNION ALL
    
    SELECT 
        id as english_id,
        'english-language' as type
    FROM subjects 
    WHERE slug = 'english-language'
    
    UNION ALL
    
    SELECT 
        id as literature_id,
        'literature-in-english' as type
    FROM subjects 
    WHERE slug = 'literature-in-english'
)
SELECT * FROM subject_ids;

-- Step 1: Move Literature questions (questions about novels, characters, etc.)
UPDATE questions 
SET subject_id = (SELECT id FROM subjects WHERE slug = 'literature-in-english')
WHERE subject_id = (SELECT id FROM subjects WHERE slug = 'mathematics')
AND exam_year = 2022
AND (
    LOWER(question_text) LIKE '%novel%' OR
    LOWER(question_text) LIKE '%character%' OR
    LOWER(question_text) LIKE '%narrator%' OR
    LOWER(question_text) LIKE '%protagonist%' OR
    LOWER(question_text) LIKE '%author%' OR
    LOWER(question_text) LIKE '%story%' OR
    LOWER(question_text) LIKE '%plot%' OR
    LOWER(question_text) LIKE '%ummi%' OR
    LOWER(question_text) LIKE '%salma%' OR
    LOWER(question_text) LIKE '%bint%'
);

-- Step 2: Move English Language questions (grammar, prepositions, etc.)
UPDATE questions 
SET subject_id = (SELECT id FROM subjects WHERE slug = 'english-language')
WHERE subject_id = (SELECT id FROM subjects WHERE slug = 'mathematics')
AND exam_year = 2022
AND (
    LOWER(question_text) LIKE '%passage%' OR
    LOWER(question_text) LIKE '%according to%' OR
    LOWER(question_text) LIKE '%the passage suggests%' OR
    LOWER(question_text) LIKE '%main idea%' OR
    LOWER(question_text) LIKE '%best title%' OR
    LOWER(question_text) LIKE '%choose the correct%' OR
    LOWER(question_text) LIKE '%identify the%' OR
    LOWER(question_text) LIKE '%fill in%' OR
    LOWER(question_text) LIKE '%complete the%' OR
    LOWER(question_text) LIKE '%______%' OR
    LOWER(question_text) LIKE '%grammar%' OR
    LOWER(question_text) LIKE '%verb%' OR
    LOWER(question_text) LIKE '%noun%' OR
    LOWER(question_text) LIKE '%adjective%' OR
    LOWER(question_text) LIKE '%adverb%' OR
    LOWER(question_text) LIKE '%pronoun%' OR
    LOWER(question_text) LIKE '%preposition%' OR
    LOWER(question_text) LIKE '%tense%' OR
    LOWER(question_text) LIKE '%sentence%'
);

-- Step 3: Move remaining non-mathematics questions
-- These are questions that don't contain mathematical keywords
UPDATE questions 
SET subject_id = (SELECT id FROM subjects WHERE slug = 'english-language')
WHERE subject_id = (SELECT id FROM subjects WHERE slug = 'mathematics')
AND exam_year = 2022
AND NOT (
    LOWER(question_text) LIKE '%solve%' OR
    LOWER(question_text) LIKE '%calculate%' OR
    LOWER(question_text) LIKE '%equation%' OR
    LOWER(question_text) LIKE '%formula%' OR
    LOWER(question_text) LIKE '%find the value%' OR
    LOWER(question_text) LIKE '%x =%' OR
    LOWER(question_text) LIKE '%y =%' OR
    LOWER(question_text) LIKE '%algebra%' OR
    LOWER(question_text) LIKE '%geometry%' OR
    LOWER(question_text) LIKE '%trigonometry%' OR
    LOWER(question_text) LIKE '%factorize%' OR
    LOWER(question_text) LIKE '%derivative%' OR
    LOWER(question_text) LIKE '%integral%' OR
    LOWER(question_text) LIKE '%function%' OR
    LOWER(question_text) LIKE '%polynomial%' OR
    LOWER(question_text) LIKE '%logarithm%' OR
    LOWER(question_text) LIKE '%sine%' OR
    LOWER(question_text) LIKE '%cosine%' OR
    LOWER(question_text) LIKE '%tangent%' OR
    LOWER(question_text) LIKE '%angle%' OR
    LOWER(question_text) LIKE '%triangle%' OR
    LOWER(question_text) LIKE '%circle%' OR
    LOWER(question_text) LIKE '%radius%' OR
    LOWER(question_text) LIKE '%diameter%' OR
    LOWER(question_text) LIKE '%area%' OR
    LOWER(question_text) LIKE '%volume%' OR
    LOWER(question_text) LIKE '%perimeter%' OR
    question_text ~ '\d+[\+\-\*\/]\d+' OR
    question_text ~ 'x\s*[\+\-\*\/=]' OR
    question_text ~ '\d+x' OR
    question_text ~ '\^\d+' OR
    question_text ~ '\d+\.\d+' OR
    question_text ~ '\d+%'
);

-- Verify the results
SELECT 
    'After Fix' as status,
    s.name as subject_name,
    s.slug as subject_slug,
    COUNT(*) as question_count
FROM questions q
JOIN subjects s ON q.subject_id = s.id
WHERE q.exam_year = 2022 AND q.is_active = true
GROUP BY s.id, s.name, s.slug
ORDER BY question_count DESC;

-- Show remaining Mathematics 2022 questions
SELECT 
    'Mathematics 2022 Questions' as category,
    q.id,
    LEFT(q.question_text, 100) as question_preview,
    q.exam_type
FROM questions q
JOIN subjects s ON q.subject_id = s.id
WHERE s.slug = 'mathematics' 
AND q.exam_year = 2022 
AND q.is_active = true
ORDER BY q.created_at DESC
LIMIT 20;

-- Show sample moved questions
SELECT 
    'Moved to English' as category,
    q.id,
    LEFT(q.question_text, 100) as question_preview,
    q.exam_type
FROM questions q
JOIN subjects s ON q.subject_id = s.id
WHERE s.slug = 'english-language' 
AND q.exam_year = 2022 
AND q.is_active = true
ORDER BY q.created_at DESC
LIMIT 10;