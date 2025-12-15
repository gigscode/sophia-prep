-- Update Admin Email Addresses in RLS Policies
-- Date: 2025-12-15
-- Description: Update all RLS policies to use the correct super admin emails

-- Drop existing admin policies and recreate with correct emails
-- This ensures all admin policies use the updated email addresses

-- 1. Update user_profiles admin policies
DROP POLICY IF EXISTS "Admins can view all user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update all user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can insert user profiles" ON user_profiles;

CREATE POLICY "Admins can view all user profiles"
  ON user_profiles FOR SELECT
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND (
        up.email = 'reubensunday1220@gmail.com' OR 
        up.email = 'sophiareignsacademy@gmail.com' OR 
        up.email = 'gigsdev007@gmail.com'
      )
    )
  );

CREATE POLICY "Admins can update all user profiles"
  ON user_profiles FOR UPDATE
  USING (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND (
        up.email = 'reubensunday1220@gmail.com' OR 
        up.email = 'sophiareignsacademy@gmail.com' OR 
        up.email = 'gigsdev007@gmail.com'
      )
    )
  );

CREATE POLICY "Admins can insert user profiles"
  ON user_profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid() 
      AND (
        up.email = 'reubensunday1220@gmail.com' OR 
        up.email = 'sophiareignsacademy@gmail.com' OR 
        up.email = 'gigsdev007@gmail.com'
      )
    )
  );

-- 2. Update subjects admin policies (if they exist)
DROP POLICY IF EXISTS "Admins can manage subjects" ON subjects;

CREATE POLICY "Admins can manage subjects"
  ON subjects FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (
        email = 'reubensunday1220@gmail.com' OR 
        email = 'sophiareignsacademy@gmail.com' OR 
        email = 'gigsdev007@gmail.com'
      )
    )
  );

-- 3. Update questions admin policies (if they exist)
DROP POLICY IF EXISTS "Admins can manage questions" ON questions;

CREATE POLICY "Admins can manage questions"
  ON questions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (
        email = 'reubensunday1220@gmail.com' OR 
        email = 'sophiareignsacademy@gmail.com' OR 
        email = 'gigsdev007@gmail.com'
      )
    )
  );

-- 4. Update subscription plans admin policies (if they exist)
DROP POLICY IF EXISTS "Admins can manage subscription plans" ON subscription_plans;

CREATE POLICY "Admins can manage subscription plans"
  ON subscription_plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (
        email = 'reubensunday1220@gmail.com' OR 
        email = 'sophiareignsacademy@gmail.com' OR 
        email = 'gigsdev007@gmail.com'
      )
    )
  );

-- 5. Update user subscriptions admin policies (if they exist)
DROP POLICY IF EXISTS "Admins can manage user subscriptions" ON user_subscriptions;

CREATE POLICY "Admins can manage user subscriptions"
  ON user_subscriptions FOR ALL
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (
        email = 'reubensunday1220@gmail.com' OR 
        email = 'sophiareignsacademy@gmail.com' OR 
        email = 'gigsdev007@gmail.com'
      )
    )
  );

-- 6. Update quiz attempts admin policies (if they exist)
DROP POLICY IF EXISTS "Admins can view all quiz attempts" ON quiz_attempts;

CREATE POLICY "Admins can view all quiz attempts"
  ON quiz_attempts FOR SELECT
  USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (
        email = 'reubensunday1220@gmail.com' OR 
        email = 'sophiareignsacademy@gmail.com' OR 
        email = 'gigsdev007@gmail.com'
      )
    )
  );

RAISE NOTICE 'Admin email addresses updated in all RLS policies';