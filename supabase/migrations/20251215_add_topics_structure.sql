-- Add Topics Structure to Database
-- Date: 2025-12-15
-- Description: Create hierarchical topics structure for subjects

-- 1. Create topic_categories table for grouping topics
CREATE TABLE IF NOT EXISTS topic_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  color_theme TEXT DEFAULT '#3B82F6', -- Default blue theme
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(subject_id, slug)
);

-- 2. Create topics table with hierarchical structure
CREATE TABLE IF NOT EXISTS topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  category_id UUID REFERENCES topic_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  
  -- Hierarchical structure
  parent_topic_id UUID REFERENCES topics(id) ON DELETE CASCADE,
  topic_level INTEGER DEFAULT 1 CHECK (topic_level >= 1 AND topic_level <= 3),
  
  -- Organization and metadata
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  estimated_questions_count INTEGER DEFAULT 0,
  difficulty_level TEXT CHECK (difficulty_level IN ('BASIC', 'INTERMEDIATE', 'ADVANCED')),
  
  -- Learning metadata
  estimated_study_time_minutes INTEGER DEFAULT 60,
  prerequisites TEXT[], -- Array of prerequisite topic slugs
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(subject_id, slug)
);

-- 3. Add topic_id back to questions table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'questions' 
        AND column_name = 'topic_id'
    ) THEN
        ALTER TABLE questions 
        ADD COLUMN topic_id UUID REFERENCES topics(id) ON DELETE SET NULL;
        
        RAISE NOTICE 'Added topic_id column to questions table';
    ELSE
        RAISE NOTICE 'topic_id column already exists in questions table';
    END IF;
END $$;

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_category_id ON topics(category_id);
CREATE INDEX IF NOT EXISTS idx_topics_parent_id ON topics(parent_topic_id);
CREATE INDEX IF NOT EXISTS idx_topics_slug ON topics(slug);
CREATE INDEX IF NOT EXISTS idx_topics_active ON topics(is_active);
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_categories_subject_id ON topic_categories(subject_id);

-- 5. Create triggers for updated_at
CREATE TRIGGER update_topics_updated_at 
  BEFORE UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topic_categories_updated_at 
  BEFORE UPDATE ON topic_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Add RLS policies
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_categories ENABLE ROW LEVEL SECURITY;

-- Topics: Public read for active topics
CREATE POLICY "Topics are viewable by everyone"
  ON topics FOR SELECT
  USING (is_active = true);

-- Topic Categories: Public read for active categories
CREATE POLICY "Topic categories are viewable by everyone"
  ON topic_categories FOR SELECT
  USING (is_active = true);

-- Admin policies (for users with admin privileges)
CREATE POLICY "Admins can manage topics"
  ON topics FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (
        email = 'reubensunday1220@gmail.com' OR 
        email = 'sophiareignsacademy@gmail.com' OR 
        email = 'gigsdev007@gmail.com'
      )
    )
  );

CREATE POLICY "Admins can manage topic categories"
  ON topic_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() 
      AND (
        email = 'reubensunday1220@gmail.com' OR 
        email = 'sophiareignsacademy@gmail.com' OR 
        email = 'gigsdev007@gmail.com'
      )
    )
  );

-- 7. Create helper functions
CREATE OR REPLACE FUNCTION get_topic_hierarchy(topic_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  level INTEGER,
  path TEXT
) AS $$
WITH RECURSIVE topic_tree AS (
  -- Base case: start with the given topic
  SELECT 
    t.id,
    t.name,
    t.slug,
    t.topic_level as level,
    t.name::TEXT as path,
    0 as depth
  FROM topics t
  WHERE t.id = topic_uuid
  
  UNION ALL
  
  -- Recursive case: get parent topics
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.topic_level as level,
    (p.name || ' > ' || tt.path)::TEXT as path,
    tt.depth + 1
  FROM topics p
  JOIN topic_tree tt ON p.id = tt.id
  WHERE p.parent_topic_id IS NOT NULL
)
SELECT tt.id, tt.name, tt.slug, tt.level, tt.path
FROM topic_tree tt
ORDER BY tt.depth DESC;
$$ LANGUAGE sql STABLE;

-- 8. Create function to get topic statistics
CREATE OR REPLACE FUNCTION get_topic_stats(topic_uuid UUID)
RETURNS TABLE (
  topic_id UUID,
  question_count BIGINT,
  subtopic_count BIGINT,
  avg_difficulty NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH topic_questions AS (
    SELECT COUNT(*) as q_count
    FROM questions q
    WHERE q.topic_id = topic_uuid AND q.is_active = true
  ),
  topic_subtopics AS (
    SELECT COUNT(*) as s_count
    FROM topics t
    WHERE t.parent_topic_id = topic_uuid AND t.is_active = true
  )
  SELECT 
    topic_uuid,
    COALESCE(tq.q_count, 0),
    COALESCE(ts.s_count, 0),
    0::NUMERIC -- Placeholder for difficulty calculation
  FROM topic_questions tq
  CROSS JOIN topic_subtopics ts;
END;
$$ LANGUAGE plpgsql STABLE;

RAISE NOTICE 'Topics structure migration completed successfully!';