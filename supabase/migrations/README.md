# JAMB/WAEC Transformation Migration Scripts

This directory contains SQL migration scripts for transforming the platform into Sophia Prep, a comprehensive JAMB/WAEC exam preparation application.

## Migration Overview

The migration transforms the existing learning platform structure to support Nigerian exam preparation:
- Renames domains → subjects
- Adds JAMB/WAEC specific fields
- Creates new tables for exam features
- Seeds 21 JAMB/WAEC subjects

## Migration Files

### Infrastructure
- `20250101000000_setup_migration_infrastructure.sql` - Sets up migration logging and backup infrastructure

### Core Transformations
- `20250101000001_clean_and_rename_domains_to_subjects.sql` - Creates subjects, topics, and questions tables
- `20250101000002_create_new_tables.sql` - Creates subject_combinations, study_materials, notifications, study_targets, mock_exam_sessions
- `20250101000003_update_questions_for_past_questions.sql` - Adds exam_year, exam_type, question_number columns
- `20250101000004_seed_jamb_waec_subjects.sql` - Seeds all 21 JAMB/WAEC subjects

### Rollback
- `rollback_migration.sql` - Rollback script to undo all migrations (use with caution)

## Running Migrations

### Using Supabase CLI

```bash
# Apply all migrations
supabase db push

# Or apply migrations individually
supabase db push --file supabase/migrations/20250101000000_setup_migration_infrastructure.sql
supabase db push --file supabase/migrations/20250101000001_clean_and_rename_domains_to_subjects.sql
# ... continue for each file
```

### Manual Execution

If you prefer to run migrations manually:

1. Connect to your Supabase database
2. Execute migrations in order:
   ```sql
   \i supabase/migrations/20250101000000_setup_migration_infrastructure.sql
   \i supabase/migrations/20250101000001_clean_and_rename_domains_to_subjects.sql
   \i supabase/migrations/20250101000002_create_new_tables.sql
   \i supabase/migrations/20250101000003_update_questions_for_past_questions.sql
   \i supabase/migrations/20250101000004_seed_jamb_waec_subjects.sql
   ```

## Migration Logging

All migrations are logged in the `migration_logs` table:

```sql
-- View migration history
SELECT 
  migration_name,
  operation,
  status,
  affected_rows,
  started_at,
  completed_at
FROM migration_logs
ORDER BY created_at DESC;
```

## Rollback Procedure

**WARNING**: Rollback will drop all new tables and data. Only use in development or if migration fails critically.

```bash
# Using Supabase CLI
supabase db push --file supabase/migrations/rollback_migration.sql

# Or manually
psql -h your-db-host -U postgres -d postgres -f supabase/migrations/rollback_migration.sql
```

## Verification

After running migrations, verify the setup:

```sql
-- Check subjects were created
SELECT COUNT(*) as subject_count FROM subjects;
-- Expected: 21

-- Check table structure
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'subjects', 
    'topics', 
    'questions', 
    'subject_combinations',
    'study_materials',
    'notifications',
    'study_targets',
    'mock_exam_sessions'
  )
ORDER BY table_name;
-- Expected: All 8 tables

-- Check RLS policies are enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'subjects', 
    'topics', 
    'questions', 
    'subject_combinations',
    'study_materials',
    'notifications',
    'study_targets',
    'mock_exam_sessions'
  );
-- Expected: All tables should have rowsecurity = true
```

## Data Preservation

The migration preserves:
- ✅ User accounts (auth.users)
- ✅ Payment records
- ✅ Subscription history
- ✅ Authentication tokens

The migration clears/replaces:
- ❌ Old domain/topic/question data (replaced with JAMB/WAEC structure)

## Requirements Mapping

- **Requirement 9.1**: User account data preservation
- **Requirement 9.2**: Payment history preservation
- **Requirement 9.4**: Clean existing content data
- **Requirement 9.5**: Update foreign key relationships
- **Requirement 9.6**: Maintain referential integrity
- **Requirement 9.7**: Generate migration report (via migration_logs)

## Support

For issues or questions about the migration:
1. Check migration_logs table for error messages
2. Review the rollback procedure
3. Contact the development team

## Next Steps

After successful migration:
1. Run property-based tests for referential integrity (Task 1.2)
2. Run property-based tests for data preservation (Task 1.6)
3. Proceed to Phase 2: Core Subject & Topic Management
