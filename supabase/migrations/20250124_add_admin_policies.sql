-- ============================================================================
-- ADD ADMIN POLICIES
-- ============================================================================
-- Description: Allow admins (by email) to manage content
-- Run this in Supabase Dashboard > SQL Editor

-- 1. SUBJECTS
CREATE POLICY "Admins can insert subjects"
ON subjects FOR INSERT
TO authenticated
WITH CHECK (auth.jwt() ->> 'email' IN ('reubensunday1220@gmail.com', 'gigsdev007@gmail.com'));

CREATE POLICY "Admins can update subjects"
ON subjects FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'email' IN ('reubensunday1220@gmail.com', 'gigsdev007@gmail.com'));

CREATE POLICY "Admins can delete subjects"
ON subjects FOR DELETE
TO authenticated
USING (auth.jwt() ->> 'email' IN ('reubensunday1220@gmail.com', 'gigsdev007@gmail.com'));

-- 2. TOPICS
CREATE POLICY "Admins can insert topics"
ON topics FOR INSERT
TO authenticated
WITH CHECK (auth.jwt() ->> 'email' IN ('reubensunday1220@gmail.com', 'gigsdev007@gmail.com'));

CREATE POLICY "Admins can update topics"
ON topics FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'email' IN ('reubensunday1220@gmail.com', 'gigsdev007@gmail.com'));

CREATE POLICY "Admins can delete topics"
ON topics FOR DELETE
TO authenticated
USING (auth.jwt() ->> 'email' IN ('reubensunday1220@gmail.com', 'gigsdev007@gmail.com'));

-- 3. QUESTIONS
CREATE POLICY "Admins can insert questions"
ON questions FOR INSERT
TO authenticated
WITH CHECK (auth.jwt() ->> 'email' IN ('reubensunday1220@gmail.com', 'gigsdev007@gmail.com'));

CREATE POLICY "Admins can update questions"
ON questions FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'email' IN ('reubensunday1220@gmail.com', 'gigsdev007@gmail.com'));

CREATE POLICY "Admins can delete questions"
ON questions FOR DELETE
TO authenticated
USING (auth.jwt() ->> 'email' IN ('reubensunday1220@gmail.com', 'gigsdev007@gmail.com'));

-- 4. USER_PROFILES (Admin access for user management)
CREATE POLICY "Admins can view all user profiles"
ON user_profiles FOR SELECT
TO authenticated
USING (auth.jwt() ->> 'email' IN ('reubensunday1220@gmail.com', 'gigsdev007@gmail.com'));

CREATE POLICY "Admins can update user profiles"
ON user_profiles FOR UPDATE
TO authenticated
USING (auth.jwt() ->> 'email' IN ('reubensunday1220@gmail.com', 'gigsdev007@gmail.com'));

CREATE POLICY "Admins can delete user profiles"
ON user_profiles FOR DELETE
TO authenticated
USING (auth.jwt() ->> 'email' IN ('reubensunday1220@gmail.com', 'gigsdev007@gmail.com'));
