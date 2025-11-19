# Migration 20250101000001 - Create Subjects Table

## Overview
This migration creates the subjects table structure for the Sophia Prep JAMB/WAEC exam preparation platform.

## What This Migration Does

### 1. Creates Subjects Table
- **Purpose**: Store JAMB/WAEC exam subjects
- **Key Fields**:
  - `exam_type`: JAMB, WAEC, or BOTH
  - `subject_category`: SCIENCE, COMMERCIAL, ARTS, GENERAL, or LANGUAGE
  - `is_mandatory`: Boolean flag (English Language is mandatory)
  - `is_active`: Boolean flag for active subjects
  - `sort_order`: Integer for display ordering

### 2. Creates Topics Table
- **Purpose**: Store topics within each subject
- **Relationship**: Foreign key to subjects table (CASCADE delete)
- **Key Fields**:
  - `subject_id`: References subjects(id)
  - `order_index`: Integer for topic ordering within subject
  - `is_active`: Boolean flag

### 3. Creates Questions Table
- **Purpose**: Store quiz questions for each topic
- **Relationship**: Foreign key to topics table (CASCADE delete)
- **Key Fields**:
  - `topic_id`: References topics(id)
  - `correct_answer`: CHECK constraint (A, B, C, or D)
  - `difficulty_level`: CHECK constraint (EASY, MEDIUM, HARD)
  - `is_active`: Boolean flag

### 4. Indexes Created
- **Subjects**: slug, exam_type, subject_category, is_active, sort_order
- **Topics**: subject_id, slug, is_active, order_index
- **Questions**: topic_id, difficulty_level, is_active

### 5. Row Level Security (RLS)
- Enabled on all three tables
- Public can view active records
- Authenticated users can view all records

## Requirements Satisfied
- **Requirement 9.4**: Creates clean subject structure
- **Requirement 9.5**: Establishes proper foreign key relationships

## Validation
Run `validate_migration.sql` to verify:
- Table structure is correct
- Constraints are in place
- Indexes are created
- RLS is enabled
- Foreign keys are properly configured

## Next Steps
1. Run migration 20250101000002 to create additional feature tables
2. Run migration 20250101000003 to add past questions support
3. Run migration 20250101000004 to seed JAMB/WAEC subjects
4. Execute property-based test for referential integrity (Task 1.2)

## Rollback
To rollback this migration, run `rollback_migration.sql` which will drop all created tables.

## Notes
- This is a fresh database setup, not a migration from existing data
- All tables use UUID primary keys
- Timestamps are automatically managed with DEFAULT NOW()
- CASCADE delete ensures referential integrity
