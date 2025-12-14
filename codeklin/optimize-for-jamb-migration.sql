-- Comprehensive migration to optimize Sophia Prep for JAMB-only with enhanced quiz features
-- This script optimizes for JAMB and enhances topic/year selection
-- Uses IF EXISTS checks to handle missing tables/columns gracefully

-- ============================================================================
-- PART 1: Optimize for JAMB-only
-- ============================================================================

-- Ensure all subjects are set to JAMB exam type
UPDATE subjects SET exam_type = 'JAMB' WHERE exam_type IS NULL OR exam_type != 'JAMB';

-- Update all questions to be JAMB type if not set
UPDATE questions SET exam_type = 'JAMB' WHERE exam_type IS NULL;

-- ============================================================================
-- PART 2: Enhance Topic and Year Selection Features (with IF EXISTS checks)
-- ============================================================================

-- Create indexes only if topics table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'topics') THEN
    -- Check if columns exist before creating indexes
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'topics' AND column_name = 'subject_id') THEN
      CREATE INDEX IF NOT EXISTS idx_topics_subject_id_active ON topics(subject_id, is_active);
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'topics' AND column_name = 'order_index') THEN
      CREATE INDEX IF NOT EXISTS idx_topics_order ON topics(order_index);
    END IF;
  END IF;
END $$;

-- Create question indexes (check columns exist first)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'subject_id') THEN
    CREATE INDEX IF NOT EXISTS idx_questions_subject_year ON questions(subject_id, exam_year);
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'topic_id') THEN
    CREATE INDEX IF NOT EXISTS idx_questions_topic_year ON questions(topic_id, exam_year);
  END IF;
  
  CREATE INDEX IF NOT EXISTS idx_questions_active_jamb ON questions(is_active, exam_type);
END $$;

-- ============================================================================
-- PART 3: Data Quality Improvements
-- ============================================================================

-- Update questions without subject_id to get it from their topic (if both columns exist)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'topics') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'subject_id')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'questions' AND column_name = 'topic_id') THEN
    UPDATE questions q
    SET subject_id = t.subject_id
    FROM topics t
    WHERE q.topic_id = t.id 
      AND q.subject_id IS NULL;
  END IF;
END $$;

-- ============================================================================
-- PART 4: Create Helper Views for Quiz Selection (only if tables exist)
-- ============================================================================

-- View for subject statistics
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'topics') THEN
    CREATE OR REPLACE VIEW subject_quiz_stats AS
    SELECT 
      s.id,
      s.name,
      s.slug,
      COUNT(q.id) as total_questions,
      COUNT(DISTINCT q.exam_year) as available_years,
      COUNT(DISTINCT t.id) as topic_count,
      MIN(q.exam_year) as earliest_year,
      MAX(q.exam_year) as latest_year
    FROM subjects s
    LEFT JOIN questions q ON s.id = q.subject_id AND q.is_active = true
    LEFT JOIN topics t ON s.id = t.subject_id AND t.is_active = true
    WHERE s.is_active = true
    GROUP BY s.id, s.name, s.slug;

    -- View for topic statistics
    CREATE OR REPLACE VIEW topic_quiz_stats AS
    SELECT 
      t.id,
      t.name,
      t.slug,
      t.subject_id,
      s.name as subject_name,
      COUNT(q.id) as question_count,
      COUNT(DISTINCT q.exam_year) as available_years,
      MIN(q.exam_year) as earliest_year,
      MAX(q.exam_year) as latest_year
    FROM topics t
    JOIN subjects s ON t.subject_id = s.id
    LEFT JOIN questions q ON t.id = q.topic_id AND q.is_active = true
    WHERE t.is_active = true AND s.is_active = true
    GROUP BY t.id, t.name, t.slug, t.subject_id, s.name;
  ELSE
    -- Create simplified view without topics
    CREATE OR REPLACE VIEW subject_quiz_stats AS
    SELECT 
      s.id,
      s.name,
      s.slug,
      COUNT(q.id) as total_questions,
      COUNT(DISTINCT q.exam_year) as available_years,
      0::bigint as topic_count,
      MIN(q.exam_year) as earliest_year,
      MAX(q.exam_year) as latest_year
    FROM subjects s
    LEFT JOIN questions q ON s.id = q.subject_id AND q.is_active = true
    WHERE s.is_active = true
    GROUP BY s.id, s.name, s.slug;
  END IF;
END $$;

-- ============================================================================
-- PART 5: Create Optimized Quiz Functions
-- ============================================================================

-- Function to get questions for practice mode (by subject and optional topic)
CREATE OR REPLACE FUNCTION get_practice_questions_v2(
  p_subject_id UUID,
  p_topic_id UUID DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  question_text TEXT,
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  correct_answer TEXT,
  explanation TEXT,
  exam_year INTEGER
) AS $$
BEGIN
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
    q.exam_year
  FROM questions q
  WHERE q.subject_id = p_subject_id
    AND q.is_active = true
    AND q.exam_type = 'JAMB'
    AND (p_topic_id IS NULL OR q.topic_id = p_topic_id)
  ORDER BY RANDOM()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get questions for exam mode (by subject and year)
CREATE OR REPLACE FUNCTION get_exam_questions_v2(
  p_subject_id UUID,
  p_exam_year INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 40
)
RETURNS TABLE (
  id UUID,
  question_text TEXT,
  option_a TEXT,
  option_b TEXT,
  option_c TEXT,
  option_d TEXT,
  correct_answer TEXT,
  explanation TEXT,
  exam_year INTEGER
) AS $$
BEGIN
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
    q.exam_year
  FROM questions q
  WHERE q.subject_id = p_subject_id
    AND q.is_active = true
    AND q.exam_type = 'JAMB'
    AND (p_exam_year IS NULL OR q.exam_year = p_exam_year)
  ORDER BY RANDOM()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get available years for a subject
CREATE OR REPLACE FUNCTION get_available_years_v2(p_subject_id UUID)
RETURNS TABLE (exam_year INTEGER, question_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    q.exam_year,
    COUNT(*) as question_count
  FROM questions q
  WHERE q.subject_id = p_subject_id
    AND q.is_active = true
    AND q.exam_type = 'JAMB'
    AND q.exam_year IS NOT NULL
  GROUP BY q.exam_year
  ORDER BY q.exam_year DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'JAMB optimization complete!' as status,
       (SELECT COUNT(*) FROM subjects WHERE exam_type = 'JAMB') as jamb_subjects,
       (SELECT COUNT(*) FROM questions WHERE exam_type = 'JAMB') as jamb_questions;