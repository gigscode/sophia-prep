-- ============================================================================
-- HANDLE NEW USER TRIGGER (Enhanced with Error Handling)
-- ============================================================================
-- Description: Automatically create user_profiles record when new user signs up
-- Date: 2025-01-25 (Updated: 2025-02-02)
-- Run this in Supabase Dashboard > SQL Editor
-- 
-- Changes in v2:
-- - Added EXCEPTION block for error handling
-- - Added logging with RAISE WARNING for errors
-- - Added RAISE NOTICE for successful creation
-- - Added subscription_plan default value
-- - Handles duplicate key errors gracefully
-- ============================================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Attempt to create user profile with error handling
  BEGIN
    INSERT INTO public.user_profiles (id, full_name, email, is_active, subscription_plan, created_at, updated_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NEW.email,
      true,
      'Free',
      NOW(),
      NOW()
    );
    
    -- Log successful profile creation
    RAISE NOTICE '[TRIGGER_PROFILE_CREATION] Successfully created profile for user %', NEW.id;
    
  EXCEPTION
    WHEN unique_violation THEN
      -- Profile already exists, log and continue
      RAISE WARNING '[TRIGGER_PROFILE_CREATION] Profile already exists for user %', NEW.id;
    WHEN OTHERS THEN
      -- Log any other errors but don't block user signup
      RAISE WARNING '[TRIGGER_PROFILE_CREATION_FAILED] Failed to create profile for user %: % (SQLSTATE: %)', 
        NEW.id, SQLERRM, SQLSTATE;
  END;
  
  -- Always return NEW to allow auth.users insert to complete
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Check if trigger function exists:
-- SELECT proname, prosrc FROM pg_proc WHERE proname = 'handle_new_user';
--
-- Check if trigger exists:
-- SELECT tgname, tgtype, tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created';
--
-- Test trigger by creating a test user (run in Supabase SQL Editor):
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
-- VALUES (
--   gen_random_uuid(),
--   'test@example.com',
--   crypt('testpassword', gen_salt('bf')),
--   NOW(),
--   '{"full_name": "Test User"}'::jsonb
-- );
--
-- Verify profile was created:
-- SELECT * FROM user_profiles WHERE email = 'test@example.com';
-- ============================================================================
