-- ============================================================================
-- ADD ADMIN POLICIES FOR USER_PROFILES
-- ============================================================================
-- Description: Allow admins to view and manage all user profiles
-- Date: 2025-01-25
-- Run this in Supabase Dashboard > SQL Editor
-- NOTE: Only run this file if you already have admin policies for subjects/topics/questions

-- USER_PROFILES (Admin access for user management)
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

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Check if policies were created:
-- SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
-- ============================================================================
