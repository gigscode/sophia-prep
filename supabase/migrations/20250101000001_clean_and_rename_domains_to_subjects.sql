-- Migration: Create subjects table for JAMB/WAEC structure
-- This migration creates the subjects table from scratch for the Sophia Prep platform
-- Requirements: 9.4, 9.5

-- Start migration logging
DO $$
DECLARE
  v_log_id UUID;
BEGIN
  -- Log migration start
  SELECT log_migration_operation(
    'create_subjects_table',
    'START_MIGRATION',
    'STARTED',
    0,
    NULL,
    '{"description": "Creating subjects table for JAMB/WAEC platform"}'::jsonb
  ) INTO v_log_id;
END $$;

-- Step 1: Create subjects table with JAMB/WAEC structure
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

-- Create indexes for subjects table
CREATE INDEX idx_subjects_slug ON subjects(slug);
CREATE INDEX idx_subjects_exam_type ON subjects(exam_type);
CREATE INDEX idx_subjects_category ON subjects(subject_category);
CREATE INDEX idx_subjects_active ON subjects(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_subjects_sort ON subjects(sort_order);

-- Step 2: Create topics table (if not exists)
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

-- Create indexes for topics table
CREATE INDEX idx_topics_subject ON topics(subject_id);
CREATE INDEX idx_topics_slug ON topics(slug);
CREATE INDEX idx_topics_active ON topics(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_topics_order ON topics(subject_id, order_index);

-- Step 3: Create questions table (if not exists)
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
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for questions table
CREATE INDEX idx_questions_topic ON questions(topic_id);
CREATE INDEX idx_questions_difficulty ON questions(difficulty_level);
CREATE INDEX idx_questions_active ON questions(is_active) WHERE is_active = TRUE;

-- Enable Row Level Security on all tables
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subjects (public read access)
CREATE POLICY "Anyone can view active subjects"
  ON subjects FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Authenticated users can view all subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (TRUE);

-- Create RLS policies for topics (public read access)
CREATE POLICY "Anyone can view active topics"
  ON topics FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Authenticated users can view all topics"
  ON topics FOR SELECT
  TO authenticated
  USING (TRUE);

-- Create RLS policies for questions (public read access)
CREATE POLICY "Anyone can view active questions"
  ON questions FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Authenticated users can view all questions"
  ON questions FOR SELECT
  TO authenticated
  USING (TRUE);

-- Log migration completion
DO $$
DECLARE
  v_log_id UUID;
  v_subject_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_subject_count FROM subjects;
  
  SELECT log_migration_operation(
    'create_subjects_table',
    'CREATE_SUBJECTS_TABLE',
    'COMPLETED',
    v_subject_count,
    NULL,
    '{"description": "Created subjects, topics, and questions tables with proper JAMB/WAEC structure"}'::jsonb
  ) INTO v_log_id;
END $$;
