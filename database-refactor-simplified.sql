-- ============================================================================
-- SOPHIA PREP - SIMPLIFIED DATABASE REFACTOR
-- ============================================================================
-- Clean structure: Subjects + Exam Types + 2 Quiz Modes (No Topics!)

-- ============================================================================
-- 1. EXAM TYPES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS exam_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'JAMB', 'WAEC', 'NECO'
  slug TEXT NOT NULL UNIQUE, -- 'jamb', 'waec', 'neco'
  description TEXT,
  full_name TEXT, -- 'Joint Admissions and Matriculation Board'
  duration_minutes INTEGER, -- Standard exam duration
  total_questions INTEGER, -- Standard number of questions
  passing_score INTEGER, -- Minimum passing score
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. SUBJECT CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subject_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'SCIENCE', 'COMMERCIAL', 'ARTS'
  slug TEXT NOT NULL UNIQUE, -- 'science', 'commercial', 'arts'
  description TEXT,
  color_theme TEXT, -- For UI theming
  icon TEXT, -- Icon identifier
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. SIMPLIFIED SUBJECTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subjects_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color_theme TEXT,
  category_id UUID REFERENCES subject_categories(id) ON DELETE SET NULL,
  is_mandatory BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. SUBJECT-EXAM TYPE JUNCTION TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subject_exam_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects_new(id) ON DELETE CASCADE,
  exam_type_id UUID NOT NULL REFERENCES exam_types(id) ON DELETE CASCADE,
  is_mandatory BOOLEAN DEFAULT FALSE,
  max_questions INTEGER, -- Max questions for this subject in this exam
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subject_id, exam_type_id)
);

-- ============================================================================
-- 5. SIMPLIFIED QUESTIONS TABLE (NO TOPICS!)
-- ============================================================================
CREATE TABLE IF NOT EXISTS questions_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects_new(id) ON DELETE CASCADE,
  exam_type_id UUID REFERENCES exam_types(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('EASY', 'MEDIUM', 'HARD')) DEFAULT 'MEDIUM',
  exam_year INTEGER,
  question_number INTEGER,
  metadata JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. QUIZ MODES (ONLY 2 MODES!)
-- ============================================================================
CREATE TABLE IF NOT EXISTS quiz_mode_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  has_timer BOOLEAN DEFAULT FALSE,
  show_explanations_during BOOLEAN DEFAULT FALSE,
  show_explanations_after BOOLEAN DEFAULT TRUE,
  allow_manual_submit BOOLEAN DEFAULT TRUE,
  auto_submit_on_timeout BOOLEAN DEFAULT FALSE,
  default_time_limit_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert only 2 quiz modes
INSERT INTO quiz_mode_configs (mode_name, display_name, description, has_timer, show_explanations_during, show_explanations_after, allow_manual_submit, auto_submit_on_timeout, default_time_limit_minutes) VALUES
('PRACTICE', 'Practice Mode', 'Free practice with immediate feedback and no time pressure', FALSE, TRUE, TRUE, TRUE, FALSE, NULL),
('CBT_EXAM', 'CBT Exam Mode', 'Timed exam simulation with strict exam rules (5-180 questions)', TRUE, FALSE, TRUE, FALSE, TRUE, 180);

-- ============================================================================
-- 7. SIMPLIFIED QUIZ ATTEMPTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS quiz_attempts_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects_new(id) ON DELETE SET NULL,
  exam_type_id UUID REFERENCES exam_types(id) ON DELETE SET NULL, -- NULL for practice mode
  quiz_mode TEXT NOT NULL CHECK (quiz_mode IN ('PRACTICE', 'CBT_EXAM')),
  total_questions INTEGER NOT NULL CHECK (total_questions > 0 AND total_questions <= 180), -- Max 180 questions
  questions_requested INTEGER, -- How many questions user wanted (5-180 for CBT)
  correct_answers INTEGER NOT NULL CHECK (correct_answers >= 0),
  incorrect_answers INTEGER NOT NULL CHECK (incorrect_answers >= 0),
  score_percentage DECIMAL(5,2) NOT NULL CHECK (score_percentage >= 0 AND score_percentage <= 100),
  time_taken_seconds INTEGER NOT NULL CHECK (time_taken_seconds >= 0),
  time_limit_seconds INTEGER, -- NULL for practice mode, calculated for CBT (1 min per question)
  is_auto_submitted BOOLEAN DEFAULT FALSE, -- TRUE if exam auto-submitted due to time
  exam_year INTEGER,
  questions_data JSONB DEFAULT '[]',
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_exam_types_slug ON exam_types(slug);
CREATE INDEX idx_exam_types_active ON exam_types(is_active);

CREATE INDEX idx_subject_categories_slug ON subject_categories(slug);
CREATE INDEX idx_subject_categories_active ON subject_categories(is_active);

CREATE INDEX idx_subjects_new_slug ON subjects_new(slug);
CREATE INDEX idx_subjects_new_category ON subjects_new(category_id);
CREATE INDEX idx_subjects_new_active ON subjects_new(is_active);

CREATE INDEX idx_subject_exam_types_subject ON subject_exam_types(subject_id);
CREATE INDEX idx_subject_exam_types_exam ON subject_exam_types(exam_type_id);

CREATE INDEX idx_questions_new_subject ON questions_new(subject_id);
CREATE INDEX idx_questions_new_exam_type ON questions_new(exam_type_id);
CREATE INDEX idx_questions_new_difficulty ON questions_new(difficulty_level);
CREATE INDEX idx_questions_new_active ON questions_new(is_active);

CREATE INDEX idx_quiz_attempts_new_user ON quiz_attempts_new(user_id);
CREATE INDEX idx_quiz_attempts_new_subject ON quiz_attempts_new(subject_id);
CREATE INDEX idx_quiz_attempts_new_mode ON quiz_attempts_new(quiz_mode);

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert exam types
INSERT INTO exam_types (name, slug, description, full_name, duration_minutes, total_questions, passing_score) VALUES
('JAMB', 'jamb', 'Joint Admissions and Matriculation Board examination - English (mandatory) + 3 other subjects = 4 total', 'Joint Admissions and Matriculation Board', 180, 180, 180),
('WAEC', 'waec', 'West African Examinations Council examination', 'West African Examinations Council', 180, 50, 50);

-- Insert subject categories
INSERT INTO subject_categories (name, slug, description, color_theme, icon) VALUES
('SCIENCE', 'science', 'Science and Technology subjects', 'blue', 'flask'),
('COMMERCIAL', 'commercial', 'Business and Commercial subjects', 'green', 'briefcase'),
('ARTS', 'arts', 'Arts and Humanities subjects', 'purple', 'book'),
('LANGUAGE', 'language', 'Language subjects', 'orange', 'globe'),
('GENERAL', 'general', 'General subjects required by all', 'gray', 'star');

-- ============================================================================
-- SIMPLIFIED FUNCTIONS (NO TOPICS!)
-- ============================================================================

-- Function to get practice questions (any exam type, any subject)
CREATE OR REPLACE FUNCTION get_practice_questions(
  p_subject_ids UUID[],
  p_limit INTEGER DEFAULT 20,
  p_difficulty TEXT DEFAULT NULL
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
  subject_name TEXT
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
    q.difficulty_level,
    s.name as subject_name
  FROM questions_new q
  JOIN subjects_new s ON q.subject_id = s.id
  WHERE s.id = ANY(p_subject_ids)
    AND (p_difficulty IS NULL OR q.difficulty_level = p_difficulty)
    AND q.is_active = true
    AND s.is_active = true
  ORDER BY RANDOM()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get CBT exam questions (specific exam type only)
-- Supports custom question limits (5-180 questions)
CREATE OR REPLACE FUNCTION get_cbt_exam_questions(
  p_exam_type_slug TEXT,
  p_subject_ids UUID[],
  p_limit INTEGER DEFAULT 180
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
  time_limit_minutes INTEGER
) AS $$
DECLARE
  final_limit INTEGER;
  time_limit INTEGER;
BEGIN
  -- Ensure limit is between 5 and 180
  final_limit := GREATEST(5, LEAST(p_limit, 180));
  
  -- Calculate time limit (1 minute per question)
  time_limit := final_limit;
  
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
    et.name as exam_type_name,
    time_limit as time_limit_minutes
  FROM questions_new q
  JOIN subjects_new s ON q.subject_id = s.id
  JOIN exam_types et ON q.exam_type_id = et.id
  WHERE et.slug = p_exam_type_slug
    AND s.id = ANY(p_subject_ids)
    AND q.is_active = true
    AND s.is_active = true
    AND et.is_active = true
  ORDER BY RANDOM()
  LIMIT final_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SIMPLE VIEWS
-- ============================================================================

-- View to get subjects with their categories and exam types
CREATE OR REPLACE VIEW subjects_with_details AS
SELECT 
  s.id,
  s.name,
  s.slug,
  s.description,
  s.icon,
  s.color_theme,
  sc.name as category_name,
  sc.slug as category_slug,
  sc.color_theme as category_color,
  ARRAY_AGG(DISTINCT et.name) FILTER (WHERE et.name IS NOT NULL) as exam_types,
  ARRAY_AGG(DISTINCT et.slug) FILTER (WHERE et.slug IS NOT NULL) as exam_type_slugs,
  s.is_mandatory,
  s.is_active,
  s.sort_order
FROM subjects_new s
LEFT JOIN subject_categories sc ON s.category_id = sc.id
LEFT JOIN subject_exam_types set ON s.id = set.subject_id
LEFT JOIN exam_types et ON set.exam_type_id = et.id
WHERE s.is_active = true
GROUP BY s.id, s.name, s.slug, s.description, s.icon, s.color_theme, 
         sc.name, sc.slug, sc.color_theme, s.is_mandatory, s.is_active, s.sort_order;

-- ============================================================================
-- MIGRATION QUERIES (Run after creating new tables)
-- ============================================================================

-- Step 1: Migrate existing subjects
-- INSERT INTO subjects_new (id, name, slug, description, icon, color_theme, category_id, is_mandatory, is_active, sort_order, created_at, updated_at)
-- SELECT 
--   s.id,
--   s.name,
--   s.slug,
--   s.description,
--   s.icon,
--   s.color_theme,
--   sc.id as category_id,
--   s.is_mandatory,
--   s.is_active,
--   s.sort_order,
--   s.created_at,
--   s.updated_at
-- FROM subjects s
-- LEFT JOIN subject_categories sc ON sc.name = s.subject_category;

-- Step 2: Migrate subject-exam type relationships
-- INSERT INTO subject_exam_types (subject_id, exam_type_id, is_mandatory)
-- SELECT 
--   s.id as subject_id,
--   et.id as exam_type_id,
--   s.is_mandatory
-- FROM subjects s
-- CROSS JOIN exam_types et
-- WHERE s.exam_type = 'BOTH' OR s.exam_type = et.name;

-- ============================================================================
-- EXAMPLE USAGE
-- ============================================================================

-- Example 1: Get practice questions for Mathematics (from any exam)
-- SELECT * FROM get_practice_questions(
--   ARRAY['math-subject-uuid']::UUID[],
--   20,
--   'MEDIUM'
-- );

-- Example 2: Get JAMB CBT exam questions for Science subjects
-- SELECT * FROM get_cbt_exam_questions(
--   'jamb',
--   ARRAY['physics-uuid', 'chemistry-uuid', 'biology-uuid', 'math-uuid']::UUID[],
--   180
-- );

-- Example 3: Get all subjects with their exam types
-- SELECT * FROM subjects_with_details ORDER BY sort_order;

-- ============================================================================
-- CBT EXAM CONFIGURATION TABLE
-- ============================================================================
-- Store CBT exam rules and limits
CREATE TABLE IF NOT EXISTS cbt_exam_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_type_id UUID NOT NULL REFERENCES exam_types(id) ON DELETE CASCADE,
  min_questions INTEGER DEFAULT 5 CHECK (min_questions >= 5),
  max_questions INTEGER DEFAULT 180 CHECK (max_questions <= 180),
  time_per_question_minutes DECIMAL(3,1) DEFAULT 1.0, -- 1 minute per question
  allow_custom_question_count BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_type_id)
);

-- Insert CBT configurations for each exam type
INSERT INTO cbt_exam_configs (exam_type_id, min_questions, max_questions, time_per_question_minutes, allow_custom_question_count)
SELECT 
  et.id,
  5, -- Minimum 5 questions
  CASE 
    WHEN et.slug = 'jamb' THEN 180 -- JAMB max 180 (45 questions per subject × 4 subjects)
    WHEN et.slug = 'waec' THEN 50  -- WAEC max 50
    ELSE 100 -- Default max
  END,
  1.0, -- 1 minute per question
  TRUE -- Allow custom count
FROM exam_types et;

-- ============================================================================
-- UPDATED FUNCTION WITH CBT LIMITS
-- ============================================================================

-- Function to validate and get CBT exam questions with proper limits
CREATE OR REPLACE FUNCTION get_cbt_exam_questions_with_validation(
  p_exam_type_slug TEXT,
  p_subject_ids UUID[],
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
  questions_count INTEGER,
  time_limit_minutes INTEGER,
  is_valid BOOLEAN,
  message TEXT
) AS $$
DECLARE
  config_record RECORD;
  final_questions INTEGER;
  time_limit INTEGER;
BEGIN
  -- Get CBT configuration for this exam type
  SELECT 
    cec.min_questions,
    cec.max_questions,
    cec.time_per_question_minutes,
    cec.allow_custom_question_count,
    et.name as exam_name
  INTO config_record
  FROM cbt_exam_configs cec
  JOIN exam_types et ON cec.exam_type_id = et.id
  WHERE et.slug = p_exam_type_slug;

  -- If no config found, return error
  IF NOT FOUND THEN
    RETURN QUERY SELECT 
      NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, 
      NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
      0, 0, FALSE, 'Invalid exam type'::TEXT;
    RETURN;
  END IF;

  -- Determine final question count
  IF p_requested_questions IS NULL THEN
    final_questions := config_record.max_questions; -- Default to max
  ELSE
    -- Validate requested questions
    IF p_requested_questions < config_record.min_questions THEN
      final_questions := config_record.min_questions;
    ELSIF p_requested_questions > config_record.max_questions THEN
      final_questions := config_record.max_questions;
    ELSE
      final_questions := p_requested_questions;
    END IF;
  END IF;

  -- Calculate time limit
  time_limit := CEIL(final_questions * config_record.time_per_question_minutes);

  -- Get questions
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
    final_questions as questions_count,
    time_limit as time_limit_minutes,
    TRUE as is_valid,
    FORMAT('CBT Exam: %s questions, %s minutes', final_questions, time_limit) as message
  FROM questions_new q
  JOIN subjects_new s ON q.subject_id = s.id
  JOIN exam_types et ON q.exam_type_id = et.id
  WHERE et.slug = p_exam_type_slug
    AND s.id = ANY(p_subject_ids)
    AND q.is_active = true
    AND s.is_active = true
    AND et.is_active = true
  ORDER BY RANDOM()
  LIMIT final_questions;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- EXAMPLE USAGE WITH CUSTOM QUESTION LIMITS
-- ============================================================================

-- Example 1: Student wants only 5 questions for JAMB Math
-- SELECT * FROM get_cbt_exam_questions_with_validation(
--   'jamb',
--   ARRAY['math-subject-uuid']::UUID[],
--   5  -- Only 5 questions
-- );

-- Example 2: Student wants 20 questions for JAMB Science subjects
-- SELECT * FROM get_cbt_exam_questions_with_validation(
--   'jamb',
--   ARRAY['physics-uuid', 'chemistry-uuid', 'biology-uuid', 'math-uuid']::UUID[],
--   20  -- 20 questions total
-- );

-- Example 3: Student wants maximum questions (will use exam default)
-- SELECT * FROM get_cbt_exam_questions_with_validation(
--   'jamb',
--   ARRAY['physics-uuid', 'chemistry-uuid', 'biology-uuid', 'math-uuid']::UUID[],
--   NULL  -- Use default (180 for JAMB)
-- );

-- Example 4: Student requests too many questions (will be capped to max)
-- SELECT * FROM get_cbt_exam_questions_with_validation(
--   'waec',
--   ARRAY['english-uuid', 'math-uuid']::UUID[],
--   100  -- Requested 100, but WAEC max is 50, so will get 50
-- );

-- ============================================================================
-- JAMB SUBJECT COMBINATIONS TABLE
-- ============================================================================
-- Store valid JAMB subject combinations (4 subjects max, English mandatory)
CREATE TABLE IF NOT EXISTS jamb_subject_combinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  combination_name TEXT NOT NULL, -- 'Science Combination', 'Commercial Combination', etc.
  category_id UUID REFERENCES subject_categories(id) ON DELETE CASCADE,
  mandatory_subjects UUID[] NOT NULL, -- Always includes English + other mandatory subjects
  elective_subjects UUID[] NOT NULL, -- Students choose from these to complete 4 subjects
  min_electives INTEGER DEFAULT 2 CHECK (min_electives >= 0),
  max_electives INTEGER DEFAULT 3 CHECK (max_electives <= 3),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- JAMB EXAM RULES VALIDATION FUNCTION
-- ============================================================================
-- Validates that JAMB exam follows 4-subject rule with English mandatory
CREATE OR REPLACE FUNCTION validate_jamb_subject_selection(
  p_selected_subject_ids UUID[]
)
RETURNS TABLE (
  is_valid BOOLEAN,
  message TEXT,
  subject_count INTEGER,
  has_english BOOLEAN,
  missing_subjects TEXT[],
  extra_subjects TEXT[]
) AS $$
DECLARE
  english_subject_id UUID;
  subject_count INTEGER;
  has_english BOOLEAN := FALSE;
BEGIN
  -- Get English subject ID
  SELECT id INTO english_subject_id 
  FROM subjects_new 
  WHERE slug = 'english' AND is_active = true;
  
  -- Count selected subjects
  subject_count := array_length(p_selected_subject_ids, 1);
  
  -- Check if English is included
  has_english := english_subject_id = ANY(p_selected_subject_ids);
  
  -- Validation logic
  IF subject_count IS NULL OR subject_count = 0 THEN
    RETURN QUERY SELECT FALSE, 'No subjects selected'::TEXT, 0, FALSE, 
                        ARRAY['English Language']::TEXT[], ARRAY[]::TEXT[];
  ELSIF subject_count > 4 THEN
    RETURN QUERY SELECT FALSE, 'JAMB allows maximum 4 subjects only'::TEXT, 
                        subject_count, has_english, ARRAY[]::TEXT[], 
                        ARRAY['Remove ' || (subject_count - 4) || ' subjects']::TEXT[];
  ELSIF subject_count < 4 THEN
    RETURN QUERY SELECT FALSE, 'JAMB requires exactly 4 subjects'::TEXT, 
                        subject_count, has_english, 
                        ARRAY['Add ' || (4 - subject_count) || ' more subjects']::TEXT[], 
                        ARRAY[]::TEXT[];
  ELSIF NOT has_english THEN
    RETURN QUERY SELECT FALSE, 'English Language is mandatory for all JAMB candidates'::TEXT, 
                        subject_count, has_english, 
                        ARRAY['English Language']::TEXT[], ARRAY[]::TEXT[];
  ELSE
    RETURN QUERY SELECT TRUE, 'Valid JAMB subject combination'::TEXT, 
                        subject_count, has_english, ARRAY[]::TEXT[], ARRAY[]::TEXT[];
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- UPDATED CBT FUNCTION FOR JAMB 4-SUBJECT RULE
-- ============================================================================
-- Enhanced function that respects JAMB's 4-subject maximum rule
CREATE OR REPLACE FUNCTION get_jamb_cbt_questions(
  p_subject_ids UUID[],
  p_questions_per_subject INTEGER DEFAULT 45, -- 45 questions per subject = 180 total
  p_total_questions INTEGER DEFAULT NULL -- Optional: custom total (will be distributed across subjects)
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
  subject_id UUID,
  questions_per_subject INTEGER,
  total_questions INTEGER,
  time_limit_minutes INTEGER,
  is_valid BOOLEAN,
  message TEXT
) AS $$
DECLARE
  validation_result RECORD;
  subject_count INTEGER;
  final_questions_per_subject INTEGER;
  final_total_questions INTEGER;
  time_limit INTEGER;
BEGIN
  -- Validate subject selection first
  SELECT * INTO validation_result 
  FROM validate_jamb_subject_selection(p_subject_ids);
  
  -- If validation fails, return error
  IF NOT validation_result.is_valid THEN
    RETURN QUERY SELECT 
      NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT,
      NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::UUID,
      0, 0, 0, FALSE, validation_result.message;
    RETURN;
  END IF;
  
  -- Calculate questions distribution
  subject_count := array_length(p_subject_ids, 1);
  
  IF p_total_questions IS NOT NULL THEN
    -- Custom total: distribute evenly across subjects
    final_questions_per_subject := p_total_questions / subject_count;
    final_total_questions := final_questions_per_subject * subject_count;
  ELSE
    -- Default: use questions_per_subject parameter
    final_questions_per_subject := p_questions_per_subject;
    final_total_questions := final_questions_per_subject * subject_count;
  END IF;
  
  -- Calculate time limit (1 minute per question)
  time_limit := final_total_questions;
  
  -- Get questions for each subject
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
    s.id as subject_id,
    final_questions_per_subject as questions_per_subject,
    final_total_questions as total_questions,
    time_limit as time_limit_minutes,
    TRUE as is_valid,
    FORMAT('JAMB CBT: %s subjects, %s questions per subject, %s total questions, %s minutes', 
           subject_count, final_questions_per_subject, final_total_questions, time_limit) as message
  FROM (
    SELECT DISTINCT unnest(p_subject_ids) as subject_id
  ) selected_subjects
  JOIN subjects_new s ON selected_subjects.subject_id = s.id
  JOIN questions_new q ON q.subject_id = s.id
  JOIN exam_types et ON q.exam_type_id = et.id
  WHERE et.slug = 'jamb'
    AND q.is_active = true
    AND s.is_active = true
    AND et.is_active = true
  ORDER BY s.name, RANDOM()
  LIMIT final_total_questions;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- EXAMPLE USAGE FOR JAMB 4-SUBJECT RULE
-- ============================================================================

-- Example 1: Valid JAMB Science combination (4 subjects including English)
-- SELECT * FROM get_jamb_cbt_questions(
--   ARRAY['english-uuid', 'mathematics-uuid', 'physics-uuid', 'chemistry-uuid']::UUID[],
--   45, -- 45 questions per subject = 180 total
--   NULL
-- );

-- Example 2: Custom question distribution for JAMB
-- SELECT * FROM get_jamb_cbt_questions(
--   ARRAY['english-uuid', 'mathematics-uuid', 'physics-uuid', 'chemistry-uuid']::UUID[],
--   NULL,
--   100 -- 100 total questions = 25 per subject
-- );

-- Example 3: Valid JAMB combination (English + 3 others = 4 total)
-- SELECT * FROM validate_jamb_subject_selection(
--   ARRAY['english-uuid', 'mathematics-uuid', 'physics-uuid', 'chemistry-uuid']::UUID[] -- ✅ English + 3 others = 4 total
-- );

-- Example 4: Invalid - only English + 2 others (missing 1 subject)
-- SELECT * FROM validate_jamb_subject_selection(
--   ARRAY['english-uuid', 'mathematics-uuid', 'physics-uuid']::UUID[] -- ❌ Only 3 subjects, need 4
-- );

-- Example 5: Invalid - too many subjects (English + 4 others = 5 total)
-- SELECT * FROM validate_jamb_subject_selection(
--   ARRAY['english-uuid', 'mathematics-uuid', 'physics-uuid', 'chemistry-uuid', 'biology-uuid']::UUID[] -- ❌ 5 subjects, max is 4
-- );

-- Example 6: Invalid - no English (only 4 other subjects)
-- SELECT * FROM validate_jamb_subject_selection(
--   ARRAY['mathematics-uuid', 'physics-uuid', 'chemistry-uuid', 'biology-uuid']::UUID[] -- ❌ No English, English is mandatory
-- );
-- ============================================================================
-- JAMB SUBJECT COMBINATION EXAMPLES
-- ============================================================================
-- Common JAMB combinations following English + 3 others rule

-- Science Combinations (English + 3 science subjects)
-- 1. English + Mathematics + Physics + Chemistry
-- 2. English + Mathematics + Physics + Biology  
-- 3. English + Mathematics + Chemistry + Biology

-- Commercial Combinations (English + 3 commercial subjects)
-- 1. English + Mathematics + Economics + Accounting
-- 2. English + Mathematics + Economics + Commerce
-- 3. English + Mathematics + Commerce + Accounting

-- Arts Combinations (English + 3 arts subjects)
-- 1. English + Literature + Government + History
-- 2. English + Literature + Government + CRS/IRS
-- 3. English + Government + History + Geography

-- Mixed Combinations (English + subjects from different categories)
-- 1. English + Mathematics + Economics + Literature
-- 2. English + Mathematics + Government + Geography

-- ============================================================================
-- JAMB CBT QUESTION DISTRIBUTION
-- ============================================================================
-- Standard JAMB CBT: 180 questions total
-- - 45 questions per subject × 4 subjects = 180 questions
-- - 180 minutes (3 hours) = 1 minute per question
-- - Each subject gets equal question allocation

-- Custom JAMB CBT examples:
-- - 40 questions total = 10 questions per subject × 4 subjects
-- - 80 questions total = 20 questions per subject × 4 subjects  
-- - 120 questions total = 30 questions per subject × 4 subjects