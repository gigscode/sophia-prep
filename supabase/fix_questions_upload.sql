-- ============================================================================
-- SOPHIA PREP - QUESTION UPLOAD & RLS FIX
-- ============================================================================
-- This script fixes "new row violates row-level security policy" errors
-- and ensures the 'questions' table schema matches the application's needs.

-- 1. ENSURE QUESTIONS TABLE HAS CORRECT COLUMNS
DO $$
BEGIN
  -- Add subject_id if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'subject_id'
  ) THEN
    ALTER TABLE questions ADD COLUMN subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON questions(subject_id);
  END IF;

  -- Make topic_id optional (NOT NULL might be set in some versions)
  ALTER TABLE questions ALTER COLUMN topic_id DROP NOT NULL;
  
  -- Add exam_type if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'exam_type'
  ) THEN
    ALTER TABLE questions ADD COLUMN exam_type TEXT CHECK (exam_type IN ('JAMB')) DEFAULT 'JAMB';
  END IF;
END $$;

-- 2. RESET RLS POLICIES FOR CONTENT TABLES
-- We use direct JWT email checks to avoid dependencies on user_profiles table during insertion

-- QUESTIONS POLICIES
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Questions are viewable by everyone" ON questions;
DROP POLICY IF EXISTS "Admins can manage questions" ON questions;
DROP POLICY IF EXISTS "Admins can insert questions" ON questions;
DROP POLICY IF EXISTS "Admins can update questions" ON questions;
DROP POLICY IF EXISTS "Admins can delete questions" ON questions;

-- Public read access
CREATE POLICY "Questions are viewable by everyone"
  ON questions FOR SELECT
  USING (is_active = true);

-- Admin full access (using JWT email for reliability)
CREATE POLICY "Admins can manage questions"
  ON questions FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      'reubensunday1220@gmail.com', 
      'sophiareignsacademy@gmail.com', 
      'gigsdev007@gmail.com'
    )
  )
  WITH CHECK (
    auth.jwt() ->> 'email' IN (
      'reubensunday1220@gmail.com', 
      'sophiareignsacademy@gmail.com', 
      'gigsdev007@gmail.com'
    )
  );

-- TOPICS POLICIES
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Topics are viewable by everyone" ON topics;
DROP POLICY IF EXISTS "Admins can manage topics" ON topics;

CREATE POLICY "Topics are viewable by everyone"
  ON topics FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage topics"
  ON topics FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      'reubensunday1220@gmail.com', 
      'sophiareignsacademy@gmail.com', 
      'gigsdev007@gmail.com'
    )
  )
  WITH CHECK (
    auth.jwt() ->> 'email' IN (
      'reubensunday1220@gmail.com', 
      'sophiareignsacademy@gmail.com', 
      'gigsdev007@gmail.com'
    )
  );

-- SUBJECTS POLICIES
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Subjects are viewable by everyone" ON subjects;
DROP POLICY IF EXISTS "Admins can manage subjects" ON subjects;

CREATE POLICY "Subjects are viewable by everyone"
  ON subjects FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage subjects"
  ON subjects FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN (
      'reubensunday1220@gmail.com', 
      'sophiareignsacademy@gmail.com', 
      'gigsdev007@gmail.com'
    )
  )
  WITH CHECK (
    auth.jwt() ->> 'email' IN (
      'reubensunday1220@gmail.com', 
      'sophiareignsacademy@gmail.com', 
      'gigsdev007@gmail.com'
    )
  );

-- 3. FINAL VALIDATION
DO $$ BEGIN
  RAISE NOTICE 'Question upload and RLS fixes applied successfully.';
END $$;
