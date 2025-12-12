-- ============================================================================
-- FIXED DATABASE UPDATES FOR QUIZ INTEGRATION
-- ============================================================================
-- Copy and paste this into Supabase SQL Editor

-- Add indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_questions_exam_type_year 
ON questions_new(exam_type_id, exam_year);

CREATE INDEX IF NOT EXISTS idx_questions_subject_active 
ON questions_new(subject_id, is_active);

CREATE INDEX IF NOT EXISTS idx_subjects_category_active 
ON subjects_new(category_id, is_active);

-- Add index for quiz attempts performance
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_exam_type_mode 
ON quiz_attempts_new(exam_type_id, quiz_mode);

-- Create function for universal quiz mode validation
CREATE OR REPLACE FUNCTION validate_universal_quiz_config(
  p_exam_type_slug TEXT,
  p_subject_ids UUID[], -- Fixed: Use UUID[] not TEXT[]
  p_mode TEXT
) 
RETURNS TABLE(
  is_valid BOOLEAN,
  message TEXT,
  subject_count INTEGER,
  has_english BOOLEAN
) AS $$
DECLARE
  english_subject_id UUID;
  subject_count INTEGER;
  has_english BOOLEAN := FALSE;
  jamb_exam_type_id UUID;
BEGIN
  -- Get English subject ID
  SELECT id INTO english_subject_id 
  FROM subjects_new 
  WHERE slug = 'english' AND is_active = true;
  
  -- Get JAMB exam type ID
  SELECT id INTO jamb_exam_type_id
  FROM exam_types
  WHERE slug = p_exam_type_slug;
  
  -- Count selected subjects
  subject_count := COALESCE(array_length(p_subject_ids, 1), 0);
  
  -- Check if English is included
  has_english := english_subject_id = ANY(p_subject_ids);
  
  -- Validation logic based on exam type
  IF p_exam_type_slug = 'jamb' THEN
    -- JAMB validation: English + exactly 3 others = 4 total
    IF subject_count = 0 THEN
      RETURN QUERY SELECT FALSE, 'No subjects selected for JAMB'::TEXT, 0, FALSE;
    ELSIF NOT has_english THEN
      RETURN QUERY SELECT FALSE, 'English Language is mandatory for JAMB'::TEXT, subject_count, FALSE;
    ELSIF subject_count < 4 THEN
      RETURN QUERY SELECT FALSE, 'JAMB requires exactly 4 subjects (English + 3 others)'::TEXT, subject_count, has_english;
    ELSIF subject_count > 4 THEN
      RETURN QUERY SELECT FALSE, 'JAMB allows maximum 4 subjects only'::TEXT, subject_count, has_english;
    ELSE
      RETURN QUERY SELECT TRUE, 'Valid JAMB subject combination'::TEXT, subject_count, has_english;
    END IF;
    
  ELSIF p_exam_type_slug = 'waec' THEN
    -- WAEC validation: More flexible, typically 6-9 subjects
    IF subject_count = 0 THEN
      RETURN QUERY SELECT FALSE, 'No subjects selected for WAEC'::TEXT, 0, FALSE;
    ELSIF subject_count < 6 THEN
      RETURN QUERY SELECT FALSE, 'WAEC typically requires at least 6 subjects'::TEXT, subject_count, has_english;
    ELSIF subject_count > 9 THEN
      RETURN QUERY SELECT FALSE, 'WAEC allows maximum 9 subjects'::TEXT, subject_count, has_english;
    ELSE
      RETURN QUERY SELECT TRUE, 'Valid WAEC subject combination'::TEXT, subject_count, has_english;
    END IF;
    
  ELSE
    RETURN QUERY SELECT FALSE, 'Invalid exam type'::TEXT, subject_count, has_english;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to get quiz mode configuration
CREATE OR REPLACE FUNCTION get_quiz_mode_config(p_mode_name TEXT)
RETURNS TABLE(
  mode_name TEXT,
  display_name TEXT,
  has_timer BOOLEAN,
  show_explanations_during BOOLEAN,
  show_explanations_after BOOLEAN,
  allow_manual_submit BOOLEAN,
  auto_submit_on_timeout BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qmc.mode_name,
    qmc.display_name,
    qmc.has_timer,
    qmc.show_explanations_during,
    qmc.show_explanations_after,
    qmc.allow_manual_submit,
    qmc.auto_submit_on_timeout
  FROM quiz_mode_configs qmc
  WHERE qmc.mode_name = p_mode_name;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers for new tables
CREATE TRIGGER update_quiz_attempts_new_updated_at 
BEFORE UPDATE ON quiz_attempts_new
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Verify everything was created successfully
SELECT 'Database updates completed successfully!' as status;

-- Test the validation function
SELECT 'Testing validation function...' as test_status;

-- Test JAMB validation (should pass)
-- SELECT * FROM validate_universal_quiz_config(
--   'jamb',
--   ARRAY['english-uuid', 'math-uuid', 'physics-uuid', 'chemistry-uuid']::UUID[],
--   'CBT_EXAM'
-- );

-- Test WAEC validation (should pass)  
-- SELECT * FROM validate_universal_quiz_config(
--   'waec',
--   ARRAY['english-uuid', 'math-uuid', 'physics-uuid', 'chemistry-uuid', 'biology-uuid', 'economics-uuid']::UUID[],
--   'PRACTICE'
-- );