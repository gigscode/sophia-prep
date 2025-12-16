# Import Questions from JSON Files to Database

This guide explains how to import all hardcoded questions from JSON files into your Supabase database.

## 📋 Overview

Your application has questions stored in JSON files that need to be imported into the database:

### Data Files to Import:
1. **`data/jamb-questions.json`** - ~50+ JAMB questions (Mathematics, English, Physics, etc.)
2. **`data/expanded-mathematics-questions.json`** - 25 mathematics questions
3. **`data/expanded-english-questions.json`** - 24 English questions
4. **`data/expanded-science-questions.json`** - 26 science questions (Physics, Chemistry, Biology)
5. **`data/extra-quizzes.json`** - Additional quiz questions

**Total:** ~150+ questions to import

---

## 🚀 Import Methods

### Method 1: SQL Migration (Quick Start - Sample Questions)

Run the SQL migration to import a **sample set of questions** (15-20 questions):

```sql
-- Run in Supabase SQL Editor:
-- File: supabase/migrations/20251216_step4_import_sample_questions.sql
```

**Pros:**
- ✅ Quick and easy
- ✅ No Node.js required
- ✅ Good for testing

**Cons:**
- ⚠️ Only imports ~15 sample questions
- ⚠️ Doesn't import all JSON files

---

### Method 2: Node.js Script (Full Import - Recommended)

Run the Node.js script to import **ALL questions** from all JSON files:

```bash
# From project root:
node scripts/import-all-json-questions.js
```

**Pros:**
- ✅ Imports ALL questions from all JSON files
- ✅ Handles duplicate detection
- ✅ Shows progress and detailed stats
- ✅ Maps topics automatically

**Cons:**
- ⚠️ Requires Node.js environment
- ⚠️ May hit RLS policies (use service role key if needed)

---

## 📝 Step-by-Step Instructions

### Prerequisites

Before importing questions, make sure you've run the topic sync migrations:

1. ✅ `20251216_step1_add_slug_to_topics.sql` - Adds slug column
2. ✅ `20251216_step2_generate_slugs_for_existing_topics.sql` - Generates slugs
3. ✅ `20251216_step3_sync_topics_from_md.sql` - Syncs all topics

### Option A: Quick Start (Sample Questions via SQL)

1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the contents of:
   ```
   supabase/migrations/20251216_step4_import_sample_questions.sql
   ```
3. Click "Run"
4. Verify results:
   ```sql
   SELECT s.name, COUNT(q.id) as questions
   FROM subjects s
   LEFT JOIN questions q ON s.id = q.subject_id
   GROUP BY s.name
   ORDER BY s.name;
   ```

### Option B: Full Import (All Questions via Node.js)

1. Make sure you're in the project root:
   ```bash
   cd /home/tizzleshop-dev/Documents/Github-Projects/sophia_now/sophia-prep
   ```

2. Run the import script:
   ```bash
   node scripts/import-all-json-questions.js
   ```

3. Watch the progress:
   ```
   🚀 Starting question import from JSON files...

   📄 Importing from: data/jamb-questions.json
     📚 Processing mathematics (10 questions)...
     ..........
     ✅ Imported: 10
     ⏭️  Skipped: 0
     ❌ Failed: 0
   
   ...
   
   ============================================================
   📊 Import Summary:
     Total Questions Processed: 150
     ✅ Successfully Imported: 145
     ⏭️  Skipped (already exist): 5
     ❌ Failed: 0
   ============================================================
   ```

4. Verify in database:
   ```sql
   SELECT 
     s.name as subject,
     COUNT(q.id) as question_count
   FROM subjects s
   LEFT JOIN questions q ON s.id = q.subject_id
   GROUP BY s.name
   ORDER BY question_count DESC;
   ```

---

## 🔍 Verification Queries

After importing, run these queries to verify:

### 1. Count questions by subject
```sql
SELECT 
  s.name as subject,
  COUNT(q.id) as total_questions,
  COUNT(CASE WHEN q.topic_id IS NOT NULL THEN 1 END) as with_topic,
  COUNT(CASE WHEN q.topic_id IS NULL THEN 1 END) as without_topic
FROM subjects s
LEFT JOIN questions q ON s.id = q.subject_id
WHERE s.is_active = true
GROUP BY s.name
ORDER BY total_questions DESC;
```

### 2. Check for questions without subject or topic
```sql
SELECT COUNT(*) as orphaned_questions
FROM questions
WHERE subject_id IS NULL AND topic_id IS NULL;
-- Expected: 0
```

### 3. View sample questions
```sql
SELECT 
  s.name as subject,
  t.name as topic,
  LEFT(q.question_text, 60) as question,
  q.exam_year,
  q.exam_type
FROM questions q
JOIN subjects s ON q.subject_id = s.id
LEFT JOIN topics t ON q.topic_id = t.id
WHERE q.is_active = true
ORDER BY s.name, t.name
LIMIT 20;
```

---

## 🧹 Cleanup Hardcoded Data

After successful import, you can safely:

### 1. Keep These Files (For Reference/Backup):
- `data/*.json` - Original question data (keep as backup)
- `scripts/import-all-json-questions.js` - Import script (for future use)

### 2. Remove These (Optional):
- `src/components/QuickQuestionUploader.tsx` - Only used for testing
- Test files with mock data (they're for unit tests, safe to keep)

---

## ⚠️ Troubleshooting

### Issue: "Subject not found"
**Solution:** Make sure subjects exist in database. Run:
```sql
SELECT slug, name FROM subjects WHERE is_active = true;
```

### Issue: "Topic not found" (questions imported without topic_id)
**Solution:** This is OK! Questions can have just `subject_id`. Topics are optional.

### Issue: "RLS policy violation"
**Solution:** The script uses the anon key. If you hit RLS issues, you may need to:
1. Temporarily disable RLS on questions table, OR
2. Use a service role key in the script, OR
3. Run the SQL migration instead (Method 1)

### Issue: "Question already exists"
**Solution:** The script detects duplicates by `question_text`. This is expected and safe.

---

## 📊 Expected Results

After full import, you should have approximately:

- **Mathematics:** 35-40 questions
- **English:** 25-30 questions
- **Physics:** 20-25 questions
- **Chemistry:** 10-15 questions
- **Biology:** 10-15 questions
- **Economics:** 5-10 questions
- **Other subjects:** 5-10 questions

**Total:** ~150+ questions

---

## 🎯 Next Steps

After importing questions:

1. ✅ Test Practice Mode (`/practice`)
2. ✅ Test CBT Quiz Mode (`/jamb-exam`)
3. ✅ Verify questions appear correctly
4. ✅ Check that topic filtering works
5. ✅ Test the Admin Dashboard question management

---

## 📞 Need Help?

If you encounter issues:
1. Check the verification queries above
2. Review the migration logs
3. Check Supabase logs for errors
4. Verify RLS policies allow question insertion

