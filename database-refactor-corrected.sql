-- ============================================================================
-- SOPHIA PREP - CORRECTED DATABASE REFACTOR PROPOSAL
-- ============================================================================
-- Based on your actual database structure with exam_items instead of topics

-- ============================================================================
-- 1. EXAM TYPES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS exam_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'JAMB', 'WAEC', 'NECO', etc.
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
  name TEXT NOT NULL UNIQUE, -- 'SCIENCE', 'COMMERCIAL', 'ARTS', etc.
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
-- 3. REFACTORED SUBJECTS TABLE
-- ============================================================================
-- Remove exam_type and subject_category columns, use foreign keys instead
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
-- Many-to-many relationship between subjects and exam types
CREATE TABLE IF NOT EXISTS subject_exam_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects_new(id) ON DELETE CASCADE,
  exam_type_id UUID NOT NULL REFERENCES exam_types(id) ON DELETE CASCADE,
  is_mandatory BOOLEAN DEFAULT FALSE, -- Is this subject mandatory for this exam?
  max_questions INTEGER, -- Max questions available for this subject in this exam
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subject_id, exam_type_id)
);

-- ============================================================================
-- 5. UPDATED QUESTIONS TABLE (WORKING WITH YOUR CURRENT STRUCTURE)
-- ============================================================================
-- Assuming your questions table references exam_items instead of topics
CREATE TABLE IF NOT EXISTS questions_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_item_id UUID REFERENCES exam_items(id) ON DELETE CASCADE, -- Using your existing exam_items table
  subject_id UUID REFERENCES subjects_new(id) ON DELETE CASCADE, -- Direct reference to subject
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

CREATE INDEX idx_questions_new_exam_item ON questions_new(exam_item_id);
CREATE INDEX idx_questions_new_subject ON questions_new(subject_id);
CREATE INDEX idx_questions_new_exam_type ON questions_new(exam_type_id);
CREATE INDEX idx_questions_new_difficulty ON questions_new(difficulty_level);
CREATE INDEX idx_questions_new_active ON questions_new(is_active);

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert exam types
INSERT INTO exam_types (name, slug, description, full_name, duration_minutes, total_questions, passing_score) VALUES
('JAMB', 'jamb', 'Joint Admissions and Matriculation Board examination', 'Joint Admissions and Matriculation Board', 180, 180, 180),
('WAEC', 'waec', 'West African Examinations Council examination', 'West African Examinations Council', 180, 50, 50),
('NECO', 'neco', 'National Examinations Council examination', 'National Examinations Council', 180, 50, 50);

-- Insert subject categories
INSERT INTO subject_categories (name, slug, description, color_theme, icon) VALUES
('SCIENCE', 'science', 'Science and Technology subjects', 'blue', 'flask'),
('COMMERCIAL', 'commercial', 'Business and Commercial subjects', 'green', 'briefcase'),
('ARTS', 'arts', 'Arts and Humanities subjects', 'purple', 'book'),
('LANGUAGE', 'language', 'Language subjects', 'orange', 'globe'),
('GENERAL', 'general', 'General subjects required by all', 'gray', 'star');

-- ============================================================================
-- QUIZ MODE CONFIGURATIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS quiz_mode_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mode_name TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  has_timer BOOLEAN DEFAULT FALSE,
  show_explanations_during BOOLEAN DEFAULT FALSE, -- Show explanations after each question
  show_explanations_after BOOLEAN DEFAULT TRUE,   -- Show explanations at the end
  allow_manual_submit BOOLEAN DEFAULT TRUE,
  auto_submit_on_timeout BOOLEAN DEFAULT FALSE,
  default_time_limit_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert quiz mode configurations
INSERT INTO quiz_mode_configs (mode_name, display_name, description, has_timer, show_explanations_during, show_explanations_after, allow_manual_submit, auto_submit_on_timeout, default_time_limit_minutes) VALUES
('PRACTICE', 'Practice Mode', 'Free practice with immediate feedback', FALSE, TRUE, TRUE, TRUE, FALSE, NULL),
('CBT_EXAM', 'CBT Exam Mode', 'Timed exam simulation with strict rules', TRUE, FALSE, TRUE, FALSE, TRUE, 180),
('MOCK_EXAM', 'Mock Exam', 'Practice exam with timer but more flexible', TRUE, FALSE, TRUE, TRUE, TRUE, 180),
('PAST_QUESTIONS', 'Past Questions', 'Practice with real past exam questions', FALSE, TRUE, TRUE, TRUE, FALSE, NULL);

-- ============================================================================
-- UPDATED QUIZ ATTEMPTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS quiz_attempts_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES subjects_new(id) ON DELETE SET NULL,
  exam_item_id UUID REFERENCES exam_items(id) ON DELETE SET NULL, -- Using your existing exam_items
  exam_type_id UUID REFERENCES exam_types(id) ON DELETE SET NULL, -- NULL for practice mode
  quiz_mode TEXT NOT NULL CHECK (quiz_mode IN ('PRACTICE', 'CBT_EXAM', 'MOCK_EXAM', 'PAST_QUESTIONS')),
  total_questions INTEGER NOT NULL CHECK (total_questions > 0),
  correct_answers INTEGER NOT NULL CHECK (correct_answers >= 0),
  incorrect_answers INTEGER NOT NULL CHECK (incorrect_answers >= 0),
  score_percentage DECIMAL(5,2) NOT NULL CHECK (score_percentage >= 0 AND score_percentage <= 100),
  time_taken_seconds INTEGER NOT NULL CHECK (time_taken_seconds >= 0),
  time_limit_seconds INTEGER, -- NULL for practice mode, set for CBT exams
  is_auto_submitted BOOLEAN DEFAULT FALSE, -- TRUE if exam auto-submitted due to time
  exam_year INTEGER,
  questions_data JSONB DEFAULT '[]',
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FUNCTIONS TO GET QUESTIONS BASED ON MODE
-- ============================================================================

-- Function to get practice questions (can be from any exam type)
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

-- Function to get CBT exam questions (must match specific exam type)
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
  exam_type_name TEXT
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
    s.name as subject_name,
    et.name as exam_type_name
  FROM questions_new q
  JOIN subjects_new s ON q.subject_id = s.id
  JOIN exam_types et ON q.exam_type_id = et.id
  WHERE et.slug = p_exam_type_slug
    AND s.id = ANY(p_subject_ids)
    AND q.is_active = true
    AND s.is_active = true
    AND et.is_active = true
  ORDER BY RANDOM()
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS FOR EASY QUERYING
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
  ARRAY_AGG(et.name) as exam_types,
  ARRAY_AGG(et.slug) as exam_type_slugs,
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
-- MIGRATION HELPER QUERIES (Run these after creating new tables)
-- ============================================================================

-- Step 1: Migrate existing subjects to new structure
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

-- Step 3: Migrate existing questions (if any)
-- INSERT INTO questions_new (id, subject_id, exam_type_id, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty_level, exam_year, question_number, metadata, is_active, created_at, updated_at)
-- SELECT 
--   q.id,
--   q.topic_id as subject_id, -- Assuming topic_id maps to subject
--   et.id as exam_type_id,
--   q.question_text,
--   q.option_a,
--   q.option_b,
--   q.option_c,
--   q.option_d,
--   q.correct_answer,
--   q.explanation,
--   q.difficulty_level,
--   q.exam_year,
--   q.question_number,
--   q.metadata,
--   q.is_active,
--   q.created_at,
--   q.updated_at
-- FROM questions q
-- LEFT JOIN exam_types et ON et.name = q.exam_type;