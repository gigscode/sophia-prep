# Database Trigger Verification Guide

This guide explains how to manually verify that the `on_auth_user_created` trigger exists and is properly configured in your Supabase database.

## Why This Matters

The `on_auth_user_created` trigger is critical for automatic user profile creation. When a new user signs up through the authentication system, this trigger automatically creates a corresponding record in the `user_profiles` table. Without this trigger, users would need to log in twice before their profile is created (once to trigger the fallback mechanism).

## Automatic Verification

The application performs an automatic verification check on startup. Check your browser console for messages:

- ✓ Success: `[DATABASE_VERIFICATION] User profile trigger verification passed`
- ⚠️ Warning: `[DATABASE_VERIFICATION] WARNING: User profile trigger may be missing!`

**Note:** Due to client-side limitations, the automatic check may not be able to definitively verify the trigger. Manual verification is recommended for production environments.

## Manual Verification Steps

### Step 1: Check if Trigger Exists

1. Open your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Run the following query:

```sql
SELECT 
  t.tgname AS trigger_name,
  t.tgenabled AS enabled,
  p.proname AS function_name,
  c.relname AS table_name,
  n.nspname AS schema_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE t.tgname = 'on_auth_user_created';
```

**Expected Result:**
```
trigger_name         | on_auth_user_created
enabled              | O (enabled for all operations)
function_name        | handle_new_user
table_name           | users
schema_name          | auth
```

**If no results:** The trigger is missing and needs to be created (see Step 4).

### Step 2: Verify Trigger Function Exists

Run this query to check if the trigger function is defined:

```sql
SELECT 
  p.proname AS function_name,
  n.nspname AS schema_name,
  pg_get_functiondef(p.oid) AS function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'handle_new_user';
```

**Expected Result:**
- The function should exist in the `public` schema
- The function definition should include logic to insert into `user_profiles`

### Step 3: Test the Trigger

Create a test user to verify the trigger works:

```sql
-- 1. Create a test user in auth.users (this simulates signup)
-- Note: You'll need to use Supabase Auth API for this, or create via Dashboard

-- 2. Check if profile was created automatically
SELECT 
  u.id,
  u.email,
  up.id AS profile_id,
  up.email AS profile_email,
  up.created_at AS profile_created_at
FROM auth.users u
LEFT JOIN user_profiles up ON u.id = up.id
WHERE u.email = 'test@example.com';
```

**Expected Result:**
- Both `profile_id` and `profile_email` should have values
- `profile_created_at` should be very close to the user's creation time

### Step 4: Create Missing Trigger

If the trigger is missing, deploy it using the migration file:

```bash
# If using Supabase CLI
supabase db push

# Or run the migration file directly in SQL Editor
```

Alternatively, create the trigger manually in SQL Editor:

```sql
-- First, create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    subscription_plan,
    is_active
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'Free',
    true
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't block user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Then, create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Step 5: Verify Trigger Permissions

Ensure the trigger function has proper permissions:

```sql
-- Check function owner and security settings
SELECT 
  p.proname,
  pg_catalog.pg_get_userbyid(p.proowner) AS owner,
  p.prosecdef AS security_definer
FROM pg_proc p
WHERE p.proname = 'handle_new_user';
```

**Expected Result:**
- `security_definer` should be `true` (allows function to run with elevated privileges)

## Troubleshooting

### Trigger Exists But Profiles Not Created

1. **Check trigger is enabled:**
   ```sql
   SELECT tgname, tgenabled 
   FROM pg_trigger 
   WHERE tgname = 'on_auth_user_created';
   ```
   - `tgenabled` should be `O` (enabled)

2. **Check for errors in logs:**
   - Go to Supabase Dashboard → Logs → Postgres Logs
   - Look for warnings related to `handle_new_user`

3. **Verify RLS policies:**
   ```sql
   SELECT * FROM user_profiles WHERE id = 'user-id-here';
   ```
   - Ensure you can query the table

### Trigger Function Fails Silently

The trigger function includes error handling that prevents it from blocking user signup. Check PostgreSQL logs for warnings:

```sql
-- In Supabase Dashboard → Logs → Postgres Logs
-- Look for: "Failed to create profile for user"
```

### Fallback Mechanism Activating Too Often

If you see many `[FALLBACK_PROFILE_CREATION]` log entries, it indicates the trigger is not working properly. Follow the verification steps above to diagnose the issue.

## Monitoring Recommendations

1. **Set up alerts** for missing profiles:
   ```sql
   -- Query to find users without profiles
   SELECT COUNT(*) 
   FROM auth.users u
   LEFT JOIN user_profiles up ON u.id = up.id
   WHERE up.id IS NULL;
   ```

2. **Monitor fallback activation rate:**
   - Check application logs for `[FALLBACK_PROFILE_CREATION]` entries
   - If > 5% of signups use fallback, investigate trigger issues

3. **Regular verification:**
   - Run verification queries weekly
   - Ensure no users exist without profiles for > 1 hour

## Related Files

- Trigger function: `supabase/migrations/20250125_handle_new_user_v2.sql`
- Verification utility: `src/utils/database-verification.ts`
- Fallback mechanism: `src/hooks/useAuth.tsx` (ensureUserProfile function)
- Migration script: `scripts/sync-user-profiles.js`

## Support

If you continue to experience issues with profile creation:

1. Check the migration log: `.kiro/specs/user-profile-auto-sync/migration-log.md`
2. Review the design document: `.kiro/specs/user-profile-auto-sync/design.md`
3. Verify all requirements are met: `.kiro/specs/user-profile-auto-sync/requirements.md`
