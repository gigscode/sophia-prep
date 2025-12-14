# Database Schema Analysis & Migration Plan

## 📊 Current Database State (Verified from `data/soprep-db.md`)

### Questions Table (215 rows)
**Current Columns:**
- `id` (uuid, pk)
- `question_text` (text)
- `option_a`, `option_b`, `option_c`, `option_d` (text)
- `correct_answer` (text, check A/B/C/D)
- `explanation` (text)
- `difficulty_level` (text, default 'MEDIUM')
- `exam_year` (int)
- `exam_type` (text, check)
- `question_number` (int)
- `is_active` (bool, default true)
- `created_at`, `updated_at` (timestamptz)
- `metadata` (jsonb, default '{}')

**❌ MISSING:** `subject_id` column

### Subjects Table (24 rows)
**Columns:**
- `id` (uuid, pk)
- `name`, `slug` (text)
- `description`, `icon`, `color_theme` (text)
- `exam_type` (text, default 'BOTH')
- `subject_category` (text, default 'GENERAL')
- `is_mandatory`, `is_active` (boolean)
- `sort_order` (integer)
- `created_at`, `updated_at` (timestamptz)

**Referenced by:** study_materials.subject_id, quiz_attempts.subject_id, exam_items.subject_id

---

## 🔍 Problem Analysis

### Why Questions Don't Display:

1. **Missing Column:** Questions table lacks `subject_id` column
2. **Query Dependency:** `question-service.ts` filters by `subject_id` (line 22)
3. **Result:** Query returns 0 questions even though 215 exist

### Comparison with Other Tables:

Other tables already have `subject_id` with foreign key constraints:
- ✅ `study_materials.subject_id` → `subjects.id`
- ✅ `quiz_attempts.subject_id` → `subjects.id`
- ✅ `exam_items.subject_id` → `subjects.id`
- ❌ `questions.subject_id` → **MISSING**

---

## 🛠️ Migration Solution

### What the Migration Does:

1. **Adds `subject_id` column** to questions table (UUID, nullable)
2. **Creates index** on `subject_id` for query performance
3. **Adds foreign key constraint** to ensure referential integrity
4. **Associates all questions** with Mathematics subject (based on question content analysis)
5. **Verifies** the migration completed successfully

### Migration File: `FIX_QUESTIONS_MIGRATION.sql`

**Features:**
- ✅ Pre-flight checks to verify current state
- ✅ Idempotent (safe to run multiple times)
- ✅ Adds foreign key constraint matching other tables
- ✅ Creates performance index
- ✅ Post-migration verification
- ✅ Detailed logging and error handling

---

## 📋 Migration Steps

### Step 1: Backup (Recommended)
Before running any migration, consider backing up your data:
```sql
-- In Supabase SQL Editor
SELECT * FROM questions;
-- Export results as CSV for backup
```

### Step 2: Run Migration
1. Open **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Copy entire contents of `FIX_QUESTIONS_MIGRATION.sql`
4. Paste into SQL Editor
5. Click **"Run"**

### Step 3: Verify Output
You should see output like:
```
NOTICE: === PRE-FLIGHT CHECK ===
NOTICE: Questions table has 215 rows
NOTICE: subject_id column exists: false

NOTICE: Foreign key constraint added successfully
NOTICE: Updated questions with Mathematics subject_id: <uuid>

total_questions | questions_with_subject | questions_without_subject
215            | 215                    | 0

NOTICE: === MIGRATION COMPLETE ===
NOTICE: Total questions: 215
NOTICE: Questions with subject_id: 215
NOTICE: Questions without subject_id: 0
NOTICE: Foreign key constraint exists: true
NOTICE: Index exists: true
NOTICE: ✅ SUCCESS! Migration completed successfully.
```

---

## 🧪 Post-Migration Testing

### Test 1: Verify Schema
```sql
-- Check column exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'questions' AND column_name = 'subject_id';

-- Expected: subject_id | uuid | YES
```

### Test 2: Verify Data
```sql
-- Check all questions have subject_id
SELECT 
    COUNT(*) as total,
    COUNT(subject_id) as with_subject,
    COUNT(*) - COUNT(subject_id) as without_subject
FROM questions;

-- Expected: total=215, with_subject=215, without_subject=0
```

### Test 3: Verify Foreign Key
```sql
-- Check foreign key constraint
SELECT constraint_name, table_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'questions' AND constraint_name = 'questions_subject_id_fkey';

-- Expected: 1 row showing FOREIGN KEY constraint
```

### Test 4: Test Application
1. Navigate to `/quiz` in your app
2. Select Practice Mode → JAMB → Subject → Mathematics
3. Click "Start Quiz"
4. **Expected:** Questions should load and display

---

## 🔄 Rollback Plan (If Needed)

If something goes wrong, you can rollback:

```sql
-- Remove foreign key constraint
ALTER TABLE questions DROP CONSTRAINT IF EXISTS questions_subject_id_fkey;

-- Remove index
DROP INDEX IF EXISTS idx_questions_subject_id;

-- Remove column
ALTER TABLE questions DROP COLUMN IF EXISTS subject_id;
```

**Note:** Only rollback if absolutely necessary. The migration is designed to be safe.

---

## 📈 Performance Impact

### Before Migration:
- Query: `SELECT * FROM questions WHERE subject_id = ?`
- Result: **ERROR** (column doesn't exist)
- Fallback: Query all questions, filter in application
- Performance: **Slow** (loads all 215 questions)

### After Migration:
- Query: `SELECT * FROM questions WHERE subject_id = ?`
- Result: **SUCCESS** (uses index)
- Performance: **Fast** (indexed lookup)
- Scalability: **Excellent** (will scale to thousands of questions)

---

## 🎯 Next Steps After Migration

### Immediate:
1. ✅ Run migration
2. ✅ Verify output
3. ✅ Test quiz interface
4. ✅ Monitor for errors

### Short-term:
1. **Review Question Categorization**
   - Currently all questions → Mathematics
   - Verify this is correct
   - Recategorize if needed

2. **Update Import Scripts**
   - Ensure new questions include `subject_id`
   - Add validation to prevent null `subject_id`

### Long-term:
1. **Add More Subjects**
   - Import questions for other subjects
   - Properly categorize by subject

2. **Consider Topics**
   - Add topics within subjects
   - Associate questions with topics
   - Enable topic-based practice

---

## ✅ Success Criteria

Migration is successful when:
- ✅ `subject_id` column exists in questions table
- ✅ Foreign key constraint is in place
- ✅ Index is created
- ✅ All 215 questions have `subject_id` populated
- ✅ Questions display in quiz interface
- ✅ No console errors in application

---

**Status:** Ready to run
**Risk Level:** Low (idempotent, includes rollback plan)
**Estimated Time:** < 1 minute
**Downtime Required:** None (migration is non-blocking)

