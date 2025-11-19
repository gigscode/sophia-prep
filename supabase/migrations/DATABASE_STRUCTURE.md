# Sophia Prep Database Structure

## Complete Table List

### ✅ Tables You Already Have (8 tables)

1. **subjects** - JAMB/WAEC exam subjects
2. **topics** - Topics within subjects
3. **questions** - Quiz questions
4. **subject_combinations** - User's selected subject combinations
5. **study_materials** - Learning resources (syllabus, novels, videos)
6. **notifications** - User notifications
7. **study_targets** - Daily/weekly/monthly study goals
8. **mock_exam_sessions** - Mock exam tracking

### ❌ Missing Critical Tables (7 tables)

You need to run migration `20250101000005_create_missing_core_tables.sql` to add:

1. **quiz_attempts** - Stores quiz completion data
   - **Why needed**: Analytics, progress tracking, leaderboard (Requirements 2.6, 4.1-4.6)
   - **Critical**: YES - Without this, you can't track user performance

2. **user_progress** - Tracks learning material completion
   - **Why needed**: Study material progress tracking (Requirement 3.6)
   - **Critical**: YES - Without this, users can't track what they've studied

3. **subscription_plans** - Available subscription plans
   - **Why needed**: Define JAMB/WAEC subscription options (Requirements 7.1-7.2)
   - **Critical**: YES - Without this, you can't offer subscriptions

4. **user_subscriptions** - User subscription records
   - **Why needed**: Track active subscriptions, access control (Requirements 7.4-7.6)
   - **Critical**: YES - Without this, you can't manage premium access

5. **payments** - Payment transaction records
   - **Why needed**: Track Paystack payments, payment history (Requirement 7.3)
   - **Critical**: YES - Without this, you can't process payments

6. **coupon_codes** - Discount coupon management
   - **Why needed**: Apply discounts to subscriptions (Requirement 7.7)
   - **Critical**: MEDIUM - Nice to have for promotions

7. **user_profiles** - Extended user information
   - **Why needed**: Store user preferences, exam dates, etc.
   - **Critical**: MEDIUM - Can use auth.users initially

### 📊 Infrastructure Tables (Already Created)

- **migration_logs** - Tracks migration execution
- **migration_backups** - Stores backup data

## Table Relationships

```
auth.users (Supabase Auth)
    ├── user_profiles (1:1)
    ├── subject_combinations (1:many)
    ├── quiz_attempts (1:many)
    ├── user_progress (1:many)
    ├── user_subscriptions (1:many)
    ├── payments (1:many)
    ├── notifications (1:many)
    ├── study_targets (1:many)
    └── mock_exam_sessions (1:many)

subjects
    ├── topics (1:many)
    ├── study_materials (1:many)
    └── subscription_plans.included_subjects (many:many via array)

topics
    └── questions (1:many)

subscription_plans
    └── user_subscriptions (1:many)

user_subscriptions
    └── payments (1:many)

study_materials
    └── user_progress (1:many)
```

## What You Need to Do

### Step 1: Run the Missing Tables Migration
```bash
# Apply the migration to create missing tables
supabase db push --file supabase/migrations/20250101000005_create_missing_core_tables.sql
```

Or manually in Supabase SQL Editor:
1. Go to your Supabase dashboard
2. Open SQL Editor
3. Copy and paste the contents of `20250101000005_create_missing_core_tables.sql`
4. Execute

### Step 2: Verify All Tables Exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    -- Core content tables
    'subjects', 'topics', 'questions',
    -- Feature tables
    'subject_combinations', 'study_materials', 'notifications', 
    'study_targets', 'mock_exam_sessions',
    -- New critical tables
    'quiz_attempts', 'user_progress', 
    'subscription_plans', 'user_subscriptions', 'payments',
    'coupon_codes', 'user_profiles'
  )
ORDER BY table_name;
```

Expected result: **15 tables**

### Step 3: Seed Initial Data

After creating tables, you'll need to:

1. **Seed subjects** (migration 20250101000004)
   - 21 JAMB/WAEC subjects

2. **Seed subscription plans** (you'll need to create this)
   - JAMB Only plan
   - WAEC Only plan
   - Science Bundle
   - Commercial Bundle
   - Arts Bundle
   - Full Access plan

## Summary

**Current Status**: 8/15 tables (53%)
**Missing**: 7 critical tables for quiz tracking, subscriptions, and payments

**Action Required**: Run migration `20250101000005_create_missing_core_tables.sql` to complete your database setup.

Without these tables, the following features won't work:
- ❌ Quiz result tracking
- ❌ Analytics dashboard
- ❌ Leaderboard
- ❌ Study material progress
- ❌ Subscription management
- ❌ Payment processing
- ❌ Premium content access control
