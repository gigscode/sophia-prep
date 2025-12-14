-- ============================================================================
-- SOPHIA PREP - DATABASE CLEANUP AND TOPICS IMPLEMENTATION
-- ============================================================================
-- This migration will:
-- 1. Create the missing topics table
-- 2. Clean up unnecessary tables and columns
-- 3. Optimize the database structure for your app
-- ============================================================================

-- ============================================================================
-- 1. CREATE TOPICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for topics
CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_active ON topics(is_active);
CREATE INDEX IF NOT EXISTS idx_topics_order ON topics(order_index);
CREATE UNIQUE INDEX IF NOT EXISTS idx_topics_subject_slug ON topics(subject_id, slug);

-- Enable RLS on topics
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- Topics policies
CREATE POLICY "Topics are viewable by everyone"
  ON topics FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage topics"
  ON topics FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' IN ('reubensunday1220@gmail.com', 'gigsdev007@gmail.com'));

-- ============================================================================
-- 2. ADD TOPIC_ID TO QUESTIONS TABLE (if not exists)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'questions' AND column_name = 'topic_id'
  ) THEN
    ALTER TABLE questions ADD COLUMN topic_id UUID REFERENCES topics(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);
  END IF;
END $$;

-- ============================================================================
-- 3. CLEAN UP UNNECESSARY TABLES
-- ============================================================================

-- Drop empty tables that aren't being used
DROP TABLE IF EXISTS subject_combinations CASCADE;
DROP TABLE IF EXISTS study_materials CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS study_targets CASCADE;
DROP TABLE IF EXISTS mock_exam_sessions CASCADE;
DROP TABLE IF EXISTS user_progress CASCADE;
DROP TABLE IF EXISTS exam_items CASCADE;

-- ============================================================================
-- 4. CONSOLIDATE DUPLICATE TABLES (Keep the working ones)
-- ============================================================================

-- You have both 'subjects' and 'subjects_new' - let's keep 'subjects' since it has data
-- and 'questions' vs 'questions_new' - let's keep 'questions' since it has data

-- Drop the unused 'new' tables if they exist
DROP TABLE IF EXISTS quiz_attempts_new CASCADE;
DROP TABLE IF EXISTS questions_new CASCADE;
DROP TABLE IF EXISTS subjects_new CASCADE;
DROP TABLE IF EXISTS subject_exam_types CASCADE;
DROP TABLE IF EXISTS jamb_subject_combinations CASCADE;

-- ============================================================================
-- 5. OPTIMIZE EXISTING TABLES
-- ============================================================================

-- Add missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_questions_subject_active ON questions(subject_id, is_active);
CREATE INDEX IF NOT EXISTS idx_questions_exam_type ON questions(exam_type);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_subject ON quiz_attempts(user_id, subject_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_exam_type ON user_profiles(exam_type);

-- ============================================================================
-- 6. ADD SAMPLE TOPICS FOR EXISTING SUBJECTS
-- ============================================================================

-- Insert sample topics for Mathematics
INSERT INTO topics (subject_id, name, slug, order_index)
SELECT 
  s.id,
  topic_name,
  LOWER(REPLACE(topic_name, ' ', '-')),
  ROW_NUMBER() OVER (ORDER BY topic_name)
FROM subjects s
CROSS JOIN (
  VALUES 
    ('Algebra'),
    ('Geometry'),
    ('Trigonometry'),
    ('Calculus'),
    ('Statistics'),
    ('Number Theory'),
    ('Coordinate Geometry'),
    ('Mensuration')
) AS topics_data(topic_name)
WHERE s.name = 'Mathematics' AND s.is_active = true
ON CONFLICT (subject_id, slug) DO NOTHING;

-- Insert sample topics for English Language
INSERT INTO topics (subject_id, name, slug, order_index)
SELECT 
  s.id,
  topic_name,
  LOWER(REPLACE(topic_name, ' ', '-')),
  ROW_NUMBER() OVER (ORDER BY topic_name)
FROM subjects s
CROSS JOIN (
  VALUES 
    ('Comprehension'),
    ('Grammar'),
    ('Vocabulary'),
    ('Essay Writing'),
    ('Literature'),
    ('Oral English'),
    ('Summary Writing')
) AS topics_data(topic_name)
WHERE s.name = 'English Language' AND s.is_active = true
ON CONFLICT (subject_id, slug) DO NOTHING;

-- Insert sample topics for Physics
INSERT INTO topics (subject_id, name, slug, order_index)
SELECT 
  s.id,
  topic_name,
  LOWER(REPLACE(topic_name, ' ', '-')),
  ROW_NUMBER() OVER (ORDER BY topic_name)
FROM subjects s
CROSS JOIN (
  VALUES 
    ('Mechanics'),
    ('Thermodynamics'),
    ('Electricity'),
    ('Magnetism'),
    ('Optics'),
    ('Modern Physics'),
    ('Waves and Sound')
) AS topics_data(topic_name)
WHERE s.name = 'Physics' AND s.is_active = true
ON CONFLICT (subject_id, slug) DO NOTHING;

-- Insert sample topics for Chemistry
INSERT INTO topics (subject_id, name, slug, order_index)
SELECT 
  s.id,
  topic_name,
  LOWER(REPLACE(topic_name, ' ', '-')),
  ROW_NUMBER() OVER (ORDER BY topic_name)
FROM subjects s
CROSS JOIN (
  VALUES 
    ('Organic Chemistry'),
    ('Inorganic Chemistry'),
    ('Physical Chemistry'),
    ('Analytical Chemistry'),
    ('Biochemistry'),
    ('Environmental Chemistry')
) AS topics_data(topic_name)
WHERE s.name = 'Chemistry' AND s.is_active = true
ON CONFLICT (subject_id, slug) DO NOTHING;

-- Insert sample topics for Biology
INSERT INTO topics (subject_id, name, slug, order_index)
SELECT 
  s.id,
  topic_name,
  LOWER(REPLACE(topic_name, ' ', '-')),
  ROW_NUMBER() OVER (ORDER BY topic_name)
FROM subjects s
CROSS JOIN (
  VALUES 
    ('Cell Biology'),
    ('Genetics'),
    ('Evolution'),
    ('Ecology'),
    ('Human Anatomy'),
    ('Plant Biology'),
    ('Animal Biology')
) AS topics_data(topic_name)
WHERE s.name = 'Biology' AND s.is_active = true
ON CONFLICT (subject_id, slug) DO NOTHING;

-- Add topics for other common subjects
INSERT INTO topics (subject_id, name, slug, order_index)
SELECT 
  s.id,
  CASE s.name
    WHEN 'Economics' THEN unnest(ARRAY['Microeconomics', 'Macroeconomics', 'Development Economics', 'International Trade'])
    WHEN 'Government' THEN unnest(ARRAY['Political Theory', 'Comparative Politics', 'Public Administration', 'International Relations'])
    WHEN 'Geography' THEN unnest(ARRAY['Physical Geography', 'Human Geography', 'Economic Geography', 'Environmental Geography'])
    WHEN 'History' THEN unnest(ARRAY['Ancient History', 'Medieval History', 'Modern History', 'African History'])
    WHEN 'Literature in English' THEN unnest(ARRAY['Poetry', 'Drama', 'Prose', 'Literary Criticism'])
    WHEN 'Agricultural Science' THEN unnest(ARRAY['Crop Production', 'Animal Husbandry', 'Soil Science', 'Agricultural Economics'])
    ELSE 'General Topics'
  END,
  CASE s.name
    WHEN 'Economics' THEN LOWER(REPLACE(unnest(ARRAY['Microeconomics', 'Macroeconomics', 'Development Economics', 'International Trade']), ' ', '-'))
    WHEN 'Government' THEN LOWER(REPLACE(unnest(ARRAY['Political Theory', 'Comparative Politics', 'Public Administration', 'International Relations']), ' ', '-'))
    WHEN 'Geography' THEN LOWER(REPLACE(unnest(ARRAY['Physical Geography', 'Human Geography', 'Economic Geography', 'Environmental Geography']), ' ', '-'))
    WHEN 'History' THEN LOWER(REPLACE(unnest(ARRAY['Ancient History', 'Medieval History', 'Modern History', 'African History']), ' ', '-'))
    WHEN 'Literature in English' THEN LOWER(REPLACE(unnest(ARRAY['Poetry', 'Drama', 'Prose', 'Literary Criticism']), ' ', '-'))
    WHEN 'Agricultural Science' THEN LOWER(REPLACE(unnest(ARRAY['Crop Production', 'Animal Husbandry', 'Soil Science', 'Agricultural Economics']), ' ', '-'))
    ELSE 'general-topics'
  END,
  1
FROM subjects s
WHERE s.name IN ('Economics', 'Government', 'Geography', 'History', 'Literature in English', 'Agricultural Science')
  AND s.is_active = true
ON CONFLICT (subject_id, slug) DO NOTHING;

-- ============================================================================
-- 7. RANDOMLY ASSIGN EXISTING QUESTIONS TO TOPICS
-- ============================================================================

-- Update existing questions to have topic_id
UPDATE questions 
SET topic_id = (
  SELECT t.id 
  FROM topics t 
  WHERE t.subject_id = questions.subject_id 
    AND t.is_active = true
  ORDER BY RANDOM() 
  LIMIT 1
)
WHERE topic_id IS NULL 
  AND subject_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM topics t 
    WHERE t.subject_id = questions.subject_id 
      AND t.is_active = true
  );

-- ============================================================================
-- 8. CREATE USEFUL VIEWS FOR THE APP
-- ============================================================================

-- View for subjects with topic counts
CREATE OR REPLACE VIEW subject_topic_stats AS
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
  COUNT(DISTINCT CASE WHEN q.topic_id IS NOT NULL THEN q.id END) as questions_with_topics
FROM subjects s
LEFT JOIN topics t ON s.id = t.subject_id AND t.is_active = true
LEFT JOIN questions q ON s.id = q.subject_id AND q.is_active = true
WHERE s.is_active = true
GROUP BY s.id, s.name, s.slug, s.description, s.icon, s.color_theme, 
         s.exam_type, s.subject_category, s.is_mandatory, s.sort_order
ORDER BY s.sort_order, s.name;

-- View for topics with question counts
CREATE OR REPLACE VIEW topic_question_stats AS
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
  MAX(q.exam_year) as latest_year
FROM topics t
JOIN subjects s ON t.subject_id = s.id
LEFT JOIN questions q ON t.id = q.topic_id AND q.is_active = true
WHERE t.is_active = true AND s.is_active = true
GROUP BY t.id, t.name, t.slug, t.subject_id, s.name, s.slug, t.order_index
ORDER BY s.name, t.order_index, t.name;

-- ============================================================================
-- 9. UPDATE TRIGGERS
-- ============================================================================

-- Add updated_at trigger for topics
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_topics_updated_at 
  BEFORE UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Summary of changes:
-- ✅ Created topics table with proper relationships
-- ✅ Added sample topics for all major subjects  
-- ✅ Linked existing questions to topics randomly
-- ✅ Cleaned up unnecessary tables
-- ✅ Added performance indexes
-- ✅ Created useful views for the app
-- ✅ Set up proper RLS policies

SELECT 'Database cleanup and topics implementation completed successfully!' as status;