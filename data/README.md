# Data Directory - Question Import Files

This directory contains JSON files with questions that should be imported into the Supabase database.

## 📁 Files Overview

### ✅ Files to Import (Active)

These files contain questions that should be imported into the database:

1. **`jamb-questions.json`** (~50+ questions)
   - **Subjects:** Mathematics, English, Physics, Chemistry, Biology
   - **Format:** `{ "subject": [ {question_object} ] }`
   - **Status:** ✅ Ready to import
   - **Notes:** Contains JAMB and WAEC questions with exam metadata

2. **`expanded-mathematics-questions.json`** (25 questions)
   - **Subjects:** Mathematics only
   - **Format:** `{ "mathematics": [ {question_object} ] }`
   - **Status:** ✅ Ready to import
   - **Notes:** Expanded set of mathematics questions with detailed explanations

3. **`expanded-english-questions.json`** (24 questions)
   - **Subjects:** English only
   - **Format:** `{ "english": [ {question_object} ] }`
   - **Status:** ✅ Ready to import
   - **Notes:** Vocabulary, grammar, and comprehension questions

4. **`expanded-science-questions.json`** (26 questions)
   - **Subjects:** Physics, Chemistry, Biology
   - **Format:** `{ "physics": [...], "chemistry": [...], "biology": [...] }`
   - **Status:** ✅ Ready to import
   - **Notes:** Science questions across multiple subjects

5. **`extra-quizzes.json`** (~10 questions)
   - **Subjects:** Mixed (English, Mathematics, Physics, Economics)
   - **Format:** `[ {question_object_with_subject_field} ]`
   - **Status:** ✅ Ready to import
   - **Notes:** Additional quiz questions in array format

### 📋 Reference Files (Keep)

6. **`subjects.json`**
   - **Purpose:** Reference data for subjects
   - **Status:** 📋 Reference only (subjects are seeded via SQL)
   - **Notes:** Keep for reference, not for import

7. **`soprep-db.md`**
   - **Purpose:** Database documentation
   - **Status:** 📋 Documentation
   - **Notes:** Keep for reference

---

## 🚀 How to Import

### Option 1: Full Import (Recommended)

Use the Node.js script to import ALL questions from all JSON files:

```bash
node scripts/import-all-json-questions.js
```

This will import approximately **150+ questions** from all 5 question files.

### Option 2: Sample Import (Quick Test)

Use the SQL migration to import a small sample (~15 questions):

```sql
-- Run in Supabase SQL Editor:
-- File: supabase/migrations/20251216_step4_import_sample_questions.sql
```

---

## 📊 Question Format

All question files follow this structure:

```json
{
  "question_text": "What is 2 + 2?",
  "option_a": "2",
  "option_b": "3",
  "option_c": "4",
  "option_d": "5",
  "correct_answer": "C",
  "explanation": "2 + 2 = 4",
  "difficulty_level": "EASY",
  "exam_year": 2023,
  "exam_type": "JAMB",
  "topic": "Arithmetic"
}
```

**Note:** The `difficulty_level` field is ignored during import (removed from schema).

---

## 🗑️ After Import

After successfully importing questions to the database:

### ✅ Keep These Files:
- All JSON files (as backup/reference)
- `subjects.json` (reference data)
- `soprep-db.md` (documentation)
- This `README.md`

### ⚠️ Do NOT Delete:
- These files serve as backup and reference
- They can be used to re-import if database is reset
- They document the original question sources

---

## 📈 Expected Import Results

After running the full import script, you should have:

| Subject      | Approximate Questions |
|--------------|-----------------------|
| Mathematics  | 35-40                 |
| English      | 25-30                 |
| Physics      | 20-25                 |
| Chemistry    | 10-15                 |
| Biology      | 10-15                 |
| Economics    | 5-10                  |
| **Total**    | **~150+**             |

---

## 🔍 Verification

After import, verify in Supabase:

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

---

## 📞 Need Help?

See the main import guide: **`IMPORT_QUESTIONS_README.md`** in the project root.

