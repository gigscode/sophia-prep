# Task 8: Database Migration - Troubleshooting Guide

## Error Encountered

You received this error when running the migration:
```
Error: Failed to run sql query: ERROR: 42P01: relation "subjects" does not exist
```

## Diagnosis

I've run diagnostics and confirmed:
- ✅ The `subjects` table DOES exist in your database
- ✅ The `questions` table exists and is accessible
- ✅ The `topics` table exists with valid `subject_id` references
- ✅ All tables are in the `public` schema

The error is likely due to:
1. **Schema search path issue** in the SQL Editor context
2. **RLS (Row Level Security)** policies interfering with DDL operations
3. **Migration context** running with restricted permissions

## Solution: Step-by-Step Migration

Instead of running the entire migration at once, let's break it into smaller, safer steps.

### 🎯 STEP 1: Add Column Only (Safest)

**Run this SQL first:**

```sql
-- Just add the column, no constraints
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS subject_id UUID;

-- Verify it was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'questions' AND column_name = 'subject_id';
```

**Expected output:** `subject_id | uuid | YES`

**If this fails:** The issue is with basic ALTER TABLE permissions. Check:
- Are you using the service_role key?
- Is RLS blocking DDL operations?

---

### 🎯 STEP 2: Create Index

**After Step 1 succeeds, run:**

```sql
-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON questions(subject_id);

-- Verify index was created
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'questions' AND indexname = 'idx_questions_subject_id';
```

**Expected output:** 1 row with `idx_questions_subject_id`

---

### 🎯 STEP 3: Backfill Data

**After Step 2 succeeds, run:**

```sql
-- Populate subject_id from topics
UPDATE questions q
SET subject_id = t.subject_id
FROM topics t
WHERE q.topic_id = t.id
  AND q.subject_id IS NULL;

-- Check how many were updated
SELECT 
  COUNT(*) FILTER (WHERE subject_id IS NOT NULL) as with_subject_id,
  COUNT(*) FILTER (WHERE subject_id IS NULL) as without_subject_id
FROM questions;
```

**Expected:** Most/all questions should now have `subject_id`

---

### 🎯 STEP 4: Add Foreign Key

**After Step 3 succeeds, run:**

```sql
-- Add foreign key constraint
ALTER TABLE questions
ADD CONSTRAINT questions_subject_id_fkey
  FOREIGN KEY (subject_id)
  REFERENCES subjects(id)
  ON DELETE SET NULL;

-- Verify constraint was added
SELECT conname 
FROM pg_constraint 
WHERE conname = 'questions_subject_id_fkey';
```

**Expected output:** 1 row with `questions_subject_id_fkey`

---

### 🎯 STEP 5: Make topic_id Nullable

**After Step 4 succeeds, run:**

```sql
-- Drop existing foreign key
ALTER TABLE questions
DROP CONSTRAINT IF EXISTS questions_topic_id_fkey;

-- Make column nullable
ALTER TABLE questions 
ALTER COLUMN topic_id DROP NOT NULL;

-- Re-add foreign key with ON DELETE SET NULL
ALTER TABLE questions
ADD CONSTRAINT questions_topic_id_fkey 
  FOREIGN KEY (topic_id) 
  REFERENCES topics(id) 
  ON DELETE SET NULL;
```

---

### 🎯 STEP 6: Add Check Constraint

**After Step 5 succeeds, run:**

```sql
-- Ensure every question has either subject_id or topic_id
ALTER TABLE questions
ADD CONSTRAINT questions_subject_or_topic_check
CHECK (subject_id IS NOT NULL OR topic_id IS NOT NULL);

-- Verify constraint was added
SELECT conname 
FROM pg_constraint 
WHERE conname = 'questions_subject_or_topic_check';
```

---

## Alternative: Use Pre-Made Step Files

I've created separate SQL files for each step:

1. **`supabase/migrations/20251208_step1_add_column_only.sql`**
   - Just adds the column, nothing else
   - Safest to run first

2. **`supabase/migrations/20251208_add_subject_id_step_by_step.sql`**
   - All steps in one file with clear separators
   - Run each section separately

## Verification After All Steps

After completing all steps, run these verification queries:

```sql
-- 1. Check column exists
SELECT column_name FROM information_schema.columns
WHERE table_name = 'questions' AND column_name = 'subject_id';

-- 2. Check all questions have either subject_id or topic_id
SELECT COUNT(*) as questions_with_neither
FROM questions 
WHERE subject_id IS NULL AND topic_id IS NULL;
-- Expected: 0

-- 3. Check backfill correctness
SELECT COUNT(*) as mismatched
FROM questions q
JOIN topics t ON q.topic_id = t.id
WHERE q.subject_id != t.subject_id;
-- Expected: 0

-- 4. Check topic_id is nullable
SELECT is_nullable FROM information_schema.columns
WHERE table_name = 'questions' AND column_name = 'topic_id';
-- Expected: YES

-- 5. Sample data
SELECT id, subject_id, topic_id 
FROM questions 
LIMIT 5;
```

## After Migration Success

Once all steps complete successfully, run:

```bash
# Verify migration status
node scripts/check-migration-status.js

# Run backfill script (if needed)
node scripts/backfill-question-subject-ids.js

# Final verification
node scripts/check-migration-status.js
```

## If You Still Get Errors

### Error: "permission denied"
- Make sure you're using the service_role key in Supabase Dashboard
- Check that you're logged in as the project owner

### Error: "constraint violation"
- Some questions might have both subject_id and topic_id as NULL
- Find them: `SELECT * FROM questions WHERE subject_id IS NULL AND topic_id IS NULL;`
- Manually assign subject_id before adding the check constraint

### Error: "relation does not exist" (still)
- Try adding schema prefix: `ALTER TABLE public.questions ...`
- Or try via Supabase CLI: `npx supabase db push`
- Or use direct psql connection

## Quick Start: Run Step 1 Now

**Copy and paste this into Supabase SQL Editor:**

```sql
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS subject_id UUID;

SELECT 'SUCCESS: subject_id column added' as status;
```

If this works, proceed to Step 2. If it fails, let me know the exact error message.

## Need Help?

Run the diagnostic script to get more information:

```bash
node scripts/diagnose-migration-error.js
```

This will check:
- Table accessibility
- Current schema
- Permissions
- Possible causes

---

**Ready to try Step 1?** Copy the SQL above and run it in Supabase Dashboard SQL Editor.
