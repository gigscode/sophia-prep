# Migration Execution Guide

## Task 8: Run Database Migration

This guide provides step-by-step instructions for executing the database migration to add `subject_id` column to the questions table.

## Prerequisites

- Access to Supabase Dashboard
- Service role key configured in `.env.local`
- Migration file: `supabase/migrations/20251208_add_subject_id_to_questions.sql`

## Current Status

✅ Migration file created and ready
✅ Backfill script created and ready
❌ Migration NOT yet applied to database

## Execution Steps

### Step 1: Execute Migration SQL

**Option A: Supabase Dashboard (Recommended)**

1. Open Supabase Dashboard: https://app.supabase.com
2. Select your project: `rnxkkmdnmwhxdaofwtrf`
3. Navigate to: **SQL Editor** (left sidebar)
4. Click: **New Query**
5. Open the migration file: `supabase/migrations/20251208_add_subject_id_to_questions.sql`
6. Copy the ENTIRE contents of the file
7. Paste into the SQL Editor
8. Click: **Run** (or press Ctrl+Enter)
9. Wait for execution to complete
10. Verify: Check for any error messages in the output

**Option B: Using psql (if you have PostgreSQL client)**

```bash
# Get connection string from Supabase Dashboard > Project Settings > Database
psql "postgresql://postgres:[YOUR-PASSWORD]@db.rnxkkmdnmwhxdaofwtrf.supabase.co:5432/postgres" -f supabase/migrations/20251208_add_subject_id_to_questions.sql
```

### Step 2: Verify Schema Changes

After executing the migration, run the verification script:

```bash
node scripts/check-migration-status.js
```

Expected output:
- ✅ Migration appears to be applied: subject_id column exists
- Statistics showing questions with/without subject_id

### Step 3: Run Backfill Script

Execute the backfill script to populate subject_id for existing questions:

```bash
node scripts/backfill-question-subject-ids.js
```

This script will:
- Fetch all questions without subject_id
- Look up subject_id from their associated topics
- Update questions with the correct subject_id
- Log any orphaned questions that need manual review
- Verify backfill correctness

Expected output:
- Number of questions updated
- Any orphaned questions requiring manual review
- Verification results

### Step 4: Verify Data Integrity

Run the verification script again to confirm everything is correct:

```bash
node scripts/check-migration-status.js
```

Expected results:
- All questions should have either subject_id or topic_id (or both)
- No questions with both fields NULL
- Backfill percentage should be high (ideally 100%)

## Migration Details

The migration performs these operations:

1. **Add subject_id column** (nullable, references subjects table)
2. **Create index** on subject_id for query performance
3. **Backfill subject_id** from existing topic relationships
4. **Make topic_id nullable** (was previously NOT NULL)
5. **Update foreign key** constraint to ON DELETE SET NULL
6. **Add check constraint** to ensure either subject_id or topic_id is provided

## Verification Queries

You can run these queries in Supabase SQL Editor to verify:

```sql
-- Check that all questions have either subject_id or topic_id
SELECT COUNT(*) FROM questions 
WHERE subject_id IS NULL AND topic_id IS NULL;
-- Expected: 0

-- Check backfill correctness
SELECT COUNT(*) FROM questions q
JOIN topics t ON q.topic_id = t.id
WHERE q.subject_id != t.subject_id;
-- Expected: 0

-- Verify index exists
SELECT indexname FROM pg_indexes 
WHERE tablename = 'questions' AND indexname = 'idx_questions_subject_id';
-- Expected: 1 row

-- Check constraint exists
SELECT conname FROM pg_constraint 
WHERE conname = 'questions_subject_or_topic_check';
-- Expected: 1 row
```

## Rollback (if needed)

If you need to rollback the migration:

```sql
-- Remove check constraint
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_subject_or_topic_check;

-- Make topic_id NOT NULL again
ALTER TABLE questions ALTER COLUMN topic_id SET NOT NULL;

-- Drop subject_id column
ALTER TABLE questions DROP COLUMN IF EXISTS subject_id;

-- Drop index
DROP INDEX IF EXISTS idx_questions_subject_id;
```

## Troubleshooting

### Error: "column already exists"
- This means the migration was partially applied
- Check which steps completed successfully
- Skip completed steps and continue with remaining ones

### Error: "violates check constraint"
- Some questions have both subject_id and topic_id as NULL
- Identify these questions: `SELECT * FROM questions WHERE subject_id IS NULL AND topic_id IS NULL;`
- Manually assign subject_id to these questions

### Orphaned Questions
- Questions with invalid topic_id references
- The backfill script will log these
- Manually assign subject_id via admin interface or SQL

## Next Steps

After successful migration:
1. ✅ Mark task 8 as complete
2. Move to task 9: Checkpoint - Ensure all tests pass
3. Verify UnifiedQuiz component works with new schema
4. Test quiz flows end-to-end

## Requirements Validated

This migration satisfies:
- Requirement 2.1: topic_id is nullable
- Requirement 2.2: Backward compatibility maintained
- Requirement 4.1: subject_id column added
- Requirement 4.2: Backfill from topic relationships
