-- ============================================================================
-- BACKFILL USER PROFILES FOR EXISTING USERS
-- ============================================================================
-- Description: Create user_profiles records for existing auth.users without profiles
-- Date: 2025-01-25
-- Run this AFTER running 20250125_handle_new_user.sql migration

-- First, add the email and is_active columns if they don't exist
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Backfill user_profiles for existing users
INSERT INTO public.user_profiles (id, email, full_name, is_active, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', ''),
  true,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL;

-- Verify the backfill
SELECT 
  COUNT(*) as total_auth_users,
  (SELECT COUNT(*) FROM user_profiles) as total_profiles,
  COUNT(*) - (SELECT COUNT(*) FROM user_profiles) as missing_profiles
FROM auth.users;

-- Show users that were backfilled
SELECT 
  up.id,
  up.email,
  up.full_name,
  up.created_at
FROM user_profiles up
WHERE up.created_at::date = CURRENT_DATE
ORDER BY up.created_at DESC;
