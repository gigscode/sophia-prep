# Step-by-Step Migration Execution

## Issue Encountered
The original migration failed with: `ERROR: 42P01: relation "subjects" does not exist`

This is likely due to:
1. Schema permissions in Supabase
2. The way foreign key constraints are handled
3. Timing of constraint creation

## Solution: Execute in Safe Steps

### Step 1: Add Column Only (SAFE)

Execute this in Supabase Dashboard SQL Editor:

```sql
-- Add the column (nullable, no constraints)
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS subject_id UUID;

-- Verify the column was added
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'questions' 
  AND column_name = 'subject_id';
```

**Expected Result**: One row showing subject_id column exists

### Step 2: Verify Column Added

Run this to confirm:
```bash
node scripts/check-migration-status.js
```

**Expected**: ✅ Migration appears to be applied: subject_id column exists

### Step 3: Backfill Data

Run the backfill script:
```bash
node scripts/backfill-question-subject-ids.js
```

This will populate subject_id from topic relationships.

### Step 4: Add Constraints (After Backfill)

Once data is populated, add constraints:

```sql
-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_questions_subject_id ON questions(subject_id);

-- Add foreign key constraint
ALTER TABLE questions
ADD CONSTRAINT questions_subject_id_fkey 
  FOREIGN KEY (subject_id) 
  REFERENCES subjects(id) 
  ON DELETE SET NULL;

-- Make topic_id nullable
ALTER TABLE questions 
ALTER COLUMN topic_id DROP NOT NULL;

-- Update topic_id foreign key
ALTER TABLE questions
DROP CONSTRAINT IF EXISTS questions_topic_id_fkey;

ALTER TABLE questions
ADD CONSTRAINT questions_topic_id_fkey 
  FOREIGN KEY (topic_id) 
  REFERENCES topics(id) 
  ON DELETE SET NULL;

-- Add check constraint
ALTER TABLE questions
ADD CONSTRAINT questions_subject_or_topic_check
CHECK (subject_id IS NOT NULL OR topic_id IS NOT NULL);
```

## Quick Execution

**Right now, execute this in Supabase Dashboard:**

1. Go to: https://app.supabase.com
2. Select project: rnxkkmdnmwhxdaofwtrf
3. SQL Editor → New Query
4. Copy and paste:

```sql
ALTER TABLE questions 
ADD COLUMN IF NOT EXISTS subject_id UUID;
```

5. Click Run
6. Verify success message

Then run:
```bash
node scripts/check-migration-status.js
```

If successful, we'll proceed with backfill and constraints.