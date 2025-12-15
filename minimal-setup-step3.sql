-- STEP 3: Create topics table only
-- Run this after step 2 works

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

SELECT 'Topics table created successfully!' as result;