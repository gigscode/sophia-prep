# Database Migration Guide - Fix Missing User Profiles

## Overview

This guide walks you through fixing the missing user profile records issue by:
1. Adding email and is_active columns to user_profiles
2. Creating a trigger to auto-create profiles on signup
3. Adding admin RLS policies
4. Backfilling existing users

## Prerequisites

- Access to Supabase Dashboard
- Admin credentials for your Supabase project

## Step-by-Step Instructions

### Step 1: Add New Columns to user_profiles Table

1. Open **Supabase Dashboard** → **SQL Editor**
2. Run this SQL to add the new columns:

```sql
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
```

### Step 2: Create Auto-Profile Trigger

1. In **SQL Editor**, copy and paste the contents of:
   `supabase/migrations/20250125_handle_new_user.sql`
2. Click **Run**
3. Verify success - you should see "Success. No rows returned"

### Step 3: Add Admin RLS Policies

> [!NOTE]
> If you previously ran `20250124_add_admin_policies.sql` and got a "policy already exists" error, use the new file instead.

1. In **SQL Editor**, copy and paste the contents of:
   `supabase/migrations/20250125_add_user_profiles_admin_policies.sql`
   
   **OR** if you haven't run any admin policies before, use:
   `supabase/migrations/20250124_add_admin_policies.sql`
   
2. Click **Run**

### Step 4: Backfill Existing Users

1. In **SQL Editor**, copy and paste the contents of:
   `supabase/migrations/20250125_backfill_user_profiles.sql`
2. Click **Run**
3. Review the output to see how many users were backfilled

### Step 5: Verify the Fix

#### Check Trigger Exists
```sql
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

#### Check All Users Have Profiles
```sql
SELECT 
  COUNT(*) as total_auth_users,
  (SELECT COUNT(*) FROM user_profiles) as total_profiles
FROM auth.users;
```
Both counts should match!

#### View All User Profiles
```sql
SELECT id, email, full_name, is_active, created_at 
FROM user_profiles 
ORDER BY created_at DESC;
```

### Step 6: Test New User Registration

1. Open your application signup page
2. Create a new test user account
3. Check Supabase Dashboard → **Table Editor** → **user_profiles**
4. Verify the new user appears immediately after signup

### Step 7: Test Admin Panel

1. Log in as admin user (`reubensunday1220@gmail.com` or `gigsdev007@gmail.com`)
2. Navigate to admin panel → User Management
3. Verify all users are visible, including the two new users
4. Test filtering and search functionality

## Troubleshooting

### Issue: Trigger not firing
**Solution**: Check if trigger exists:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```
If missing, re-run Step 2.

### Issue: Admin can't see users
**Solution**: Verify RLS policies:
```sql
SELECT * FROM pg_policies WHERE tablename = 'user_profiles';
```
Should show policies for admins to SELECT, UPDATE, DELETE.

### Issue: Duplicate key error on backfill
**Solution**: Some profiles already exist. This is safe to ignore, or run:
```sql
-- Only insert users that don't have profiles
INSERT INTO public.user_profiles (id, email, full_name, is_active, created_at, updated_at)
SELECT au.id, au.email, COALESCE(au.raw_user_meta_data->>'full_name', ''), true, au.created_at, NOW()
FROM auth.users au
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE up.id IS NULL
ON CONFLICT (id) DO NOTHING;
```

## Rollback (if needed)

If you need to rollback these changes:

```sql
-- Remove trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Remove admin policies
DROP POLICY IF EXISTS "Admins can view all user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can update user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Admins can delete user profiles" ON user_profiles;

-- Remove columns (optional - only if you want to fully revert)
ALTER TABLE user_profiles DROP COLUMN IF EXISTS email;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS is_active;
```

## Expected Results

After completing all steps:
- ✅ All existing users have user_profiles records
- ✅ New signups automatically create user_profiles
- ✅ Admin panel shows all users
- ✅ Two previously missing users are now visible
- ✅ User count in admin analytics is accurate
