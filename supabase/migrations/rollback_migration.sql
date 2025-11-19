-- Rollback Script for JAMB/WAEC Transformation
-- This script can be used to rollback the migration if needed
-- WARNING: This will drop all new tables and data. Use with caution!

-- Log rollback start
DO $$
DECLARE
  v_log_id UUID;
BEGIN
  SELECT log_migration_operation(
    'rollback_migration',
    'START_ROLLBACK',
    'STARTED',
    0,
    NULL,
    '{"description": "Starting rollback of JAMB/WAEC transformation"}'::jsonb
  ) INTO v_log_id;
END $$;

-- Drop tables in reverse order of creation (respecting foreign key dependencies)
DROP TABLE IF EXISTS mock_exam_sessions CASCADE;
DROP TABLE IF EXISTS study_targets CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS study_materials CASCADE;
DROP TABLE IF EXISTS subject_combinations CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS topics CASCADE;
DROP TABLE IF EXISTS subjects CASCADE;

-- Note: migration_logs and migration_backups tables are kept for audit purposes
-- If you want to drop them as well, uncomment the following lines:
-- DROP TABLE IF EXISTS migration_backups CASCADE;
-- DROP TABLE IF EXISTS migration_logs CASCADE;

-- Log rollback completion
DO $$
DECLARE
  v_log_id UUID;
BEGIN
  SELECT log_migration_operation(
    'rollback_migration',
    'COMPLETE_ROLLBACK',
    'COMPLETED',
    0,
    NULL,
    '{"description": "Rollback completed successfully", "tables_dropped": ["mock_exam_sessions", "study_targets", "notifications", "study_materials", "subject_combinations", "questions", "topics", "subjects"]}'::jsonb
  ) INTO v_log_id;
END $$;
