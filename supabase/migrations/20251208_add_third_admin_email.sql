-- ============================================================================
-- ADD SOPHIAREIGNSACADEMY TO ADMIN POLICIES
-- ============================================================================
-- Description: Update all admin policies to include sophiareignsacademy@gmail.com
--              along with existing admins (reubensunday1220@gmail.com, gigsdev007@gmail.com)
-- Date: 2025-12-08
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================================

-- Drop and recreate all admin policies with the updated email list
-- This ensures all three admin emails have complete access

-- ============================================================================
-- SUBJECTS POLICIES
-- ============================================================================

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

-- ============================================================================
-- TOPICS POLICIES
-- ============================================================================

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

-- ============================================================================
-- QUESTIONS POLICIES
-- ============================================================================

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

-- ============================================================================
-- USER_PROFILES POLICIES
-- ============================================================================

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

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Run these to verify all policies were updated correctly:
-- 
-- -- Check subjects policies
-- SELECT * FROM pg_policies WHERE tablename = 'subjects' AND policyname LIKE 'Admins%';
-- 
-- -- Check topics policies
-- SELECT * FROM pg_policies WHERE tablename = 'topics' AND policyname LIKE 'Admins%';
-- 
-- -- Check questions policies
-- SELECT * FROM pg_policies WHERE tablename = 'questions' AND policyname LIKE 'Admins%';
-- 
-- -- Check user_profiles policies
-- SELECT * FROM pg_policies WHERE tablename = 'user_profiles' AND policyname LIKE 'Admins%';
-- ============================================================================
