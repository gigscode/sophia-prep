# Question Subject ID Backfill Script

## Overview

This script populates the `subject_id` column for existing questions in the database by looking up the subject from their associated topics. It's part of the migration to make topics optional in the quiz system.

## Purpose

- **Requirement**: 4.2 - Backfill subject_id from existing topic relationships
- **Design Property**: Property 5 - Subject_id backfill correctness

## What It Does

1. **Identifies Questions**: Finds all questions that have `subject_id = NULL`
2. **Categorizes Questions**: 
   - Valid questions (with existing topic_id references)
   - Orphaned questions (with invalid or missing topic_id)
3. **Updates Valid Questions**: Populates `subject_id` from the topic's `subject_id`
4. **Logs Orphaned Questions**: Reports questions that need manual review
5. **Verifies Correctness**: Runs validation checks to ensure backfill accuracy

## Prerequisites

- Node.js installed
- `.env.local` file with Supabase credentials:
  - `SUPABASE_URL` (or `VITE_SUPABASE_URL`)
  - `SUPABASE_SERVICE_ROLE_KEY` (or `SUPABASE_SERVICE_KEY`)
- Database migration `20251208_add_subject_id_to_questions.sql` must be applied first

## Usage

```bash
# Run the backfill script
node scripts/backfill-question-subject-ids.js
```

## What to Expect

### Successful Run
```
🔄 Question Subject ID Backfill Script

📍 URL: https://your-project.supabase.co
🔑 Service Role Key: SET

🔍 Fetching questions that need subject_id backfill...
   ✅ Found 150 questions without subject_id

🔍 Fetching topic-to-subject mappings...
   ✅ Found 45 topics

🔍 Categorizing questions...
   ✅ Valid questions: 148
   ⚠️  Orphaned questions: 2

🔨 Processing 148 valid questions...
   Processing batch 1/3 (50 questions)...
   Processing batch 2/3 (50 questions)...
   Processing batch 3/3 (48 questions)...
   ✅ Batch processing complete

⚠️  ORPHANED QUESTIONS REQUIRING MANUAL REVIEW (2):
======================================================================

1. Question ID: abc-123-def
   Topic ID: NULL
   Reason: No topic_id assigned
   Question Text: What is the capital of Nigeria?...

2. Question ID: xyz-789-ghi
   Topic ID: invalid-uuid
   Reason: Invalid topic_id reference (topic does not exist)
   Question Text: Calculate the area of a circle...

======================================================================
⚠️  These questions need manual subject assignment.
   You can update them using the admin interface or SQL:
   UPDATE questions SET subject_id = '<subject-uuid>' WHERE id = '<question-uuid>';

🔍 Verifying backfill correctness...

📊 Verification Results:
======================================================================
✅ Subject ID matches topic's subject ID
   All 148 questions have correct subject_id
✅ No questions with both subject_id and topic_id null
   All questions have either subject_id or topic_id
✅ Questions with subject_id populated
   148 questions now have subject_id
======================================================================

======================================================================
📊 BACKFILL SUMMARY REPORT
======================================================================

📈 Statistics:
   Total questions needing backfill:  150
   Questions updated successfully:    148
   Orphaned questions (manual review): 2
   Errors encountered:                0
   Verification passed:               YES

======================================================================
⚠️  Backfill completed with orphaned questions.
   148 questions updated successfully.
   2 questions need manual subject assignment.

```

## Handling Orphaned Questions

If the script identifies orphaned questions, you have two options:

### Option 1: Using SQL (Recommended for bulk updates)

```sql
-- Find the correct subject_id for the question
SELECT id, name FROM subjects WHERE slug = 'mathematics';

-- Update the orphaned question
UPDATE questions 
SET subject_id = '<subject-uuid-from-above>' 
WHERE id = '<orphaned-question-uuid>';
```

### Option 2: Using Admin Interface

1. Log in to the admin panel
2. Navigate to Question Management
3. Find the orphaned question by ID
4. Edit the question and assign the correct subject
5. Save changes

### Option 3: Delete Invalid Questions

If the orphaned questions are invalid or duplicates:

```sql
-- Delete the orphaned question
DELETE FROM questions WHERE id = '<orphaned-question-uuid>';
```

## Verification Checks

The script performs three verification checks:

1. **Subject ID Consistency**: Ensures all questions with `topic_id` have `subject_id` matching their topic's subject
2. **No Null Violations**: Ensures no questions have both `subject_id` and `topic_id` as null
3. **Backfill Coverage**: Reports how many questions now have `subject_id` populated

## Idempotency

This script is **idempotent** - you can run it multiple times safely:
- Already backfilled questions are skipped (they have `subject_id` set)
- Only questions with `subject_id = NULL` are processed
- No duplicate updates or data corruption

## Troubleshooting

### Error: Missing Supabase credentials
```
❌ Missing Supabase credentials in .env.local
```
**Solution**: Ensure `.env.local` exists with correct Supabase credentials

### Error: Failed to fetch questions
```
❌ Error fetching questions: permission denied for table questions
```
**Solution**: Ensure you're using the service role key, not the anon key

### Error: Migration not applied
```
❌ Error: column "subject_id" does not exist
```
**Solution**: Run the migration first:
```bash
# Apply the migration in Supabase Dashboard > SQL Editor
# Or use Supabase CLI
supabase db push
```

## Related Files

- **Migration**: `supabase/migrations/20251208_add_subject_id_to_questions.sql`
- **Requirements**: `.kiro/specs/remove-topic-dependency/requirements.md`
- **Design**: `.kiro/specs/remove-topic-dependency/design.md`
- **Tasks**: `.kiro/specs/remove-topic-dependency/tasks.md`

## Next Steps

After running this script successfully:

1. Review and fix any orphaned questions
2. Run the script again to verify all questions are backfilled
3. Proceed to Task 3: Update Question Service to query by subject_id directly
4. Test the quiz flow with the new subject-based queries

## Support

If you encounter issues:
1. Check the error messages in the console output
2. Review the verification results
3. Check Supabase logs for database errors
4. Consult the design document for expected behavior
