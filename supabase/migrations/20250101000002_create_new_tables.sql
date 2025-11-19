-- Migration: Create new database tables for JAMB/WAEC features
-- This migration creates subject_combinations, study_materials, notifications, study_targets, and mock_exam_sessions tables
-- Requirements: 1.1, 3.1, 5.1, 5.2

-- Log migration start
DO $$
DECLARE
  v_log_id UUID;
BEGIN
  SELECT log_migration_operation(
    'create_new_tables',
    'START_MIGRATION',
    'STARTED',
    0,
    NULL,
    '{"description": "Creating new tables for JAMB/WAEC features"}'::jsonb
  ) INTO v_log_id;
END $$;

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

-- Enable RLS for subject_combinations
ALTER TABLE subject_combinations ENABLE ROW LEVEL SECURITY;

-- RLS policies for subject_combinations
CREATE POLICY "Users can view their own subject combinations"
  ON subject_combinations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subject combinations"
  ON subject_combinations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subject combinations"
  ON subject_combinations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subject combinations"
  ON subject_combinations FOR DELETE
  TO authenticated
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

-- Enable RLS for study_materials
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;

-- RLS policies for study_materials
CREATE POLICY "Anyone can view non-premium study materials"
  ON study_materials FOR SELECT
  USING (is_premium = FALSE);

CREATE POLICY "Authenticated users can view all study materials"
  ON study_materials FOR SELECT
  TO authenticated
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

-- Enable RLS for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON notifications FOR DELETE
  TO authenticated
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

-- Enable RLS for study_targets
ALTER TABLE study_targets ENABLE ROW LEVEL SECURITY;

-- RLS policies for study_targets
CREATE POLICY "Users can view their own study targets"
  ON study_targets FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own study targets"
  ON study_targets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own study targets"
  ON study_targets FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own study targets"
  ON study_targets FOR DELETE
  TO authenticated
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

-- Enable RLS for mock_exam_sessions
ALTER TABLE mock_exam_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for mock_exam_sessions
CREATE POLICY "Users can view their own mock exam sessions"
  ON mock_exam_sessions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own mock exam sessions"
  ON mock_exam_sessions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own mock exam sessions"
  ON mock_exam_sessions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Log migration completion
DO $$
DECLARE
  v_log_id UUID;
BEGIN
  SELECT log_migration_operation(
    'create_new_tables',
    'CREATE_TABLES',
    'COMPLETED',
    5,
    NULL,
    '{"description": "Created subject_combinations, study_materials, notifications, study_targets, and mock_exam_sessions tables", "tables_created": ["subject_combinations", "study_materials", "notifications", "study_targets", "mock_exam_sessions"]}'::jsonb
  ) INTO v_log_id;
END $$;
