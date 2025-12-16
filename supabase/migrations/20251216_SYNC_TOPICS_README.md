# Topic Sync Migration - 3 Step Process

This directory contains a 3-step migration process to sync topics from `topics.md` to the database.

## Why 3 Steps?

The original topics table didn't have a `slug` column, so we need to:
1. Add the slug column
2. Generate slugs for any existing topics
3. Insert all new topics from topics.md

## Migration Files (Run in Order)

### Step 1: Add Slug Column
**File:** `20251216_step1_add_slug_to_topics.sql`

This migration:
- Adds a `slug` column to the topics table
- Creates a unique index on `(subject_id, slug)` to prevent duplicates
- Safe to run multiple times (checks if column exists first)

### Step 2: Generate Slugs for Existing Topics
**File:** `20251216_step2_generate_slugs_for_existing_topics.sql`

This migration:
- Auto-generates slugs for any existing topics that don't have them
- Uses the same slug generation logic as Step 3
- Shows a summary of topics with/without slugs

### Step 3: Sync Topics from topics.md
**File:** `20251216_sync_topics_from_md.sql`

This migration:
- Inserts all 188 topics from topics.md into the database
- Covers 7 subjects: Mathematics, Physics, English, CRS, Economics, Geography, Commerce
- Uses `ON CONFLICT DO NOTHING` to skip topics that already exist
- Shows a summary of topic counts per subject at the end

## How to Run

### Option 1: Via Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run each migration file in order:
   - First: `20251216_step1_add_slug_to_topics.sql`
   - Second: `20251216_step2_generate_slugs_for_existing_topics.sql`
   - Third: `20251216_sync_topics_from_md.sql`

### Option 2: Via Supabase CLI
```bash
# Make sure you're in the project root
cd /home/tizzleshop-dev/Documents/Github-Projects/sophia_now/sophia-prep

# Run migrations in order
supabase db push
```

## Expected Results

After running all 3 migrations, you should have:

- **188 topics** distributed across 7 subjects:
  - Mathematics: 24 topics
  - Physics: 37 topics
  - English: 21 topics
  - Christian Religious Studies: 36 topics
  - Economics: 23 topics
  - Geography: 31 topics
  - Commerce: 16 topics

- Each topic will have:
  - A unique `slug` (URL-friendly identifier)
  - Proper `subject_id` linking to its subject
  - Sequential `order_index` based on topics.md order
  - `is_active = true` by default

## Verification

After running the migrations, you can verify the results:

```sql
-- Check topic counts per subject
SELECT 
  s.name as subject,
  COUNT(t.id) as topic_count
FROM subjects s
LEFT JOIN topics t ON s.id = t.subject_id
WHERE s.slug IN ('mathematics', 'physics', 'english', 'crs', 'economics', 'geography', 'commerce')
GROUP BY s.name
ORDER BY s.name;

-- Check for topics without slugs
SELECT COUNT(*) FROM topics WHERE slug IS NULL OR slug = '';

-- View sample topics
SELECT s.name as subject, t.name, t.slug, t.order_index
FROM topics t
JOIN subjects s ON t.subject_id = s.id
WHERE s.slug = 'mathematics'
ORDER BY t.order_index
LIMIT 10;
```

## Troubleshooting

### Error: "column slug does not exist"
- Make sure you ran Step 1 first

### Error: "duplicate key value violates unique constraint"
- This means the topic already exists - this is expected and safe
- The migration uses `ON CONFLICT DO NOTHING` to handle this

### No topics inserted
- Check that the subjects exist in your database
- Verify subject slugs match: 'mathematics', 'physics', 'english', 'crs', 'economics', 'geography', 'commerce'
- Run the verification queries above

## Related Files

- **Source data:** `/topics.md` (root of project)
- **Admin UI:** `src/components/admin/TopicManagement.tsx`
- **Service layer:** `src/services/admin-topic-service.ts`

