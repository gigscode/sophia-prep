-- SETUP TOPICS STRUCTURE
-- Copy and paste this SQL into Supabase Dashboard > SQL Editor and run it

-- 1. Create topic_categories table
CREATE TABLE IF NOT EXISTS topic_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  color_theme TEXT DEFAULT '#3B82F6',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(subject_id, slug)
);

-- 2. Create topics table
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
  estimated_study_time_minutes INTEGER DEFAULT 60,
  prerequisites TEXT[],
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(subject_id, slug)
);

-- 3. Add topic_id to questions table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'questions' 
        AND column_name = 'topic_id'
    ) THEN
        ALTER TABLE questions 
        ADD COLUMN topic_id UUID REFERENCES topics(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Create indexes
CREATE INDEX IF NOT EXISTS idx_topics_subject_id ON topics(subject_id);
CREATE INDEX IF NOT EXISTS idx_topics_category_id ON topics(category_id);
CREATE INDEX IF NOT EXISTS idx_topics_slug ON topics(slug);
CREATE INDEX IF NOT EXISTS idx_questions_topic_id ON questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_categories_subject_id ON topic_categories(subject_id);

-- 5. Create triggers for updated_at
CREATE TRIGGER update_topics_updated_at 
  BEFORE UPDATE ON topics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topic_categories_updated_at 
  BEFORE UPDATE ON topic_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Enable RLS
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE topic_categories ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies
CREATE POLICY "Topics are viewable by everyone"
  ON topics FOR SELECT
  USING (is_active = true);

CREATE POLICY "Topic categories are viewable by everyone"
  ON topic_categories FOR SELECT
  USING (is_active = true);

-- Admin policies
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

SELECT 'Topics structure setup completed!' as result;