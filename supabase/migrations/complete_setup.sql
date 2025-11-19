-- ============================================================================
-- SOPHIA PREP - COMPLETE DATABASE SETUP
-- ============================================================================
-- This script sets up the complete database structure for Sophia Prep
-- JAMB/WAEC exam preparation platform
-- 
-- Run this script in your Supabase SQL Editor:
-- https://rnxkkmdnmwhxdaofwtrf.supabase.co
-- ============================================================================

-- ============================================================================
-- PART 1: MIGRATION INFRASTRUCTURE
-- ============================================================================

-- Create migration_logs table to track all migration operations
CREATE TABLE IF NOT EXISTS migration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'ROLLED_BACK')),
  affected_rows INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_migration_logs_name ON migration_logs(migration_name);
CREATE INDEX idx_migration_logs_status ON migration_logs(status);
CREATE INDEX idx_migration_logs_created ON migration_logs(created_at DESC);

-- Create migration_backups table
CREATE TABLE IF NOT EXISTS migration_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_name TEXT NOT NULL UNIQUE,
  table_name TEXT NOT NULL,
  backup_data JSONB NOT NULL,
  row_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_migration_backups_table ON migration_backups(table_name);
CREATE INDEX idx_migration_backups_created ON migration_backups(created_at DESC);

-- Function to log migration operations
CREATE OR REPLACE FUNCTION log_migration_operation(
  p_migration_name TEXT,
  p_operation TEXT,
  p_status TEXT,
  p_affected_rows INTEGER DEFAULT 0,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO migration_logs (
    migration_name,
    operation,
    status,
    affected_rows,
    error_message,
    metadata,
    completed_at
  ) VALUES (
    p_migration_name,
    p_operation,
    p_status,
    p_affected_rows,
    p_error_message,
    p_metadata,
    CASE WHEN p_status IN ('COMPLETED', 'FAILED', 'ROLLED_BACK') THEN NOW() ELSE NULL END
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create backup of table data
CREATE OR REPLACE FUNCTION backup_table_data(
  p_backup_name TEXT,
  p_table_name TEXT,
  p_data JSONB
) RETURNS UUID AS $$
DECLARE
  v_backup_id UUID;
  v_row_count INTEGER;
BEGIN
  v_row_count := jsonb_array_length(p_data);
  
  INSERT INTO migration_backups (
    backup_name,
    table_name,
    backup_data,
    row_count
  ) VALUES (
    p_backup_name,
    p_table_name,
    p_data,
    v_row_count
  )
  RETURNING id INTO v_backup_id;
  
  RETURN v_backup_id;
END;
$$ LANGUAGE plpgsql;

-- Log infrastructure setup
SELECT log_migration_operation(
  'setup_migration_infrastructure',
  'CREATE_TABLES',
  'COMPLETED',
  0,
  NULL,
  '{"description": "Created migration_logs and migration_backups tables"}'::jsonb
);

-- ============================================================================
-- PART 2: CORE TABLES (SUBJECTS, TOPICS, QUESTIONS)
-- ============================================================================

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color_theme TEXT,
  exam_type TEXT CHECK (exam_type IN ('JAMB', 'WAEC', 'BOTH')) DEFAULT 'BOTH',
  subject_category TEXT CHECK (subject_category IN ('SCIENCE', 'COMMERCIAL', 'ARTS', 'GENERAL', 'LANGUAGE')) DEFAULT 'GENERAL',
  is_mandatory BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subjects_slug ON subjects(slug);
CREATE INDEX idx_subjects_exam_type ON subjects(exam_type);
CREATE INDEX idx_subjects_category ON subjects(subject_category);
CREATE INDEX idx_subjects_active ON subjects(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_subjects_sort ON subjects(sort_order);

-- Create topics table
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subject_id, slug)
);

CREATE INDEX idx_topics_subject ON topics(subject_id);
CREATE INDEX idx_topics_slug ON topics(slug);
CREATE INDEX idx_topics_active ON topics(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_topics_order ON topics(subject_id, order_index);

-- Create questions table
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_answer TEXT NOT NULL CHECK (correct_answer IN ('A', 'B', 'C', 'D')),
  explanation TEXT,
  difficulty_level TEXT CHECK (difficulty_level IN ('EASY', 'MEDIUM', 'HARD')) DEFAULT 'MEDIUM',
  exam_year INTEGER,
  exam_type TEXT CHECK (exam_type IN ('JAMB', 'WAEC')),
  question_number INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_questions_topic ON questions(topic_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty_level);
CREATE INDEX idx_questions_active ON questions(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_questions_exam_year ON questions(exam_year) WHERE exam_year IS NOT NULL;
CREATE INDEX idx_questions_exam_type ON questions(exam_type) WHERE exam_type IS NOT NULL;
CREATE INDEX idx_questions_year_type ON questions(exam_year, exam_type) WHERE exam_year IS NOT NULL AND exam_type IS NOT NULL;
CREATE INDEX idx_questions_topic_year ON questions(topic_id, exam_year) WHERE exam_year IS NOT NULL;

-- Enable RLS
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for subjects
CREATE POLICY "Anyone can view active subjects"
  ON subjects FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Authenticated users can view all subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (TRUE);

-- RLS Policies for topics
CREATE POLICY "Anyone can view active topics"
  ON topics FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Authenticated users can view all topics"
  ON topics FOR SELECT
  TO authenticated
  USING (TRUE);

-- RLS Policies for questions
CREATE POLICY "Anyone can view active questions"
  ON questions FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Authenticated users can view all questions"
  ON questions FOR SELECT
  TO authenticated
  USING (TRUE);

-- Log completion
SELECT log_migration_operation(
  'create_core_tables',
  'CREATE_TABLES',
  'COMPLETED',
  0,
  NULL,
  '{"description": "Created subjects, topics, and questions tables"}'::jsonb
);

-- ============================================================================
-- PART 3: NEW FEATURE TABLES
-- ============================================================================

-- Create subject_combinations table
CREATE TABLE IF NOT EXISTS subject_combinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('JAMB', 'WAEC')),
  combination_type TEXT CHECK (combination_type IN ('SCIENCE', 'COMMERCIAL', 'ARTS', 'CUSTOM')),
  subjects TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subject_combinations_user ON subject_combinations(user_id);
CREATE INDEX idx_subject_combinations_exam_type ON subject_combinations(exam_type);
CREATE INDEX idx_subject_combinations_type ON subject_combinations(combination_type);

ALTER TABLE subject_combinations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subject combinations"
  ON subject_combinations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subject combinations"
  ON subject_combinations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subject combinations"
  ON subject_combinations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subject combinations"
  ON subject_combinations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create study_materials table
CREATE TABLE IF NOT EXISTS study_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('SYLLABUS', 'NOVEL', 'TOPIC_SUMMARY', 'VIDEO', 'BROCHURE')),
  subject_id UUID REFERENCES subjects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  exam_type TEXT CHECK (exam_type IN ('JAMB', 'WAEC', 'BOTH')) DEFAULT 'BOTH',
  is_premium BOOLEAN DEFAULT FALSE,
  order_index INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_study_materials_type ON study_materials(type);
CREATE INDEX idx_study_materials_subject ON study_materials(subject_id);
CREATE INDEX idx_study_materials_exam_type ON study_materials(exam_type);
CREATE INDEX idx_study_materials_premium ON study_materials(is_premium);
CREATE INDEX idx_study_materials_order ON study_materials(subject_id, order_index);

ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view non-premium study materials"
  ON study_materials FOR SELECT
  USING (is_premium = FALSE);

CREATE POLICY "Authenticated users can view all study materials"
  ON study_materials FOR SELECT TO authenticated
  USING (TRUE);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('SCORE', 'TARGET_REMINDER', 'ACHIEVEMENT', 'SUBSCRIPTION', 'SYSTEM')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = FALSE;
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create study_targets table
CREATE TABLE IF NOT EXISTS study_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('DAILY', 'WEEKLY', 'MONTHLY')),
  target_value INTEGER NOT NULL CHECK (target_value > 0),
  current_progress INTEGER DEFAULT 0,
  reminder_time TIME,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_study_targets_user ON study_targets(user_id);
CREATE INDEX idx_study_targets_type ON study_targets(target_type);
CREATE INDEX idx_study_targets_active ON study_targets(user_id, is_active) WHERE is_active = TRUE;

ALTER TABLE study_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own study targets"
  ON study_targets FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study targets"
  ON study_targets FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study targets"
  ON study_targets FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study targets"
  ON study_targets FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Create mock_exam_sessions table
CREATE TABLE IF NOT EXISTS mock_exam_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('JAMB', 'WAEC')),
  subjects JSONB NOT NULL,
  total_time_limit INTEGER NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  total_score INTEGER,
  total_questions INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mock_exam_sessions_user ON mock_exam_sessions(user_id);
CREATE INDEX idx_mock_exam_sessions_exam_type ON mock_exam_sessions(exam_type);
CREATE INDEX idx_mock_exam_sessions_completed ON mock_exam_sessions(user_id, completed_at);
CREATE INDEX idx_mock_exam_sessions_started ON mock_exam_sessions(started_at DESC);

ALTER TABLE mock_exam_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own mock exam sessions"
  ON mock_exam_sessions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mock exam sessions"
  ON mock_exam_sessions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mock exam sessions"
  ON mock_exam_sessions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Log completion
SELECT log_migration_operation(
  'create_feature_tables',
  'CREATE_TABLES',
  'COMPLETED',
  5,
  NULL,
  '{"description": "Created all feature tables", "tables": ["subject_combinations", "study_materials", "notifications", "study_targets", "mock_exam_sessions"]}'::jsonb
);

-- ============================================================================
-- PART 4: SEED JAMB/WAEC SUBJECTS
-- ============================================================================

INSERT INTO subjects (name, slug, description, icon, color_theme, exam_type, subject_category, is_mandatory, is_active, sort_order)
VALUES
  -- Mandatory subject
  ('English Language', 'english-language', 'Compulsory for all JAMB and WAEC candidates', 'book-open', '#1E40AF', 'BOTH', 'GENERAL', TRUE, TRUE, 1),
  
  -- General subjects
  ('Mathematics', 'mathematics', 'Core subject for Science and Commercial combinations', 'calculator', '#7C3AED', 'BOTH', 'GENERAL', FALSE, TRUE, 2),
  ('Geography', 'geography', 'Available for multiple combinations', 'map', '#F59E0B', 'BOTH', 'GENERAL', FALSE, TRUE, 7),
  ('Civic Education', 'civic-education', 'General knowledge and citizenship education', 'landmark', '#14B8A6', 'WAEC', 'GENERAL', FALSE, TRUE, 13),
  
  -- Science subjects
  ('Physics', 'physics', 'Core science subject covering mechanics, electricity, and waves', 'atom', '#DC2626', 'BOTH', 'SCIENCE', FALSE, TRUE, 3),
  ('Chemistry', 'chemistry', 'Study of matter, chemical reactions, and compounds', 'flask', '#059669', 'BOTH', 'SCIENCE', FALSE, TRUE, 4),
  ('Biology', 'biology', 'Life sciences covering plants, animals, and human biology', 'dna', '#10B981', 'BOTH', 'SCIENCE', FALSE, TRUE, 5),
  ('Further Mathematics', 'further-mathematics', 'Advanced mathematics for science students', 'sigma', '#6366F1', 'BOTH', 'SCIENCE', FALSE, TRUE, 6),
  ('Food & Nutrition', 'food-nutrition', 'Study of food science, nutrition, and dietetics', 'utensils', '#EC4899', 'WAEC', 'SCIENCE', FALSE, TRUE, 8),
  
  -- Commercial subjects
  ('Commerce', 'commerce', 'Business and trade fundamentals', 'briefcase', '#3B82F6', 'BOTH', 'COMMERCIAL', FALSE, TRUE, 9),
  ('Accounting', 'accounting', 'Financial accounting and bookkeeping principles', 'receipt', '#8B5CF6', 'BOTH', 'COMMERCIAL', FALSE, TRUE, 10),
  ('Economics', 'economics', 'Study of production, distribution, and consumption', 'trending-up', '#EF4444', 'BOTH', 'COMMERCIAL', FALSE, TRUE, 11),
  ('Marketing', 'marketing', 'Principles of marketing and consumer behavior', 'megaphone', '#F97316', 'WAEC', 'COMMERCIAL', FALSE, TRUE, 12),
  
  -- Arts subjects
  ('Literature in English', 'literature-in-english', 'Study of prose, poetry, and drama', 'book', '#A855F7', 'BOTH', 'ARTS', FALSE, TRUE, 14),
  ('Government', 'government', 'Political science and governance systems', 'building-columns', '#0EA5E9', 'BOTH', 'ARTS', FALSE, TRUE, 15),
  ('CRS/IRS', 'crs-irs', 'Christian Religious Studies / Islamic Religious Studies', 'church', '#84CC16', 'BOTH', 'ARTS', FALSE, TRUE, 16),
  ('Music', 'music', 'Music theory, history, and performance', 'music', '#F43F5E', 'WAEC', 'ARTS', FALSE, TRUE, 17),
  ('History', 'history', 'World and African history', 'scroll', '#78716C', 'WAEC', 'ARTS', FALSE, TRUE, 18),
  
  -- Nigerian languages
  ('Yoruba', 'yoruba', 'Yoruba language and literature', 'language', '#22C55E', 'BOTH', 'LANGUAGE', FALSE, TRUE, 19),
  ('Hausa', 'hausa', 'Hausa language and literature', 'language', '#06B6D4', 'BOTH', 'LANGUAGE', FALSE, TRUE, 20),
  ('Igbo', 'igbo', 'Igbo language and literature', 'language', '#F59E0B', 'BOTH', 'LANGUAGE', FALSE, TRUE, 21)
ON CONFLICT (slug) DO NOTHING;

-- Log completion
DO $$
DECLARE
  v_log_id UUID;
  v_subject_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_subject_count FROM subjects;
  
  SELECT log_migration_operation(
    'seed_jamb_waec_subjects',
    'INSERT_SUBJECTS',
    'COMPLETED',
    v_subject_count,
    NULL,
    jsonb_build_object(
      'description', 'Seeded all 21 JAMB/WAEC subjects',
      'subjects_count', v_subject_count
    )
  ) INTO v_log_id;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check subjects were created
SELECT COUNT(*) as subject_count FROM subjects;

-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'subjects', 'topics', 'questions', 'subject_combinations',
    'study_materials', 'notifications', 'study_targets', 'mock_exam_sessions'
  )
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'subjects', 'topics', 'questions', 'subject_combinations',
    'study_materials', 'notifications', 'study_targets', 'mock_exam_sessions'
  );

-- View migration logs
SELECT 
  migration_name,
  operation,
  status,
  affected_rows,
  created_at
FROM migration_logs
ORDER BY created_at DESC;

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
