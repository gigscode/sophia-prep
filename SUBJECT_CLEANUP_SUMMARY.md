# Subject Cleanup Summary

## Issue Identified
You had duplicate subjects in your app:
- "English" AND "English Language" 
- "Literature" AND "Literature in English"

This was causing inconsistencies in subject selection and potentially confusing users.

## Root Cause
The issue was caused by inconsistent slug naming conventions:
- **Seed file** used: `'english'` and `'literature'`
- **Other scripts** used: `'english-language'` and `'literature-in-english'`
- **Frontend code** was looking for both variations

## Changes Made

### 1. Frontend Code Updates

#### `src/pages/JAMBExamPage.tsx`
- **Fixed English subject lookup** to use consistent `'english'` slug
- **Updated comments** to be more accurate about English Language being mandatory

#### `src/utils/question-content-validator.ts`
- **Updated English Language slug** from `'english-language'` to `'english'`
- **Updated Literature in English slug** from `'literature-in-english'` to `'literature'`

#### `src/services/subject-combination-service.ts`
- **Updated all subject combinations** to use consistent slugs:
  - `'english-language'` → `'english'`
  - `'literature-in-english'` → `'literature'`

#### `src/services/quiz-service.ts`
- **Updated documentation** to reflect correct slug format

### 2. Database Cleanup Script

#### `cleanup-duplicate-subjects.sql`
A comprehensive SQL script that:

1. **Moves questions** from duplicate subjects to correct ones
2. **Moves user progress** from duplicates to correct subjects  
3. **Deletes duplicate subjects** (keeping the correct ones)
4. **Updates subject properties** to ensure consistency
5. **Updates subscription plans** to use correct slugs
6. **Provides verification queries** to confirm cleanup

### 3. Documentation Updates

#### `SQL_TO_RUN.md`
- **Added cleanup section** with instructions for running the duplicate removal script

## What You Need to Do

### 1. Run the Database Cleanup (Required)
```sql
-- Run this in your Supabase SQL Editor
-- File: cleanup-duplicate-subjects.sql
```

This will:
- Remove duplicate "English" subject (keep "English Language" with slug 'english')
- Remove duplicate "Literature" subject (keep "Literature in English" with slug 'literature')
- Move any existing questions/data to the correct subjects
- Update subscription plans

### 2. Verify the Fix
After running the cleanup script, check:

```sql
-- Should show only one English and one Literature subject
SELECT name, slug, subject_category, is_mandatory
FROM subjects 
WHERE name ILIKE '%english%' OR name ILIKE '%literature%'
ORDER BY name;
```

Expected result:
```
name                    | slug       | subject_category | is_mandatory
------------------------+------------+------------------+-------------
English Language        | english    | LANGUAGE         | true
Literature in English   | literature | ARTS             | false
```

### 3. Test the Frontend
1. Go to `/jamb-exam` 
2. Verify that "English Language" is auto-selected
3. Verify that "Literature in English" appears in Arts subjects
4. Verify no duplicate subjects appear

## Benefits of This Fix

✅ **Consistent naming** - No more confusion between "English" vs "English Language"  
✅ **Clean subject selection** - Users see only the correct subjects  
✅ **Better UX** - No duplicate options in dropdowns  
✅ **Data integrity** - All questions properly assigned to correct subjects  
✅ **Future-proof** - Consistent slug usage across the entire codebase  

## Files Modified

- `src/pages/JAMBExamPage.tsx`
- `src/utils/question-content-validator.ts` 
- `src/services/subject-combination-service.ts`
- `src/services/quiz-service.ts`
- `SQL_TO_RUN.md`
- `cleanup-duplicate-subjects.sql` (new file)

## No Breaking Changes

All changes are backward compatible and will work whether you have the duplicates or not. The cleanup script safely handles both scenarios.