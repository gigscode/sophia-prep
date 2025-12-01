# Exam Modes System - Database Migration Guide

## Overview
This migration adds database support for the unified exam modes system, including timer configurations and enhanced quiz attempt tracking.

## What's Included

### 1. Timer Configurations Table
- Stores exam durations for different exam types, subjects, and years
- Allows flexible configuration without code changes
- Includes default durations for JAMB (35 min) and WAEC (60 min)

### 2. Enhanced Quiz Attempts Table
- Adds `quiz_mode` column to track quiz type
- Adds `exam_type` column for JAMB/WAEC tracking
- Adds `exam_year` column for year-based quizzes
- Includes indexes for better query performance

### 3. Security & Permissions
- Row Level Security (RLS) enabled
- Authenticated users can read timer configurations
- Only admins can modify timer configurations
- Proper grants for quiz attempts

## How to Apply

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the contents of `exam_modes_system.sql`
5. Paste into the editor
6. Click **Run** to execute

### Option 2: Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db push
```

### Option 3: Manual SQL Execution
```bash
# Connect to your database and run
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/exam_modes_system.sql
```

## Verification

After running the migration, verify it was successful:

```sql
-- Check if timer_configurations table exists
SELECT * FROM timer_configurations;

-- Should return 2 default rows (JAMB and WAEC)

-- Check if quiz_attempts columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'quiz_attempts' 
AND column_name IN ('quiz_mode', 'exam_type', 'exam_year');

-- Should return 3 rows
```

## Default Timer Configurations

The migration creates these default configurations:

| Exam Type | Subject | Year | Duration (seconds) | Duration (minutes) |
|-----------|---------|------|-------------------|-------------------|
| JAMB      | NULL    | NULL | 2100              | 35 minutes        |
| WAEC      | NULL    | NULL | 3600              | 60 minutes        |

## Adding Custom Timer Configurations

You can add subject-specific or year-specific durations:

```sql
-- Example: Set 45 minutes for JAMB Mathematics
INSERT INTO timer_configurations (exam_type, subject_slug, year, duration_seconds)
VALUES ('JAMB', 'mathematics', NULL, 2700);

-- Example: Set 50 minutes for WAEC 2024 English
INSERT INTO timer_configurations (exam_type, subject_slug, year, duration_seconds)
VALUES ('WAEC', 'english', 2024, 3000);
```

## Timer Configuration Lookup Priority

The system looks up timer configurations in this order:
1. **Most specific**: exam_type + subject + year
2. **Subject-specific**: exam_type + subject
3. **Year-specific**: exam_type + year
4. **Default**: exam_type only

## Quiz Mode Values

The `quiz_mode` column accepts these values:
- `practice` - General practice mode
- `exam` - General exam simulation
- `practice-subject` - Practice mode with subject selection
- `practice-year` - Practice mode with year selection
- `exam-subject` - Exam simulation with subject selection
- `exam-year` - Exam simulation with year selection
- `cbt` - Legacy CBT mode (deprecated)

## Rollback (If Needed)

If you need to rollback this migration:

```sql
-- Drop timer configurations table
DROP TABLE IF EXISTS timer_configurations CASCADE;

-- Remove columns from quiz_attempts
ALTER TABLE quiz_attempts DROP COLUMN IF EXISTS quiz_mode;
ALTER TABLE quiz_attempts DROP COLUMN IF EXISTS exam_type;
ALTER TABLE quiz_attempts DROP COLUMN IF EXISTS exam_year;

-- Drop indexes
DROP INDEX IF EXISTS idx_timer_configurations_lookup;
DROP INDEX IF EXISTS idx_quiz_attempts_mode;
DROP INDEX IF EXISTS idx_quiz_attempts_user_completed;
```

## Troubleshooting

### Issue: "relation already exists"
**Solution**: The table already exists. You can skip the CREATE TABLE statement or use `CREATE TABLE IF NOT EXISTS`.

### Issue: "column already exists"
**Solution**: The columns were already added. The migration uses `ADD COLUMN IF NOT EXISTS` to handle this.

### Issue: "permission denied"
**Solution**: Ensure you're running the migration with proper database permissions (postgres role or equivalent).

### Issue: RLS policies conflict
**Solution**: Check existing policies with:
```sql
SELECT * FROM pg_policies WHERE tablename = 'timer_configurations';
```
Drop conflicting policies if needed.

## Support

For issues or questions:
1. Check the implementation summary: `.kiro/specs/exam-modes-system/IMPLEMENTATION_SUMMARY.md`
2. Review the design document: `.kiro/specs/exam-modes-system/design.md`
3. Check Supabase logs in the dashboard

## Next Steps After Migration

1. ✅ Verify tables were created
2. ✅ Test timer configuration lookups in the app
3. ✅ Create a test quiz attempt with new fields
4. ✅ Verify analytics tracking works correctly
5. ✅ Add any custom timer configurations for specific subjects/years
