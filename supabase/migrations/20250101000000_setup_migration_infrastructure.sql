-- Migration Infrastructure Setup
-- This migration creates the logging and tracking infrastructure for the JAMB/WAEC transformation

-- Create migration_logs table to track all migration operations
CREATE TABLE IF NOT EXISTS migration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  migration_name TEXT NOT NULL,
  operation TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('STARTED', 'IN_PROGRESS', 'COMPLETED', 'FAILED', 'ROLLED_BACK')),
  affected_rows INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for querying migration logs
CREATE INDEX idx_migration_logs_name ON migration_logs(migration_name);
CREATE INDEX idx_migration_logs_status ON migration_logs(status);
CREATE INDEX idx_migration_logs_created ON migration_logs(created_at DESC);

-- Create migration_backups table to track backup information
CREATE TABLE IF NOT EXISTS migration_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_name TEXT NOT NULL UNIQUE,
  table_name TEXT NOT NULL,
  backup_data JSONB NOT NULL,
  row_count INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_migration_backups_table ON migration_backups(table_name);
CREATE INDEX idx_migration_backups_created ON migration_backups(created_at DESC);

-- Function to log migration operations
CREATE OR REPLACE FUNCTION log_migration_operation(
  p_migration_name TEXT,
  p_operation TEXT,
  p_status TEXT,
  p_affected_rows INTEGER DEFAULT 0,
  p_error_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO migration_logs (
    migration_name,
    operation,
    status,
    affected_rows,
    error_message,
    metadata,
    completed_at
  ) VALUES (
    p_migration_name,
    p_operation,
    p_status,
    p_affected_rows,
    p_error_message,
    p_metadata,
    CASE WHEN p_status IN ('COMPLETED', 'FAILED', 'ROLLED_BACK') THEN NOW() ELSE NULL END
  )
  RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to create backup of table data
CREATE OR REPLACE FUNCTION backup_table_data(
  p_backup_name TEXT,
  p_table_name TEXT,
  p_data JSONB
) RETURNS UUID AS $$
DECLARE
  v_backup_id UUID;
  v_row_count INTEGER;
BEGIN
  -- Count rows in backup data
  v_row_count := jsonb_array_length(p_data);
  
  INSERT INTO migration_backups (
    backup_name,
    table_name,
    backup_data,
    row_count
  ) VALUES (
    p_backup_name,
    p_table_name,
    p_data,
    v_row_count
  )
  RETURNING id INTO v_backup_id;
  
  RETURN v_backup_id;
END;
$$ LANGUAGE plpgsql;

-- Log the infrastructure setup
SELECT log_migration_operation(
  'setup_migration_infrastructure',
  'CREATE_TABLES',
  'COMPLETED',
  0,
  NULL,
  '{"description": "Created migration_logs and migration_backups tables"}'::jsonb
);
