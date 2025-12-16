# SQL Scripts to Run - Complete Setup Guide

This document contains all the SQL scripts you need to run in order to set up your database with topics and questions.

---

## 📋 Overview

You need to run **4 SQL migrations** in order:

1. **Step 1:** Add slug column to topics table
2. **Step 2:** Generate slugs for existing topics
3. **Step 3:** Sync all topics from topics.md (188 topics)
4. **Step 4:** Import sample questions (optional - or use Node.js script for full import)

---

## 🚀 How to Run

### Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **"New Query"**
4. Copy and paste each script below (one at a time)
5. Click **"Run"** or press `Ctrl+Enter`
6. Wait for success message
7. Move to next script

### Via Supabase CLI

```bash
cd /home/tizzleshop-dev/Documents/Github-Projects/sophia_now/sophia-prep
supabase db push
```

---

## 📝 Scripts to Run (In Order)

### ✅ Step 1: Add Slug Column to Topics

**File:** `supabase/migrations/20251216_step1_add_slug_to_topics.sql`

```sql
-- Step 1: Add slug column to topics table
-- Date: 2025-12-16
-- Description: Add slug column for URL-friendly topic identifiers

-- Add slug column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'topics' 
        AND column_name = 'slug'
    ) THEN
        ALTER TABLE topics ADD COLUMN slug TEXT;
        RAISE NOTICE 'Added slug column to topics table';
    ELSE
        RAISE NOTICE 'slug column already exists in topics table';
    END IF;
END $$;

-- Create unique index on subject_id + slug combination
CREATE UNIQUE INDEX IF NOT EXISTS idx_topics_subject_slug 
ON topics(subject_id, slug);

-- Add comment
COMMENT ON COLUMN topics.slug IS 'URL-friendly identifier for the topic';
```

**Expected Output:** `Added slug column to topics table` or `slug column already exists`

---

### ✅ Step 2: Generate Slugs for Existing Topics

**File:** `supabase/migrations/20251216_step2_generate_slugs_for_existing_topics.sql`

```sql
-- Step 2: Generate slugs for any existing topics
-- Date: 2025-12-16
-- Description: Auto-generate slugs for topics that don't have them

-- Update existing topics to have slugs based on their names
UPDATE topics
SET slug = LOWER(
    REGEXP_REPLACE(
        REGEXP_REPLACE(name, '[^a-zA-Z0-9\s-]', '', 'g'),
        '\s+',
        '-',
        'g'
    )
)
WHERE slug IS NULL OR slug = '';

-- Verify the update
SELECT 
    COUNT(*) as total_topics,
    COUNT(slug) as topics_with_slug,
    COUNT(*) - COUNT(slug) as topics_without_slug
FROM topics;
```

**Expected Output:** Shows count of topics with slugs

---

### ✅ Step 3: Sync All Topics from topics.md

**File:** `supabase/migrations/20251216_sync_topics_from_md.sql`

**Note:** This file is large (300+ lines). You can find it at:
```
supabase/migrations/20251216_sync_topics_from_md.sql
```

**What it does:**
- Inserts **188 topics** across 7 subjects:
  - Mathematics: 24 topics
  - Physics: 37 topics
  - English: 21 topics
  - Christian Religious Studies: 36 topics
  - Economics: 23 topics
  - Geography: 31 topics
  - Commerce: 16 topics

**Expected Output:** 
```
subject          | topic_count
-----------------+-------------
Christian Religious Studies | 36
Commerce         | 16
Economics        | 23
English          | 21
Geography        | 31
Mathematics      | 24
Physics          | 37
```

---

### ✅ Step 4: Import Sample Questions (Optional)

**File:** `supabase/migrations/20251216_step4_import_sample_questions.sql`

**Note:** This imports only ~15 sample questions for testing.

**For full import of 150+ questions**, use the Node.js script instead:
```bash
node scripts/import-all-json-questions.js
```

**What it does:**
- Imports sample questions for Mathematics, English, Physics, Economics
- Creates helper functions to map subjects and topics
- Shows verification queries

**Expected Output:**
```
subject    | question_count
-----------+---------------
Economics  | 1
English    | 3
Mathematics| 6
Physics    | 3
```

---

## 🔍 Verification Queries

After running all scripts, verify your setup:

### 1. Check Topics

```sql
SELECT 
  s.name as subject,
  COUNT(t.id) as topic_count
FROM subjects s
LEFT JOIN topics t ON s.id = t.subject_id
WHERE s.slug IN ('mathematics', 'physics', 'english', 'crs', 'economics', 'geography', 'commerce')
GROUP BY s.name
ORDER BY s.name;
```

**Expected:** 7 subjects with topic counts matching Step 3 output

### 2. Check Questions

```sql
SELECT 
  s.name as subject,
  COUNT(q.id) as question_count
FROM subjects s
LEFT JOIN questions q ON s.id = q.subject_id
WHERE s.is_active = true
GROUP BY s.name
ORDER BY question_count DESC;
```

**Expected:** Questions distributed across subjects (15+ if using sample, 150+ if using full import)

### 3. Check for Orphaned Data

```sql
-- Topics without slugs
SELECT COUNT(*) FROM topics WHERE slug IS NULL OR slug = '';
-- Expected: 0

-- Questions without subject or topic
SELECT COUNT(*) FROM questions WHERE subject_id IS NULL AND topic_id IS NULL;
-- Expected: 0
```

---

## ⚠️ Troubleshooting

### Error: "relation topics does not exist"
**Solution:** Make sure you've run the base schema migrations first

### Error: "duplicate key value violates unique constraint"
**Solution:** Topics already exist - this is safe, the migration uses `ON CONFLICT DO NOTHING`

### Error: "subject not found"
**Solution:** Make sure subjects are seeded. Run:
```sql
SELECT slug, name FROM subjects WHERE is_active = true;
```

---

## 📊 Summary

After running all 4 steps, you will have:

✅ **188 topics** synced from topics.md  
✅ **Slug column** added to topics table  
✅ **Sample questions** imported (or 150+ with Node.js script)  
✅ **Database ready** for production use

---

## 🎯 Next Steps

1. ✅ Run all 4 SQL scripts in order
2. ✅ Run verification queries
3. ✅ (Optional) Run Node.js script for full question import
4. ✅ Test the frontend:
   - Practice Mode: `/practice`
   - CBT Quiz: `/jamb-exam`
   - Admin Dashboard: `/admin`

---

## 📞 Need Help?

- See `IMPORT_QUESTIONS_README.md` for detailed question import guide
- See `data/README.md` for information about JSON data files
- Check Supabase logs for detailed error messages

