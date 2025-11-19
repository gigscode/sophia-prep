-- Drop unnecessary migration infrastructure tables
-- These are not needed for a fresh database setup

DROP TABLE IF EXISTS migration_backups CASCADE;
DROP TABLE IF EXISTS migration_logs CASCADE;

-- Drop the helper functions too
DROP FUNCTION IF EXISTS log_migration_operation(text, text, text, integer, text, jsonb);
DROP FUNCTION IF EXISTS backup_table_data(text, text, jsonb);
