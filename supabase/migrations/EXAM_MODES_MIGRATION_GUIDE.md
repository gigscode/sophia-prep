# Exam Modes System Migration Guide

This guide explains how to apply the exam modes system database migration.

## Migration File

**File**: `supabase/migrations/20250201_add_exam_modes_system.sql`

## What This Migration Does

1. Creates `timer_configurations` table for storing exam timer durations
2. Inserts default timer configurations for JAMB (35 min) and WAEC (60 min)
3. Adds `exam_type` column to `quiz_attempts` table
4. Creates indexes for performance
5. Sets up Row Level Security (RLS) policies

## How to Apply

### Option 1: Supabase Dashboard (Recommended)

1. Open your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/20250201_add_exam_modes_system.sql`
5. Paste into the SQL Editor
6. Click **Run** or press `Ctrl+Enter`
7. Verify success message

### Option 2: Supabase CLI

If you have the Supabase CLI installed:

```bash
supabase db push --file supabase/migrations/20250201_add_exam_modes_system.sql
```

### Option 3: Direct Database Connection

If you have direct database access:

```bash
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/20250201_add_exam_modes_system.sql
```

## Verification

After running the migration, verify it was successful:

### Check Timer Configurations Table

Run this query in SQL Editor:

```sql
SELECT * FROM timer_configurations;
```

Expected result: 2 rows (JAMB and WAEC defaults)

### Check Quiz Attempts Table

Run this query:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'quiz_attempts' 
  AND column_name IN ('exam_type', 'exam_year');
```

Expected result: Both columns should exist

## Default Timer Configurations

After migration, these default configurations will be available:

| Exam Type | Subject | Year | Duration (seconds) | Duration (minutes) |
|-----------|---------|------|-------------------|-------------------|
| JAMB      | NULL    | NULL | 2100              | 35                |
| WAEC      | NULL    | NULL | 3600              | 60                |

## Rollback

If you need to rollback this migration:

```sql
-- Drop timer configurations table
DROP TABLE IF EXISTS timer_configurations CASCADE;

-- Remove exam_type column from quiz_attempts
ALTER TABLE quiz_attempts DROP COLUMN IF EXISTS exam_type;
```

## Next Steps

After applying the migration:

1. Verify the timer service works: `npm test -- src/services/timer-service.test.ts --run`
2. Continue with task 2: Create unified quiz configuration types
3. Test timer configuration lookup in your application

## Troubleshooting

### Error: "relation timer_configurations already exists"

The table already exists. You can skip this migration or drop the table first:

```sql
DROP TABLE IF EXISTS timer_configurations CASCADE;
```

Then re-run the migration.

### Error: "column exam_type already exists"

The column already exists in quiz_attempts. This is fine - the migration uses `ADD COLUMN IF NOT EXISTS`.

### Error: Permission denied

Make sure you're using a database user with sufficient privileges (typically the postgres user or service role).

## Support

If you encounter issues:

1. Check the Supabase dashboard logs
2. Verify your database connection
3. Ensure you have the correct permissions
4. Review the migration file for syntax errors
