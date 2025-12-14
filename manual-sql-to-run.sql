-- ============================================================================
-- SOPHIA PREP - TOPICS IMPLEMENTATION (MANUAL SQL)
-- ============================================================================
-- Copy and paste this SQL into your Supabase Dashboard > SQL Editor
-- ============================================================================

-- 1. CREATE TOPICS TABLE
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

-- 2. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_active ON topics(is_active);
CREATE INDEX IF NOT EXISTS idx_topics_order ON topics(order_index);
CREATE UNIQUE INDEX IF NOT EXISTS idx_topics_subject_slug ON topics(subject_id, slug);

-- 3. ENABLE RLS
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;

-- 4. CREATE POLICIES
CREATE POLICY "Topics are viewable by everyone"
  ON topics FOR SELECT
  TO public
  USING (is_active = true);

CREATE POLICY "Admins can manage topics"
  ON topics FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'email' IN ('reubensunday1220@gmail.com', 'gigsdev007@gmail.com'));

-- 5. ADD TOPIC_ID TO QUESTIONS TABLE
ALTER TABLE questions ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES topics(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);

-- 6. INSERT SAMPLE TOPICS FOR MATHEMATICS
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

-- 7. INSERT SAMPLE TOPICS FOR ENGLISH LANGUAGE
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

-- 8. INSERT SAMPLE TOPICS FOR PHYSICS
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

-- 9. INSERT SAMPLE TOPICS FOR CHEMISTRY
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

-- 10. INSERT SAMPLE TOPICS FOR BIOLOGY
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

-- 11. INSERT TOPICS FOR OTHER SUBJECTS
INSERT INTO topics (subject_id, name, slug, order_index)
SELECT 
  s.id,
  topic_name,
  LOWER(REPLACE(topic_name, ' ', '-')),
  ROW_NUMBER() OVER (ORDER BY topic_name)
FROM subjects s
CROSS JOIN (
  SELECT 'Economics' as subject_name, unnest(ARRAY['Microeconomics', 'Macroeconomics', 'Development Economics', 'International Trade']) as topic_name
  UNION ALL
  SELECT 'Government', unnest(ARRAY['Political Theory', 'Comparative Politics', 'Public Administration', 'International Relations'])
  UNION ALL
  SELECT 'Geography', unnest(ARRAY['Physical Geography', 'Human Geography', 'Economic Geography', 'Environmental Geography'])
  UNION ALL
  SELECT 'History', unnest(ARRAY['Ancient History', 'Medieval History', 'Modern History', 'African History'])
  UNION ALL
  SELECT 'Literature in English', unnest(ARRAY['Poetry', 'Drama', 'Prose', 'Literary Criticism'])
  UNION ALL
  SELECT 'Agricultural Science', unnest(ARRAY['Crop Production', 'Animal Husbandry', 'Soil Science', 'Agricultural Economics'])
) AS topic_data
WHERE s.name = topic_data.subject_name AND s.is_active = true
ON CONFLICT (subject_id, slug) DO NOTHING;

-- 12. RANDOMLY ASSIGN EXISTING QUESTIONS TO TOPICS
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

-- 13. CREATE UPDATED_AT TRIGGER
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
-- VERIFICATION QUERIES (Run these to check if everything worked)
-- ============================================================================

-- Check topics created
SELECT 
  s.name as subject_name,
  COUNT(t.id) as topic_count
FROM subjects s
LEFT JOIN topics t ON s.id = t.subject_id AND t.is_active = true
WHERE s.is_active = true
GROUP BY s.id, s.name
ORDER BY s.name;

-- Check questions with topics
SELECT 
  COUNT(*) as total_questions,
  COUNT(topic_id) as questions_with_topics,
  ROUND(COUNT(topic_id) * 100.0 / COUNT(*), 2) as percentage_with_topics
FROM questions 
WHERE is_active = true;

-- Show sample topics
SELECT 
  s.name as subject_name,
  t.name as topic_name,
  COUNT(q.id) as question_count
FROM subjects s
JOIN topics t ON s.id = t.subject_id
LEFT JOIN questions q ON t.id = q.topic_id AND q.is_active = true
WHERE s.is_active = true AND t.is_active = true
GROUP BY s.id, s.name, t.id, t.name, t.order_index
ORDER BY s.name, t.order_index
LIMIT 20;