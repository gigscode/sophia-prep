-- ============================================================================
-- STEP 2: ADD EXAM YEAR SELECTION FEATURE FOR CBT MODE
-- ============================================================================
-- Copy and paste this into Supabase SQL Editor and run it

-- Function to get CBT questions by specific exam year
CREATE OR REPLACE FUNCTION get_cbt_questions_by_year(
  p_exam_type_slug TEXT,
  p_subject_ids UUID[],
  p_exam_year INTEGER,
  p_requested_questions INTEGER DEFAULT NULL
)
RETURNS TABLE (
  question_id UUID,
  question_text TEXT,
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  correct_answer TEXT,
  explanation TEXT,
  difficulty_level TEXT,
  subject_name TEXT,
  exam_type_name TEXT,
  exam_year INTEGER,
  questions_count INTEGER,
  time_limit_minutes INTEGER,
  is_valid BOOLEAN,
  message TEXT
) AS $$
DECLARE
  config_record RECORD;
  final_questions INTEGER;
  time_limit INTEGER;
  available_questions INTEGER;
BEGIN
  -- Get CBT configuration for this exam type
  SELECT 
    cec.min_questions,
    cec.max_questions,
    cec.time_per_question_minutes,
    et.name as exam_name
  INTO config_record
  FROM cbt_exam_configs cec
  JOIN exam_types et ON cec.exam_type_id = et.id
  WHERE et.slug = p_exam_type_slug;

  -- If no config found, return error
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, 
      NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::INTEGER,
      0, 0, FALSE, 'Invalid exam type'::TEXT;
    RETURN;
  END IF;

  -- Check how many questions are available for this year
  SELECT COUNT(*) INTO available_questions
  FROM questions_new q
  JOIN subjects_new s ON q.subject_id = s.id
  JOIN exam_types et ON q.exam_type_id = et.id
  WHERE et.slug = p_exam_type_slug
    AND s.id = ANY(p_subject_ids)
    AND q.exam_year = p_exam_year
    AND q.is_active = true
    AND s.is_active = true
    AND et.is_active = true;

  -- If no questions available for this year, return error
  IF available_questions = 0 THEN
    RETURN QUERY SELECT 
      NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, 
      NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::INTEGER,
      0, 0, FALSE, FORMAT('No questions available for %s year %s', config_record.exam_name, p_exam_year)::TEXT;
    RETURN;
  END IF;

  -- Determine final question count
  IF p_requested_questions IS NULL THEN
    final_questions := LEAST(available_questions, config_record.max_questions);
  ELSE
    final_questions := LEAST(p_requested_questions, available_questions, config_record.max_questions);
    final_questions := GREATEST(final_questions, config_record.min_questions);
  END IF;

  -- Calculate time limit
  time_limit := CEIL(final_questions * config_record.time_per_question_minutes);

  -- Get questions for the specific year
  RETURN QUERY
  SELECT 
    q.id,
    q.question_text,
    q.option_a,
    q.option_b,
    q.option_c,
    q.option_d,
    q.correct_answer,
    q.explanation,
    q.difficulty_level,
    s.name as subject_name,
    config_record.exam_name as exam_type_name,
    q.exam_year,
    final_questions as questions_count,
    time_limit as time_limit_minutes,
    TRUE as is_valid,
    FORMAT('CBT Exam: %s %s - %s questions from %s available, %s minutes', 
           config_record.exam_name, p_exam_year, final_questions, available_questions, time_limit) as message
  FROM questions_new q
  JOIN subjects_new s ON q.subject_id = s.id
  JOIN exam_types et ON q.exam_type_id = et.id
  WHERE et.slug = p_exam_type_slug
    AND s.id = ANY(p_subject_ids)
    AND q.exam_year = p_exam_year
    AND q.is_active = true
    AND s.is_active = true
    AND et.is_active = true
  ORDER BY RANDOM()
  LIMIT final_questions;
END;
$$ LANGUAGE plpgsql;

-- Function to get available exam years for a specific exam type and subjects
CREATE OR REPLACE FUNCTION get_available_exam_years(
  p_exam_type_slug TEXT,
  p_subject_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  exam_year INTEGER,
  question_count INTEGER,
  subjects_with_questions TEXT[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.exam_year,
    COUNT(*)::INTEGER as question_count,
    ARRAY_AGG(DISTINCT s.name) as subjects_with_questions
  FROM questions_new q
  JOIN subjects_new s ON q.subject_id = s.id
  JOIN exam_types et ON q.exam_type_id = et.id
  WHERE et.slug = p_exam_type_slug
    AND q.exam_year IS NOT NULL
    AND (p_subject_ids IS NULL OR s.id = ANY(p_subject_ids))
    AND q.is_active = true
    AND s.is_active = true
    AND et.is_active = true
  GROUP BY q.exam_year
  ORDER BY q.exam_year DESC;
END;
$$ LANGUAGE plpgsql;

-- Test the new functions
SELECT 'Exam Year Functions Created Successfully!' as status;

-- Example: Get available years for JAMB
-- SELECT * FROM get_available_exam_years('jamb');

-- Example: Get available years for specific subjects
-- SELECT * FROM get_available_exam_years('jamb', ARRAY['subject-id-1', 'subject-id-2']::UUID[]);