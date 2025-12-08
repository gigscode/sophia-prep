-- ============================================================================
-- CONDITIONAL UPDATE FOR ADMIN POLICIES
-- ============================================================================
-- Description: Check if tables exist first, then update admin policies
--              to include all three admin emails
-- Date: 2025-12-08
-- ============================================================================

-- First, let's check what tables exist
-- Run this query first to see what you have:
-- SELECT tablename FROM pg_tables WHERE schemaname = 'public';

-- ============================================================================
-- ONLY RUN THE SECTIONS BELOW FOR TABLES THAT EXIST IN YOUR DATABASE
-- ============================================================================

-- ============================================================================
-- SUBJECTS POLICIES (Run only if subjects table exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subjects') THEN
    DROP POLICY IF EXISTS "Admins can insert subjects" ON subjects;
    CREATE POLICY "Admins can insert subjects"
    ON subjects FOR INSERT
    TO authenticated
    WITH CHECK (auth.jwt() ->> 'email' IN ('reubensunday1220@gmail.com', 'sophiareignsacademy@gmail.com', 'gigsdev007@gmail.com'));

    DROP POLICY IF EXISTS "Admins can update subjects" ON subjects;
    CREATE POLICY "Admins can update subjects"
    ON subjects FOR UPDATE
    TO authenticated
    USING (auth.jwt() ->> 'email' IN ('reubensunday1220@gmail.com', 'sophiareignsacademy@gmail.com', 'gigsdev007@gmail.com'));

    DROP POLICY IF EXISTS "Admins can delete subjects" ON subjects;
    CREATE POLICY "Admins can delete subjects"
    ON subjects FOR DELETE
    TO authenticated
    USING (auth.jwt() ->> 'email' IN ('reubensunday1220@gmail.com', 'sophiareignsacademy@gmail.com', 'gigsdev007@gmail.com'));
    
    RAISE NOTICE 'Updated admin policies for subjects table';
  ELSE
    RAISE NOTICE 'Subjects table does not exist - skipping';
  END IF;
END $$;

-- ============================================================================
-- TOPICS POLICIES (Run only if topics table exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'topics') THEN
    DROP POLICY IF EXISTS "Admins can insert topics" ON topics;
    CREATE POLICY "Admins can insert topics"
    ON topics FOR INSERT
    TO authenticated
    WITH CHECK (auth.jwt() ->> 'email' IN ('reubensunday1220@gmail.com', 'sophiareignsacademy@gmail.com', 'gigsdev007@gmail.com'));

    DROP POLICY IF EXISTS "Admins can update topics" ON topics;
    CREATE POLICY "Admins can update topics"
    ON topics FOR UPDATE
    TO authenticated
    USING (auth.jwt() ->> 'email' IN ('reubensunday1220@gmail.com', 'sophiareignsacademy@gmail.com', 'gigsdev007@gmail.com'));

    DROP POLICY IF EXISTS "Admins can delete topics" ON topics;
    CREATE POLICY "Admins can delete topics"
    ON topics FOR DELETE
    TO authenticated
    USING (auth.jwt() ->> 'email' IN ('reubensunday1220@gmail.com', 'sophiareignsacademy@gmail.com', 'gigsdev007@gmail.com'));
    
    RAISE NOTICE 'Updated admin policies for topics table';
  ELSE
    RAISE NOTICE 'Topics table does not exist - skipping';
  END IF;
END $$;

-- ============================================================================
-- QUESTIONS POLICIES (Run only if questions table exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'questions') THEN
    DROP POLICY IF EXISTS "Admins can insert questions" ON questions;
    CREATE POLICY "Admins can insert questions"
    ON questions FOR INSERT
    TO authenticated
    WITH CHECK (auth.jwt() ->> 'email' IN ('reubensunday1220@gmail.com', 'sophiareignsacademy@gmail.com', 'gigsdev007@gmail.com'));

    DROP POLICY IF EXISTS "Admins can update questions" ON questions;
    CREATE POLICY "Admins can update questions"
    ON questions FOR UPDATE
    TO authenticated
    USING (auth.jwt() ->> 'email' IN ('reubensunday1220@gmail.com', 'sophiareignsacademy@gmail.com', 'gigsdev007@gmail.com'));

    DROP POLICY IF EXISTS "Admins can delete questions" ON questions;
    CREATE POLICY "Admins can delete questions"
    ON questions FOR DELETE
    TO authenticated
    USING (auth.jwt() ->> 'email' IN ('reubensunday1220@gmail.com', 'sophiareignsacademy@gmail.com', 'gigsdev007@gmail.com'));
    
    RAISE NOTICE 'Updated admin policies for questions table';
  ELSE
    RAISE NOTICE 'Questions table does not exist - skipping';
  END IF;
END $$;

-- ============================================================================
-- USER_PROFILES POLICIES (Run only if user_profiles table exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_profiles') THEN
    DROP POLICY IF EXISTS "Admins can view all user profiles" ON user_profiles;
    CREATE POLICY "Admins can view all user profiles"
    ON user_profiles FOR SELECT
    TO authenticated
    USING (auth.jwt() ->> 'email' IN ('reubensunday1220@gmail.com', 'sophiareignsacademy@gmail.com', 'gigsdev007@gmail.com'));

    DROP POLICY IF EXISTS "Admins can update user profiles" ON user_profiles;
    CREATE POLICY "Admins can update user profiles"
    ON user_profiles FOR UPDATE
    TO authenticated
    USING (auth.jwt() ->> 'email' IN ('reubensunday1220@gmail.com', 'sophiareignsacademy@gmail.com', 'gigsdev007@gmail.com'));

    DROP POLICY IF EXISTS "Admins can delete user profiles" ON user_profiles;
    CREATE POLICY "Admins can delete user profiles"
    ON user_profiles FOR DELETE
    TO authenticated
    USING (auth.jwt() ->> 'email' IN ('reubensunday1220@gmail.com', 'sophiareignsacademy@gmail.com', 'gigsdev007@gmail.com'));
    
    RAISE NOTICE 'Updated admin policies for user_profiles table';
  ELSE
    RAISE NOTICE 'User_profiles table does not exist - skipping';
  END IF;
END $$;
