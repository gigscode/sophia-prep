-- ============================================================================
-- SOPHIA PREP - DATABASE CLEANUP (OPTIONAL)
-- ============================================================================
-- ⚠️  IMPORTANT: This is OPTIONAL cleanup to remove unused tables
-- Only run this if you want to clean up your database
-- Make sure to backup your database first!
-- ============================================================================

-- ============================================================================
-- STEP 1: VERIFY WHAT WILL BE DELETED (RUN THIS FIRST)
-- ============================================================================

-- Check which tables are empty and can be safely deleted
SELECT 
  'subject_combinations' as table_name, 
  (SELECT COUNT(*) FROM subject_combinations) as row_count
UNION ALL
SELECT 
  'study_materials', 
  (SELECT COUNT(*) FROM study_materials)
UNION ALL
SELECT 
  'notifications', 
  (SELECT COUNT(*) FROM notifications)
UNION ALL
SELECT 
  'study_targets', 
  (SELECT COUNT(*) FROM study_targets)
UNION ALL
SELECT 
  'mock_exam_sessions', 
  (SELECT COUNT(*) FROM mock_exam_sessions)
UNION ALL
SELECT 
  'user_progress', 
  (SELECT COUNT(*) FROM user_progress)
UNION ALL
SELECT 
  'exam_items', 
  (SELECT COUNT(*) FROM exam_items)
UNION ALL
SELECT 
  'quiz_attempts_new', 
  (SELECT COUNT(*) FROM quiz_attempts_new)
UNION ALL
SELECT 
  'questions_new', 
  (SELECT COUNT(*) FROM questions_new)
UNION ALL
SELECT 
  'subjects_new', 
  (SELECT COUNT(*) FROM subjects_new)
UNION ALL
SELECT 
  'subject_exam_types', 
  (SELECT COUNT(*) FROM subject_exam_types)
UNION ALL
SELECT 
  'jamb_subject_combinations', 
  (SELECT COUNT(*) FROM jamb_subject_combinations);

-- ============================================================================
-- STEP 2: CLEANUP EMPTY TABLES (ONLY IF YOU WANT TO)
-- ============================================================================

-- ⚠️  UNCOMMENT THESE LINES ONLY IF YOU WANT TO DELETE EMPTY TABLES
-- ⚠️  MAKE SURE TO BACKUP YOUR DATABASE FIRST!

/*
-- Drop empty tables that aren't being used
DROP TABLE IF EXISTS subject_combinations CASCADE;
DROP TABLE IF EXISTS study_materials CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS study_targets CASCADE;
DROP TABLE IF EXISTS mock_exam_sessions CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS exam_items CASCADE;

-- Drop duplicate 'new' tables (keep the original ones that have data)
DROP TABLE IF EXISTS quiz_attempts_new CASCADE;
DROP TABLE IF EXISTS subject_exam_types CASCADE;
DROP TABLE IF EXISTS jamb_subject_combinations CASCADE;

-- ⚠️  BE CAREFUL WITH THESE - Only drop if you're sure they're not needed
-- DROP TABLE IF EXISTS questions_new CASCADE;
-- DROP TABLE IF EXISTS subjects_new CASCADE;
*/

-- ============================================================================
-- STEP 3: ADD PERFORMANCE INDEXES (SAFE TO RUN)
-- ============================================================================

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_subject_active ON questions(subject_id, is_active);
CREATE INDEX IF NOT EXISTS idx_questions_exam_type ON questions(exam_type);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_subject ON quiz_attempts(user_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_exam_type ON user_profiles(exam_type);
CREATE INDEX IF NOT EXISTS idx_subjects_active_category ON subjects(is_active, subject_category);
CREATE INDEX IF NOT EXISTS idx_questions_year ON questions(exam_year) WHERE exam_year IS NOT NULL;

-- ============================================================================
-- STEP 4: CREATE USEFUL VIEWS (SAFE TO RUN)
-- ============================================================================

-- View for subjects with topic and question counts
CREATE OR REPLACE VIEW subject_stats AS
SELECT 
  s.id,
  s.name,
  s.slug,
  s.description,
  s.icon,
  s.color_theme,
  s.exam_type,
  s.subject_category,
  s.is_mandatory,
  s.sort_order,
  COUNT(DISTINCT t.id) as topic_count,
  COUNT(DISTINCT q.id) as question_count,
  COUNT(DISTINCT CASE WHEN q.topic_id IS NOT NULL THEN q.id END) as questions_with_topics,
  MIN(q.exam_year) as earliest_year,
  MAX(q.exam_year) as latest_year
FROM subjects s
LEFT JOIN topics t ON s.id = t.subject_id AND t.is_active = true
LEFT JOIN questions q ON s.id = q.subject_id AND q.is_active = true
WHERE s.is_active = true
GROUP BY s.id, s.name, s.slug, s.description, s.icon, s.color_theme, 
         s.exam_type, s.subject_category, s.is_mandatory, s.sort_order
ORDER BY s.sort_order, s.name;

-- View for topics with question counts
CREATE OR REPLACE VIEW topic_stats AS
SELECT 
  t.id,
  t.name,
  t.slug,
  t.subject_id,
  s.name as subject_name,
  s.slug as subject_slug,
  t.order_index,
  COUNT(q.id) as question_count,
  MIN(q.exam_year) as earliest_year,
  MAX(q.exam_year) as latest_year,
  COUNT(DISTINCT q.exam_type) as exam_type_count
FROM topics t
JOIN subjects s ON t.subject_id = s.id
LEFT JOIN questions q ON t.id = q.topic_id AND q.is_active = true
WHERE t.is_active = true AND s.is_active = true
GROUP BY t.id, t.name, t.slug, t.subject_id, s.name, s.slug, t.order_index
ORDER BY s.name, t.order_index, t.name;

-- ============================================================================
-- STEP 5: VERIFICATION QUERIES
-- ============================================================================

-- Show current database size and structure
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
  pg_stat_get_tuples_returned(c.oid) as rows_read,
  pg_stat_get_tuples_inserted(c.oid) as rows_inserted
FROM pg_tables pt
JOIN pg_class c ON c.relname = pt.tablename
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Show subjects with their topics and questions
SELECT * FROM subject_stats ORDER BY name;

-- Show topics with question counts
SELECT * FROM topic_stats LIMIT 20;

SELECT 'Database analysis complete! Review the results above.' as status;