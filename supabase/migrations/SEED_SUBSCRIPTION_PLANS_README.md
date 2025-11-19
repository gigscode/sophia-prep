# Seed Subscription Plans

This directory contains SQL scripts to seed the initial subscription plans for Sophia Prep.

## Files

1. **20250101000006_seed_subscription_plans.sql** - Migration file with subscription plans data
2. **seed_subscription_plans_direct.sql** - Direct SQL script that can be run in Supabase SQL Editor

## Subscription Plans

The following 6 subscription plans will be created:

### 1. JAMB Only (₦5,000/month)
- All JAMB subjects (16 subjects)
- Full access to practice questions, mock exams, past questions
- Video lessons and study materials

### 2. WAEC Only (₦5,000/month)
- All WAEC subjects (21 subjects)
- Full access to practice questions, mock exams, past questions
- Video lessons and study materials

### 3. Science Bundle (₦3,500/month)
- Science subjects: English, Mathematics, Physics, Chemistry, Biology, Further Mathematics, Geography, Food & Nutrition
- Suitable for both JAMB and WAEC Science students

### 4. Commercial Bundle (₦3,500/month)
- Commercial subjects: English, Mathematics, Commerce, Accounting, Economics, Marketing, Geography
- Suitable for both JAMB and WAEC Commercial students

### 5. Arts Bundle (₦3,500/month)
- Arts subjects: English, Literature, Government, CRS/IRS, Music, History, Geography, Nigerian Languages
- Suitable for both JAMB and WAEC Arts students

### 6. Full Access (₦7,500/month)
- All 21 subjects
- Both JAMB and WAEC
- Priority support

## How to Run

### Option 1: Via Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy and paste the contents of `seed_subscription_plans_direct.sql`
5. Click **Run** to execute

This method bypasses RLS and ensures the data is inserted correctly.

### Option 2: Via Migration (If using Supabase CLI locally)

If you're running Supabase locally:

```bash
# Start Supabase
npm run supabase:start

# Reset database (this will run all migrations including the subscription plans)
npm run supabase:reset
```

### Option 3: Via Node.js Script

If you have service role access:

```bash
# Add SUPABASE_SERVICE_ROLE_KEY to .env.local
# Then run:
node scripts/seed-subscription-plans.js
```

## Verification

After running the script, verify the plans were created:

```sql
SELECT 
  plan_id,
  name,
  exam_type,
  bundle_type,
  amount,
  currency,
  array_length(included_subjects, 1) as subject_count
FROM subscription_plans
ORDER BY sort_order;
```

Expected output: 6 rows with the plans listed above.

## Notes

- Plans use `plan_id` as unique identifier
- The script uses `ON CONFLICT` to handle re-runs safely
- All amounts are in Nigerian Naira (NGN)
- Plans are set to MONTHLY interval by default
- All plans are active (`is_active = TRUE`)

## Requirements Validated

This seeding satisfies:
- **Requirement 7.1**: Display plans including JAMB Only, WAEC Only, and subject bundles
- **Requirement 7.2**: Display pricing in Nigerian Naira with plan features and duration
