-- ============================================================================
-- EXAM MODES SYSTEM - Database Schema Updates
-- ============================================================================
-- Date: 2025-02-01
-- Description: Add timer configurations and enhance quiz_attempts for exam modes
-- ============================================================================

-- ============================================================================
-- 0. CREATE UPDATE TRIGGER FUNCTION (IF NOT EXISTS)
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. CREATE TIMER CONFIGURATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS timer_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_type TEXT NOT NULL CHECK (exam_type IN ('JAMB', 'WAEC')),
  subject_slug TEXT,
  year INTEGER,
  duration_seconds INTEGER NOT NULL CHECK (duration_seconds > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_type, subject_slug, year)
);

CREATE INDEX idx_timer_configurations_exam_type ON timer_configurations(exam_type);
CREATE INDEX idx_timer_configurations_subject_slug ON timer_configurations(subject_slug);
CREATE INDEX idx_timer_configurations_year ON timer_configurations(year);

-- Add updated_at trigger
CREATE TRIGGER update_timer_configurations_updated_at 
  BEFORE UPDATE ON timer_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. INSERT DEFAULT TIMER CONFIGURATIONS
-- ============================================================================
-- Default configurations for JAMB and WAEC
INSERT INTO timer_configurations (exam_type, subject_slug, year, duration_seconds) VALUES
  ('JAMB', NULL, NULL, 2100),  -- 35 minutes default for JAMB (per subject)
  ('WAEC', NULL, NULL, 3600)   -- 60 minutes default for WAEC
ON CONFLICT (exam_type, subject_slug, year) DO NOTHING;

-- ============================================================================
-- 3. ENHANCE QUIZ_ATTEMPTS TABLE
-- ============================================================================
-- Add new columns for exam modes system
ALTER TABLE quiz_attempts 
  ADD COLUMN IF NOT EXISTS exam_type TEXT CHECK (exam_type IN ('JAMB', 'WAEC'));

-- Note: exam_year column already exists in the schema

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_exam_type ON quiz_attempts(exam_type);

-- ============================================================================
-- 4. ROW LEVEL SECURITY FOR TIMER CONFIGURATIONS
-- ============================================================================
ALTER TABLE timer_configurations ENABLE ROW LEVEL SECURITY;

-- Timer configurations are viewable by everyone (read-only for users)
CREATE POLICY "Timer configurations are viewable by everyone"
  ON timer_configurations FOR SELECT
  USING (true);

-- Only admins can modify timer configurations (handled by admin policies)

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
