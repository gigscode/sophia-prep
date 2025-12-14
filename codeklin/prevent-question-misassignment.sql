-- Prevent Question Misassignment - Database Level Protection
-- Run this SQL in your Supabase SQL Editor

-- Create a function to validate question content against subject
CREATE OR REPLACE FUNCTION validate_question_subject_match()
RETURNS TRIGGER AS $$
DECLARE
    subject_slug TEXT;
    question_content TEXT;
    math_keywords TEXT[] := ARRAY[
        'solve', 'calculate', 'equation', 'formula', 'find the value', 'factorize',
        'algebra', 'geometry', 'trigonometry', 'derivative', 'integral', 'function'
    ];
    english_keywords TEXT[] := ARRAY[
        'grammar', 'sentence', 'verb', 'noun', 'adjective', 'adverb', 'tense',
        'choose the correct', 'identify the', 'complete the sentence'
    ];
    literature_keywords TEXT[] := ARRAY[
        'novel', 'character', 'narrator', 'protagonist', 'author', 'story', 'plot'
    ];
    has_math_content BOOLEAN := FALSE;
    has_literature_content BOOLEAN := FALSE;
    has_english_content BOOLEAN := FALSE;
    keyword TEXT;
BEGIN
    -- Get the subject slug for the assigned subject
    SELECT slug INTO subject_slug 
    FROM subjects 
    WHERE id = NEW.subject_id;
    
    -- Combine question text and options for analysis
    question_content := LOWER(
        COALESCE(NEW.question_text, '') || ' ' ||
        COALESCE(NEW.option_a, '') || ' ' ||
        COALESCE(NEW.option_b, '') || ' ' ||
        COALESCE(NEW.option_c, '') || ' ' ||
        COALESCE(NEW.option_d, '')
    );
    
    -- Check for subject-specific keywords
    FOREACH keyword IN ARRAY math_keywords LOOP
        IF question_content LIKE '%' || keyword || '%' THEN
            has_math_content := TRUE;
            EXIT;
        END IF;
    END LOOP;
    
    FOREACH keyword IN ARRAY literature_keywords LOOP
        IF question_content LIKE '%' || keyword || '%' THEN
            has_literature_content := TRUE;
            EXIT;
        END IF;
    END LOOP;
    
    FOREACH keyword IN ARRAY english_keywords LOOP
        IF question_content LIKE '%' || keyword || '%' THEN
            has_english_content := TRUE;
            EXIT;
        END IF;
    END LOOP;
    
    -- Validate subject assignment
    IF subject_slug = 'mathematics' AND has_literature_content THEN
        RAISE WARNING 'Question appears to contain Literature content but is assigned to Mathematics: %', 
            LEFT(NEW.question_text, 100);
    END IF;
    
    IF subject_slug = 'mathematics' AND has_english_content AND NOT has_math_content THEN
        RAISE WARNING 'Question appears to contain English content but is assigned to Mathematics: %', 
            LEFT(NEW.question_text, 100);
    END IF;
    
    IF subject_slug = 'literature-in-english' AND has_math_content THEN
        RAISE WARNING 'Question appears to contain Mathematics content but is assigned to Literature: %', 
            LEFT(NEW.question_text, 100);
    END IF;
    
    IF subject_slug = 'english-language' AND has_math_content THEN
        RAISE WARNING 'Question appears to contain Mathematics content but is assigned to English: %', 
            LEFT(NEW.question_text, 100);
    END IF;
    
    -- Allow the insert/update to proceed (warnings don't block the operation)
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT operations
DROP TRIGGER IF EXISTS validate_question_content_insert ON questions;
CREATE TRIGGER validate_question_content_insert
    BEFORE INSERT ON questions
    FOR EACH ROW
    EXECUTE FUNCTION validate_question_subject_match();

-- Create trigger for UPDATE operations
DROP TRIGGER IF EXISTS validate_question_content_update ON questions;
CREATE TRIGGER validate_question_content_update
    BEFORE UPDATE ON questions
    FOR EACH ROW
    WHEN (OLD.subject_id IS DISTINCT FROM NEW.subject_id OR 
          OLD.question_text IS DISTINCT FROM NEW.question_text)
    EXECUTE FUNCTION validate_question_subject_match();

-- Test the trigger (optional - remove these lines in production)
-- INSERT INTO questions (subject_id, question_text, option_a, option_b, option_c, option_d, correct_answer, is_active)
-- VALUES (
--     (SELECT id FROM subjects WHERE slug = 'mathematics'),
--     'The novel is narrated mainly through the viewpoint of',
--     'First person',
--     'Second person', 
--     'Third person',
--     'Omniscient',
--     'C',
--     true
-- );

-- Create a view to easily identify potentially misassigned questions
CREATE OR REPLACE VIEW potentially_misassigned_questions AS
SELECT 
    q.id,
    q.question_text,
    s.name as assigned_subject,
    s.slug as subject_slug,
    q.exam_type,
    q.exam_year,
    CASE 
        WHEN s.slug = 'mathematics' AND (
            LOWER(q.question_text) LIKE '%novel%' OR 
            LOWER(q.question_text) LIKE '%character%' OR
            LOWER(q.question_text) LIKE '%author%' OR
            LOWER(q.question_text) LIKE '%story%'
        ) THEN 'Likely Literature content in Mathematics'
        
        WHEN s.slug = 'mathematics' AND (
            LOWER(q.question_text) LIKE '%grammar%' OR 
            LOWER(q.question_text) LIKE '%sentence%' OR
            LOWER(q.question_text) LIKE '%verb%' OR
            LOWER(q.question_text) LIKE '%choose the correct%'
        ) AND NOT (
            LOWER(q.question_text) LIKE '%solve%' OR
            LOWER(q.question_text) LIKE '%calculate%' OR
            LOWER(q.question_text) LIKE '%equation%'
        ) THEN 'Likely English content in Mathematics'
        
        WHEN s.slug = 'literature-in-english' AND (
            LOWER(q.question_text) LIKE '%solve%' OR 
            LOWER(q.question_text) LIKE '%calculate%' OR
            LOWER(q.question_text) LIKE '%equation%'
        ) THEN 'Likely Mathematics content in Literature'
        
        ELSE NULL
    END as mismatch_reason
FROM questions q
JOIN subjects s ON q.subject_id = s.id
WHERE q.is_active = true
AND (
    -- Mathematics with Literature keywords
    (s.slug = 'mathematics' AND (
        LOWER(q.question_text) LIKE '%novel%' OR 
        LOWER(q.question_text) LIKE '%character%' OR
        LOWER(q.question_text) LIKE '%author%' OR
        LOWER(q.question_text) LIKE '%story%'
    ))
    OR
    -- Mathematics with English keywords (but no math keywords)
    (s.slug = 'mathematics' AND (
        LOWER(q.question_text) LIKE '%grammar%' OR 
        LOWER(q.question_text) LIKE '%sentence%' OR
        LOWER(q.question_text) LIKE '%verb%' OR
        LOWER(q.question_text) LIKE '%choose the correct%'
    ) AND NOT (
        LOWER(q.question_text) LIKE '%solve%' OR
        LOWER(q.question_text) LIKE '%calculate%' OR
        LOWER(q.question_text) LIKE '%equation%'
    ))
    OR
    -- Literature with Mathematics keywords
    (s.slug = 'literature-in-english' AND (
        LOWER(q.question_text) LIKE '%solve%' OR 
        LOWER(q.question_text) LIKE '%calculate%' OR
        LOWER(q.question_text) LIKE '%equation%'
    ))
);

-- Query to check for potentially misassigned questions
SELECT 
    'Current Misassigned Questions' as status,
    COUNT(*) as count,
    mismatch_reason
FROM potentially_misassigned_questions 
GROUP BY mismatch_reason
ORDER BY count DESC;